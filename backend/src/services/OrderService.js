const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');
const ForbiddenError = require('../errors/ForbiddenError');
const { ORDER_TRANSITIONS } = require('../constants/statuses');
const logger = require('../utils/logger');

class OrderService {
  constructor(pool, orderRepository, pricingService, emailService, analyticsService) {
    this._pool = pool;
    this._orderRepo = orderRepository;
    this._pricingService = pricingService;
    this._emailService = emailService;
    this._analyticsService = analyticsService;
  }

  async list(user, filters) {
    if (user.role === 'user') {
      return this._orderRepo.findAllForUser(user.id, filters);
    }
    return this._orderRepo.findAllForStaff(filters);
  }

  async getById(id, user) {
    const order = user.role === 'user'
      ? await this._orderRepo.findByIdFullForUser(id, user.id)
      : await this._orderRepo.findByIdFull(id);

    if (!order) {
      throw new NotFoundError('Commande non trouvée.');
    }

    order.status_history = await this._orderRepo.findStatusHistory(id);
    order.review = await this._orderRepo.findReviewByOrderId(id);

    return order;
  }

  async create(userId, body) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      const { menu_id, nb_persons, delivery_address, delivery_city, delivery_date, delivery_time, delivery_distance_km } = body;

      const menu = await this._orderRepo.findActiveMenu(menu_id, client);
      if (!menu) {
        throw new NotFoundError('Menu non trouvé ou indisponible.');
      }

      if (nb_persons < menu.min_persons) {
        throw new ValidationError(`Minimum ${menu.min_persons} personnes pour ce menu.`);
      }

      const stockOk = await this._orderRepo.decrementMenuStock(menu_id, client);
      if (!stockOk) {
        throw new ValidationError('Ce menu n\'est plus en stock.');
      }

      const prices = this._pricingService.calculateOrderPrices({
        minPrice: menu.min_price,
        nbPersons: nb_persons,
        minPersons: menu.min_persons,
        deliveryCity: delivery_city,
        deliveryDistanceKm: delivery_distance_km,
      });

      const order = await this._orderRepo.create({
        user_id: userId,
        menu_id,
        nb_persons,
        delivery_address,
        delivery_city,
        delivery_date,
        delivery_time,
        delivery_distance_km,
        menu_price: prices.menuPrice.toFixed(2),
        delivery_price: prices.deliveryPrice.toFixed(2),
        discount: prices.discount.toFixed(2),
        total_price: prices.totalPrice.toFixed(2),
        status: 'deposit_pending',
        deposit_amount: prices.depositAmount.toFixed(2),
      }, client);

      await this._orderRepo.insertStatusHistory(order.id, 'deposit_pending', null, client);

      await client.query('COMMIT');

      // Emails et sync analytics hors transaction (best-effort)
      const orderUser = await this._orderRepo.findUserBasic(userId);
      try {
        await this._emailService.sendDepositRequestEmail(orderUser, order, menu);
      } catch (err) {
        logger.error({ err, code: err.code, response: err.response, command: err.command }, 'Failed to send order confirmation email');
      }

      try {
        await this._analyticsService.syncOrder(order, menu.title);
      } catch (err) {
        logger.error('Failed to sync to MongoDB:', err.message);
      }

      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Modification client : seulement en_attente, le menu ne change pas
  async update(id, user, body) {
    const order = await this._orderRepo.findById(id);
    if (!order) {
      throw new NotFoundError('Commande non trouvée.');
    }

    if (user.role === 'user') {
      if (order.user_id !== user.id) {
        throw new ForbiddenError('Accès non autorisé.');
      }
      if (!['en_attente', 'deposit_pending'].includes(order.status)) {
        throw new ValidationError('Cette commande ne peut plus être modifiée.');
      }
    }

    const menu = await this._orderRepo.findMenu(order.menu_id);

    const newNbPersons = body.nb_persons || order.nb_persons;
    const newCity = body.delivery_city || order.delivery_city;
    const newDistance = body.delivery_distance_km !== undefined
      ? body.delivery_distance_km
      : order.delivery_distance_km;

    if (newNbPersons < menu.min_persons) {
      throw new ValidationError(`Minimum ${menu.min_persons} personnes.`);
    }

    const prices = this._pricingService.calculateOrderPrices({
      minPrice: menu.min_price,
      nbPersons: newNbPersons,
      minPersons: menu.min_persons,
      deliveryCity: newCity,
      deliveryDistanceKm: newDistance,
    });

    const updated = await this._orderRepo.update(id, {
      nb_persons: newNbPersons,
      delivery_address: body.delivery_address,
      delivery_city: body.delivery_city,
      delivery_date: body.delivery_date,
      delivery_time: body.delivery_time,
      delivery_distance_km: newDistance,
      menu_price: prices.menuPrice.toFixed(2),
      delivery_price: prices.deliveryPrice.toFixed(2),
      discount: prices.discount.toFixed(2),
      total_price: prices.totalPrice.toFixed(2),
      deposit_amount: prices.depositAmount.toFixed(2),
    });

    return updated;
  }

