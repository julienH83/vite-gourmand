class LegalController {
  constructor(legalService) {
    this._legalService = legalService;
    this.getByType = this.getByType.bind(this);
    this.upsert = this.upsert.bind(this);
  }

  async getByType(req, res, next) {
    try {
      const page = await this._legalService.getByType(req.params.type);
      res.json(page);
    } catch (err) {
      next(err);
    }
  }

  async upsert(req, res, next) {
    try {
      const { title, content } = req.body;
      const page = await this._legalService.upsert(req.params.type, title, content);
      res.json(page);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LegalController;
