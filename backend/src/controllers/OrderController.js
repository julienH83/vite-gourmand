class OrderController {
  constructor(orderService) {
    this._orderService = orderService;
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.cancel = this.cancel.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.confirmDeposit = this.confirmDeposit.bind(this);
    this.markPaid = this.markPaid.bind(this);
  }

  async list(req, res, next) {
    try {
      const orders = await this._orderService.list(req.user, req.query);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await this._orderService.getById(req.params.id, req.user);
      res.json(order);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const order = await this._orderService.create(req.user.id, req.body);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const order = await this._orderService.update(req.params.id, req.user, req.body);
      res.json(order);
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const result = await this._orderService.cancel(req.params.id, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const result = await this._orderService.updateStatus(req.params.id, req.user, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
  async confirmDeposit(req, res, next) {
    try {
      const order = await this._orderService.confirmDeposit(req.params.id, req.user);
      res.json(order);
    } catch (err) {
      next(err);
    }
  }

  async markPaid(req, res, next) {
    try {
      const order = await this._orderService.markPaid(req.params.id);
      res.json(order);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrderController;
