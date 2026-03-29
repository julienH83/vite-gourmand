const logger = require('../utils/logger');
const NotFoundError = require('../errors/NotFoundError');

class ContactService {
  constructor(contactRepository, emailService) {
    this._contactRepo = contactRepository;
    this._emailService = emailService;
  }

  async create(data) {
    const message = await this._contactRepo.create(data);

    try {
      await this._emailService.sendContactEmail(data);
    } catch (err) {
      logger.error('Contact email failed:', err.message);
    }

    return message;
  }

  async getAll() {
    return this._contactRepo.getAll();
  }

  async getById(id) {
    const message = await this._contactRepo.getById(id);
    if (!message) throw new NotFoundError('Message non trouvé.');
    return message;
  }

  async markAsRead(id, userId) {
    const message = await this._contactRepo.markAsRead(id, userId);
    if (!message) throw new NotFoundError('Message non trouvé.');
    return message;
  }

  async reply(messageId, authorId, content) {
    const message = await this._contactRepo.getById(messageId);
    if (!message) throw new NotFoundError('Message non trouvé.');

    const reply = await this._contactRepo.addReply(messageId, authorId, content);

    try {
      await this._emailService.sendContactReplyEmail(message, content);
    } catch (err) {
      logger.error('Contact reply email failed:', err.message);
    }

    return reply;
  }

  async delete(id) {
    const message = await this._contactRepo.delete(id);
    if (!message) throw new NotFoundError('Message non trouvé.');
    return message;
  }
}

module.exports = ContactService;
