class QuoteController {
  constructor(quoteService) {
    this._quoteService = quoteService;

    this.list                  = this.list.bind(this);
    this.getById               = this.getById.bind(this);
    this.create                = this.create.bind(this);
    this.update                = this.update.bind(this);
    this.send                  = this.send.bind(this);
    this.accept                = this.accept.bind(this);
    this.refuse                = this.refuse.bind(this);
    this.deposit               = this.deposit.bind(this);
    this.convert               = this.convert.bind(this);
    this.delete                = this.delete.bind(this);
    this.expireOverdue         = this.expireOverdue.bind(this);

    this.sendDepositInstructions = this.sendDepositInstructions.bind(this);
  }

  async list(req, res, next) {
    try {
      const result = await this._quoteService.list(req.user, req.query);
      res.json(result);
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const quote = await this._quoteService.getById(req.params.id, req.user);
      res.json(quote);
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const quote = await this._quoteService.createDraft(req.user.id, req.body);
      res.status(201).json(quote);
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const quote = await this._quoteService.update(req.params.id, req.user, req.body);
      res.json(quote);
    } catch (err) { next(err); }
  }

  async send(req, res, next) {
    try {
      const quote = await this._quoteService.send(req.params.id, req.user);
      res.json(quote);
    } catch (err) { next(err); }
  }

  async accept(req, res, next) {
    try {
      const quote = await this._quoteService.accept(req.params.id, req.user);
      res.json(quote);
    } catch (err) { next(err); }
  }

  async refuse(req, res, next) {
    try {
      const result = await this._quoteService.refuse(req.params.id, req.user);
      res.json(result);
    } catch (err) { next(err); }
  }

  async deposit(req, res, next) {
    try {
      const quote = await this._quoteService.recordDeposit(
        req.params.id,
        req.user,
        req.body.deposit_ref
      );
      res.json(quote);
    } catch (err) { next(err); }
  }

  async convert(req, res, next) {
    try {
      const result = await this._quoteService.convertToOrder(req.params.id, req.user);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      const result = await this._quoteService.delete(req.params.id, req.user);
      res.json(result);
    } catch (err) { next(err); }
  }

  async expireOverdue(req, res, next) {
    try {
      const result = await this._quoteService.expireOverdue();
      res.json(result);
    } catch (err) { next(err); }
  }

  async sendDepositInstructions(req, res, next) {
    try {
      const quote = await this._quoteService.sendDepositInstructions(
        req.params.id,
        req.user
      );
      res.json(quote);
    } catch (err) { next(err); }
  }
}

module.exports = QuoteController;