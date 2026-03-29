class ContactController {
  constructor(contactService) {
    this._contactService = contactService;
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.reply = this.reply.bind(this);
    this.delete = this.delete.bind(this);
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

  async list(req, res, next) {
    try {
      const messages = await this._contactService.getAll();
      res.json(messages);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const message = await this._contactService.getById(req.params.id);
      res.json(message);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const message = await this._contactService.markAsRead(req.params.id, req.user.id);
      res.json(message);
    } catch (err) {
      next(err);
    }
  }

  async reply(req, res, next) {
    try {
      const { content } = req.body;
      const reply = await this._contactService.reply(req.params.id, req.user.id, content);
      res.status(201).json(reply);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await this._contactService.delete(req.params.id);
      res.json({ message: 'Message supprimé.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ContactController;
