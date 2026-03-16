const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');

const VALID_TYPES = ['mentions_legales', 'cgv', 'confidentialite'];

class LegalService {
  constructor(legalRepository) {
    this._legalRepo = legalRepository;
  }

  _normalize(rawType) {
    return String(rawType).trim().toLowerCase().replace(/-/g, '_');
  }

  async getByType(rawType) {
    const type = this._normalize(rawType);

    if (!VALID_TYPES.includes(type)) {
      throw new ValidationError('Type invalide.');
    }

    const page = await this._legalRepo.findByType(type);
    if (!page) {
      throw new NotFoundError('Page non trouvée.');
    }

    return page;
  }

  async upsert(rawType, title, content) {
    const type = this._normalize(rawType);

    if (!VALID_TYPES.includes(type)) {
      throw new ValidationError('Type invalide.');
    }
    if (!title || !title.trim()) {
      throw new ValidationError('Le titre est requis.');
    }
    if (!content || !content.trim()) {
      throw new ValidationError('Le contenu est requis.');
    }

    return this._legalRepo.upsert(type, title.trim(), content.trim());
  }
}

module.exports = LegalService;
