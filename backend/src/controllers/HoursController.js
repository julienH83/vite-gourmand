class HoursController {
  constructor(hoursService) {
    this._hoursService = hoursService;
    this.getAll = this.getAll.bind(this);
    this.update = this.update.bind(this);
  }

  async getAll(req, res, next) {
    try {
      const hours = await this._hoursService.getAll();
      res.json(hours);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await this._hoursService.update(req.params.dayOfWeek, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = HoursController;