  async cancel(id, user) {
    const order = await this._orderRepo.findById(id);
    if (!order) {
      throw new NotFoundError('Commande non trouvée.');
    }

    if (user.role === 'user' && order.user_id !== user.id) {
      throw new ForbiddenError('Accès non autorisé.');
    }

    if (user.role === 'user' && !['en_attente', 'deposit_pending'].includes(order.status)) {
      throw new ValidationError('Cette commande ne peut plus être annulée.');
    }

    await this._orderRepo.updateStatus(id, 'annulee');
    await this._orderRepo.insertStatusHistory(id, 'annulee', user.id);
    await this._orderRepo.incrementMenuStock(order.menu_id);

    return { message: 'Commande annulée.' };
  }

  async confirmDeposit(id, user) {
    const order = await this._orderRepo.findById(id);
    if (!order) throw new NotFoundError('Commande non trouvée.');

    if (order.payment_status !== 'non_paye') {
      throw new ValidationError('L\'acompte a déjà été enregistré.');
    }
    if (!['deposit_pending', 'en_attente'].includes(order.status)) {
      throw new ValidationError('Cette commande n\'est pas en attente d\'acompte.');
    }

    const updated = await this._orderRepo.confirmDeposit(id);
    await this._orderRepo.insertStatusHistory(id, 'confirmed', user.id);

    const recipient = await this._orderRepo.findUserBasic(order.user_id);
    try {
      await this._emailService.sendDepositReceivedEmail(recipient, updated);
    } catch (err) {
      logger.error('sendDepositReceivedEmail failed:', err.message);
    }

    return updated;
  }

  async markPaid(id) {
    const order = await this._orderRepo.findById(id);
    if (!order) throw new NotFoundError('Commande non trouvée.');

    if (order.payment_status === 'paye') {
      throw new ValidationError('Cette commande est déjà marquée comme payée.');
    }

    return this._orderRepo.markPaid(id);
  }

  // Changement de statut par un employé ou admin (workflow avec transitions)
  async updateStatus(id, user, body) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      const { status, reason, contact_method } = body;

      const order = await this._orderRepo.findByIdFull(id, client);
      if (!order) {
        throw new NotFoundError('Commande non trouvée.');
      }

      const allowed = ORDER_TRANSITIONS[order.status];
      if (!allowed || !allowed.includes(status)) {
        throw new ValidationError(
          `Transition de statut invalide : "${order.status}" vers "${status}".`
        );
      }

      // Acompte requis avant préparation
      if (status === 'en_preparation' && order.payment_status !== 'paye' && !order.deposit_paid_at) {
        throw new ValidationError(
          'L\'acompte doit être confirmé avant de passer en préparation.'
        );
      }

      // Annulation employé : on log le contact obligatoirement
      if (status === 'annulee') {
        await this._orderRepo.insertContactLog({
          order_id: id,
          employee_id: user.id,
          reason,
          contact_method,
        }, client);
      }

      await this._orderRepo.updateStatus(id, status, client);
      await this._orderRepo.insertStatusHistory(id, status, user.id, client);

      if (status === 'annulee') {
        await this._orderRepo.incrementMenuStock(order.menu_id, client);
      }

      await client.query('COMMIT');

      // Emails post-transition (best-effort, hors transaction)
      const recipient = { first_name: order.user_first_name, email: order.user_email };
      try {
        if (status === 'terminee') {
          await this._emailService.sendOrderCompletedEmail(recipient, order);
        } else if (status === 'attente_retour_materiel') {
          await this._emailService.sendMaterialReturnEmail(recipient, order);
        }
      } catch (err) {
        logger.error('Email send failed:', err.message);
      }

      return { message: 'Statut mis à jour.' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = OrderService;
