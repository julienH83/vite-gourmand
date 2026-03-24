const NotFoundError = require('../errors/NotFoundError');

class DishService {
  constructor(dishRepository) {
    this._dishRepo = dishRepository;
  }

  async list(filters) {
    return this._dishRepo.findAll(filters);
  }

  async create(data) {
    return this._dishRepo.create(data);
  }

  async update(id, data) {
    const updated = await this._dishRepo.update(id, data);
    if (!updated) {
      throw new NotFoundError('Plat non trouvé.');
    }
    return updated;
  }

  async delete(id) {
    const deleted = await this._dishRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Plat non trouvé.');
    }
    return { message: 'Plat supprimé.' };
  }
}

module.exports = DishService;
