class QuoteOptionController {
  constructor(quoteOptionService) {
    this._service = quoteOptionService;
    this.list    = this.list.bind(this);
    this.create  = this.create.bind(this);
    this.update  = this.update.bind(this);
    this.remove  = this.remove.bind(this);
  }

  async list(req, res, next) {
    try {
      const includeInactive = req.user?.role === 'admin' && req.query.all === 'true';
      const result = await this._service.list({
        page:            req.query.page,
        limit:           req.query.limit,
        includeInactive,
      });
      res.json(result);
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const option = await this._service.create(req.body);
      res.status(201).json(option);
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const option = await this._service.update(req.params.id, req.body);
      res.json(option);
    } catch (err) { next(err); }
  }

  async remove(req, res, next) {
    try {
      const result = await this._service.remove(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  }
}

module.exports = QuoteOptionController;
