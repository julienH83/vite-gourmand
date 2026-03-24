const NotFoundError = require('../errors/NotFoundError');

class HoursService {
  constructor(hoursRepository) {
    this._hoursRepo = hoursRepository;
  }

  async getAll() {
    return this._hoursRepo.findAll();
  }

  async update(dayOfWeek, data) {
    const updated = await this._hoursRepo.update(dayOfWeek, data);
    if (!updated) {
      throw new NotFoundError('Jour non trouvé.');
    }
    return updated;
  }
}

module.exports = HoursService;
