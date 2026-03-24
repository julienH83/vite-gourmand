const NotFoundError  = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');
const ForbiddenError  = require('../errors/ForbiddenError');
const { QUOTE_TRANSITIONS, QUOTE_VALIDITY_DAYS } = require('../constants/statuses');
const logger = require('../utils/logger');

class QuoteService {
  constructor(pool, quoteRepository, emailService) {
    this._pool         = pool;
    this._quoteRepo    = quoteRepository;
    this._emailService = emailService;
  }

  // --- Helpers privés ---

  _calculateAmounts(items, guestCount, discountPct = 0) {
    let subtotal = 0;
    const processedItems = items.map(item => {
      let lineTotal;
      if (item.unit === 'par_personne') {
        lineTotal = parseFloat(item.unit_price) * guestCount;
      } else {
        lineTotal = parseFloat(item.unit_price) * item.quantity;
      }
      lineTotal = parseFloat(lineTotal.toFixed(2));
      subtotal += lineTotal;
      return { ...item, line_total: lineTotal };
    });

    subtotal = parseFloat(subtotal.toFixed(2));
    const discountAmount = parseFloat((subtotal * discountPct / 100).toFixed(2));
    const total          = parseFloat((subtotal - discountAmount).toFixed(2));
    const depositAmount  = parseFloat((total * 0.30).toFixed(2));

    return { processedItems, subtotal, discountPct, discountAmount, total, depositAmount };
  }

  _defaultValidUntil() {
    const d = new Date();
    d.setDate(d.getDate() + QUOTE_VALIDITY_DAYS);
    return d.toISOString().slice(0, 10);
  }

