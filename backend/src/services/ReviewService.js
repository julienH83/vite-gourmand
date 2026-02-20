const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');
const ConflictError = require('../errors/ConflictError');

class ReviewService {
  constructor(reviewRepository, orderRepository) {
    this._reviewRepo = reviewRepository;
    this._orderRepo = orderRepository;
  }

  async listApproved() {
    return this._reviewRepo.findApproved();
  }

  async listPending() {
    return this._reviewRepo.findPending();
  }

  async create(orderId, userId, data) {
    const order = await this._orderRepo.findByIdAndUserId(orderId, userId);
    if (!order) {
      throw new NotFoundError('Commande non trouvée.');
    }

    if (order.status !== 'terminee') {
      throw new ValidationError('Vous ne pouvez donner un avis que sur une commande terminée.');
    }

    const existing = await this._reviewRepo.findByOrderId(orderId);
    if (existing) {
      throw new ConflictError('Vous avez déjà donné un avis pour cette commande.');
    }

    return this._reviewRepo.create({
      order_id: orderId,
      user_id: userId,
      menu_id: order.menu_id,
      rating: data.rating,
      comment: data.comment || null,
    });
  }

  async validate(reviewId, validatedBy, status) {
    if (!['approved', 'rejected'].includes(status)) {
      throw new ValidationError('Statut invalide (approved ou rejected).');
    }

    const updated = await this._reviewRepo.updateStatus(reviewId, status, validatedBy);
    if (!updated) {
      throw new NotFoundError('Avis non trouvé.');
    }

    return updated;
  }
}

module.exports = ReviewService;
