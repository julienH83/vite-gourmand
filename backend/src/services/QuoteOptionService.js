const NotFoundError = require('../errors/NotFoundError');

class QuoteOptionService {
  constructor(quoteOptionRepository) {
    this._repo = quoteOptionRepository;
  }

  async list(filters) {
    return this._repo.findAll(filters);
  }

  async create(data) {
    return this._repo.create(data);
  }

  async update(id, data) {
    const option = await this._repo.update(id, data);
    if (!option) throw new NotFoundError('Option non trouvée.');
    return option;
  }

  async remove(id) {
    const ok = await this._repo.softDelete(id);
    if (!ok) throw new NotFoundError('Option non trouvée.');
    return { message: 'Option désactivée.' };
  }
}

module.exports = QuoteOptionService;
