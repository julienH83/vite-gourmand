class ReviewController {
  constructor(reviewService) {
    this._reviewService = reviewService;
    this.listApproved = this.listApproved.bind(this);
    this.listPending = this.listPending.bind(this);
    this.create = this.create.bind(this);
    this.validate = this.validate.bind(this);
  }

  async listApproved(req, res, next) {
    try {
      const reviews = await this._reviewService.listApproved();
      res.json(reviews);
    } catch (err) {
      next(err);
    }
  }

  async listPending(req, res, next) {
    try {
      const reviews = await this._reviewService.listPending();
      res.json(reviews);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const review = await this._reviewService.create(req.params.orderId, req.user.id, req.body);
      res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  }

  async validate(req, res, next) {
    try {
      const review = await this._reviewService.validate(req.params.id, req.user.id, req.body.status);
      res.json(review);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReviewController;