  _assertTransition(currentStatus, targetStatus) {
    const allowed = QUOTE_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new ValidationError(`Transition invalide : "${currentStatus}" → "${targetStatus}".`);
    }
  }

  async _assertOwnershipOrStaff(quoteId, user) {
    if (user.role !== 'user') return null;
    const quote = await this._quoteRepo.findByIdAndUserId(quoteId, user.id);
    if (!quote) throw new ForbiddenError('Accès non autorisé.');
    return quote;
  }

  // --- Lecture ---

  async list(user, filters) {
    if (user.role === 'user') {
      return this._quoteRepo.findAllForUser(user.id, filters);
    }
    return this._quoteRepo.findAllForStaff(filters);
  }

  async getById(id, user) {
    const quote = await this._quoteRepo.findByIdFull(id);
    if (!quote) throw new NotFoundError('Devis non trouvé.');
    if (user.role === 'user' && quote.user_id !== user.id) {
      throw new ForbiddenError('Accès non autorisé.');
    }
    return quote;
  }

  // --- Création / modification ---

  async createDraft(userId, body) {
    const {
      event_type, event_date, event_time, event_address, event_city,
      guest_count, dietary_notes, client_message, items, discount_pct = 0,
    } = body;

    const { processedItems, subtotal, discountAmount, total, depositAmount } =
      this._calculateAmounts(items, guest_count, discount_pct);

    const client = await this._pool.connect();
    let newQuoteId;
    try {
      await client.query('BEGIN');

      const quote = await this._quoteRepo.create({
        user_id: userId,
        event_type, event_date,
        event_time: event_time || null,
        event_address, event_city, guest_count,
        dietary_notes: dietary_notes || null,
        client_message: client_message || null,
        subtotal, discount_pct: discount_pct,
        discount_amount: discountAmount,
        total, deposit_amount: depositAmount,
        valid_until: this._defaultValidUntil(),
      }, client);

      await this._quoteRepo.insertItems(quote.id, processedItems, client);
      await this._quoteRepo.insertStatusHistory(quote.id, 'draft', userId, null, client);

      newQuoteId = quote.id;
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const fullQuote = await this._quoteRepo.findByIdFull(newQuoteId);
    const user = await this._quoteRepo.findUserBasic(userId);
    try {
      await this._emailService.sendNewQuoteAdminEmail(user, fullQuote);
    } catch (err) {
      logger.error('sendNewQuoteAdminEmail failed:', err.message);
    }

    return fullQuote;
  }

  async update(id, user, body) {
    const existing = await this._quoteRepo.findById(id);
    if (!existing) throw new NotFoundError('Devis non trouvé.');

    if (user.role === 'user') {
      if (existing.user_id !== user.id) throw new ForbiddenError('Accès non autorisé.');
      if (existing.status !== 'draft') {
        throw new ValidationError('Seul un devis en brouillon peut être modifié par le client.');
      }
    }

    const guestCount  = body.guest_count  ?? existing.guest_count;
    const discountPct = body.discount_pct ?? parseFloat(existing.discount_pct);
    const items       = body.items;

    let amounts = null;
    if (items) {
      amounts = this._calculateAmounts(items, guestCount, discountPct);
    }

    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      if (items) {
        await this._quoteRepo.deleteItems(id, client);
        await this._quoteRepo.insertItems(id, amounts.processedItems, client);
      }

      await this._quoteRepo.update(id, {
        event_type:      body.event_type,
        event_date:      body.event_date,
        event_time:      body.event_time,
        event_address:   body.event_address,
        event_city:      body.event_city,
        guest_count:     guestCount,
        dietary_notes:   body.dietary_notes,
        client_message:  body.client_message,
        internal_notes:  user.role !== 'user' ? body.internal_notes : undefined,
        assigned_to:     user.role !== 'user' ? body.assigned_to    : undefined,
        valid_until:     user.role !== 'user' ? body.valid_until    : undefined,
        subtotal:        amounts ? amounts.subtotal       : parseFloat(existing.subtotal),
        discount_pct:    amounts ? amounts.discountPct    : discountPct,
        discount_amount: amounts ? amounts.discountAmount : parseFloat(existing.discount_amount),
        total:           amounts ? amounts.total          : parseFloat(existing.total),
        deposit_amount:  amounts ? amounts.depositAmount  : parseFloat(existing.deposit_amount),
      }, client);

      await client.query('COMMIT');
      return this._quoteRepo.findByIdFull(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- Workflow de devis ---

  async send(id, staffUser) {
    const quote = await this._quoteRepo.findById(id);
    if (!quote) throw new NotFoundError('Devis non trouvé.');
    this._assertTransition(quote.status, 'sent');

    if (!quote.valid_until) throw new ValidationError('La date de validité doit être définie avant l\'envoi.');
    if (new Date(quote.valid_until) < new Date()) throw new ValidationError('La date de validité est déjà dépassée.');

    await this._quoteRepo.updateStatus(id, 'sent', { sent_at: new Date() });
    await this._quoteRepo.insertStatusHistory(id, 'sent', staffUser.id, null);

    const user = await this._quoteRepo.findUserBasic(quote.user_id);
    try {
      await this._emailService.sendQuoteEmail(user, await this._quoteRepo.findByIdFull(id));
    } catch (err) {
      logger.error('sendQuoteEmail failed:', err.message);
    }

    return this._quoteRepo.findByIdFull(id);
  }

  async accept(id, user) {
    const quote = await this._quoteRepo.findById(id);
    if (!quote) throw new NotFoundError('Devis non trouvé.');
    if (quote.user_id !== user.id) throw new ForbiddenError('Accès non autorisé.');
    this._assertTransition(quote.status, 'accepted');

    if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
      throw new ValidationError('Ce devis a expiré et ne peut plus être accepté.');
    }

    const { quoteConflicts, orderConflicts } =
      await this._quoteRepo.checkDateAvailability(quote.event_date, id);

    if (quoteConflicts > 0 || orderConflicts > 0) {
      throw new ValidationError('Cette date n\'est plus disponible. Veuillez contacter notre équipe.');
    }

    await this._quoteRepo.updateStatus(id, 'accepted', { accepted_at: new Date() });
    await this._quoteRepo.insertStatusHistory(id, 'accepted', user.id, null);

    const clientUser = await this._quoteRepo.findUserBasic(quote.user_id);
    try {
      await this._emailService.sendQuoteConfirmedEmail(
        clientUser,
        await this._quoteRepo.findByIdFull(id)
      );
    } catch (err) {
      logger.error('sendQuoteConfirmedEmail failed:', err.message);
    }

    return this._quoteRepo.findByIdFull(id);
  }

  // Envoi des instructions d'acompte (IBAN, etc.) après acceptation
  async sendDepositInstructions(id, staffUser) {
    const quote = await this._quoteRepo.findById(id);
    if (!quote) throw new NotFoundError('Devis non trouvé.');

    if (quote.status !== 'accepted') {
      throw new ValidationError("Vous pouvez envoyer les instructions d'acompte uniquement quand le devis est accepté.");
    }

    await this._quoteRepo.updateStatus(id, 'accepted', {
      deposit_instructions_sent_at: new Date(),
      deposit_instructions_sent_by: staffUser.id,
    });
    await this._quoteRepo.insertStatusHistory(id, 'accepted', staffUser.id, 'Instructions acompte envoyées');

    const clientUser = await this._quoteRepo.findUserBasic(quote.user_id);
    try {
      await this._emailService.sendQuoteAcceptedEmail(
        clientUser,
        await this._quoteRepo.findByIdFull(id)
      );
    } catch (err) {
      logger.error('sendQuoteAcceptedEmail failed:', err.message);
    }

    return this._quoteRepo.findByIdFull(id);
  }

  async refuse(id, user) {
    const quote = await this._quoteRepo.findById(id);
    if (!quote) throw new NotFoundError('Devis non trouvé.');

    if (user.role === 'user' && quote.user_id !== user.id) {
      throw new ForbiddenError('Accès non autorisé.');
    }
    this._assertTransition(quote.status, 'refuse');

    await this._quoteRepo.updateStatus(id, 'refuse', { refused_at: new Date() });
    await this._quoteRepo.insertStatusHistory(id, 'refuse', user.id, null);

    const fullQuote = await this._quoteRepo.findByIdFull(id);
    const clientUser = await this._quoteRepo.findUserBasic(quote.user_id);

    if (user.role === 'user') {
      try {
        await this._emailService.sendQuoteRefusedEmail(fullQuote);
      } catch (err) {
        logger.error('sendQuoteRefusedEmail failed:', err.message);
      }
    } else {
      if (clientUser) {
        try {
          await this._emailService.sendStaffRefusedQuoteEmail(clientUser, fullQuote);
        } catch (err) {
          logger.error('sendStaffRefusedQuoteEmail failed:', err.message);
        }
      }
    }

    return { message: 'Devis refusé.' };
  }

  async recordDeposit(id, staffUser, depositRef) {
    const quote = await this._quoteRepo.findById(id);
    if (!quote) throw new NotFoundError('Devis non trouvé.');
    this._assertTransition(quote.status, 'acompte_paye');

    if (!depositRef || !depositRef.trim()) {
      throw new ValidationError('La référence de paiement est obligatoire.');
    }

    if (!quote.deposit_instructions_sent_at) {
      throw new ValidationError("Vous devez d'abord envoyer les instructions d'acompte au client.");
    }

    await this._quoteRepo.updateStatus(id, 'acompte_paye', {
      deposit_paid_at: new Date(),
      deposit_ref: depositRef.trim(),
    });
    await this._quoteRepo.insertStatusHistory(id, 'acompte_paye', staffUser.id, `Réf: ${depositRef}`);

    const clientUser = await this._quoteRepo.findUserBasic(quote.user_id);
    try {
      await this._emailService.sendDepositConfirmedEmail(
        clientUser,
        await this._quoteRepo.findByIdFull(id)
      );
    } catch (err) {
      logger.error('sendDepositConfirmedEmail failed:', err.message);
    }

    return this._quoteRepo.findByIdFull(id);
  }

  async convertToOrder(id, staffUser) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      const quote = await this._quoteRepo.findByIdFull(id, client);
      if (!quote) throw new NotFoundError('Devis non trouvé.');
      this._assertTransition(quote.status, 'converti_en_commande');

      if (quote.status !== 'acompte_paye') {
        throw new ValidationError("Impossible de convertir en commande : acompte non réglé.");
      }

      const menuItem = await this._quoteRepo.findFirstMenuItem(id, client);
      if (!menuItem) throw new ValidationError('Le devis ne contient pas de menu principal pour créer une commande.');
      if (menuItem.stock <= 0) throw new ValidationError('Le menu sélectionné n\'est plus en stock.');

      const stockResult = await client.query(
        'UPDATE menus SET stock = stock - 1 WHERE id = $1 AND stock > 0',
        [menuItem.menu_id]
      );
      if (stockResult.rowCount === 0) throw new ValidationError('Le menu n\'est plus disponible.');

      const depositAmount = parseFloat(quote.deposit_amount) || parseFloat((parseFloat(quote.total) * 0.30).toFixed(2));
      const orderResult = await client.query(
        `INSERT INTO orders
           (user_id, menu_id, nb_persons, delivery_address, delivery_city,
            delivery_date, delivery_time, delivery_distance_km,
            menu_price, delivery_price, discount, total_price, status,
            quote_id, payment_method, payment_status, deposit_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'en_attente',
                 $13,'virement','non_paye',$14)
         RETURNING *`,
        [
          quote.user_id,
          menuItem.menu_id,
          quote.guest_count,
          quote.event_address,
          quote.event_city,
          quote.event_date,
          quote.event_time || '12:00',
          0,
          menuItem.unit_price,
          0,
          parseFloat(quote.discount_amount),
          parseFloat(quote.total),
          id,
          depositAmount,
        ]
      );
      const order = orderResult.rows[0];

      await client.query(
        'INSERT INTO order_status_history (order_id, status, changed_by) VALUES ($1,$2,$3)',
        [order.id, 'en_attente', staffUser.id]
      );

      await this._quoteRepo.updateStatus(id, 'converti_en_commande', { converted_order_id: order.id }, client);
      await this._quoteRepo.insertStatusHistory(id, 'converti_en_commande', staffUser.id, `Commande créée : ${order.id}`, client);

      await client.query('COMMIT');

      const clientUser = await this._quoteRepo.findUserBasic(quote.user_id);
      try {
        await this._emailService.sendQuoteConvertedEmail(clientUser, order);
      } catch (err) {
        logger.error('sendQuoteConvertedEmail failed:', err.message);
      }

      return { order_id: order.id, quote_id: id };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async delete(id, user) {
    const quote = await this._quoteRepo.findById(id);
    if (!quote) throw new NotFoundError('Devis non trouvé.');

    if (user.role === 'user') {
      if (quote.user_id !== user.id) throw new ForbiddenError('Accès non autorisé.');
      if (quote.status !== 'draft') throw new ValidationError('Seul un devis en brouillon peut être supprimé.');
    }

    await this._quoteRepo.delete(id);
    return { message: 'Devis supprimé.' };
  }

  async expireOverdue() {
    const expired = await this._quoteRepo.expireOverdue();
    for (const q of expired) {
      await this._quoteRepo.insertStatusHistory(q.id, 'expire', null, 'Expiration automatique');
      const user = await this._quoteRepo.findUserBasic(q.user_id);
      if (user) {
        try {
          await this._emailService.sendQuoteExpiredEmail(user, q);
        } catch (err) {
          logger.error('sendQuoteExpiredEmail failed:', err.message);
        }
      }
    }
    return { expired: expired.length };
  }
}

module.exports = QuoteService;
