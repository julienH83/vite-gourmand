class ContactController {
  constructor(contactService) {
    this._contactService = contactService;
    this.create = this.create.bind(this);
  }

  async create(req, res, next) {
    try {
      const { title, description, email } = req.body;
      const result = await this._contactService.create({ title, description, email });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ContactController;
