const logger = require('../utils/logger');

class ContactService {
  constructor(contactRepository, emailService) {
    this._contactRepo = contactRepository;
    this._emailService = emailService;
  }

  async create(data) {
    await this._contactRepo.create(data);

    try {
      await this._emailService.sendContactEmail(data);
    } catch (err) {
      logger.error('Contact email failed:', err.message);
    }

    return { message: 'Message envoy\u00e9 avec succ\u00e8s.' };
  }
}

module.exports = ContactService;
