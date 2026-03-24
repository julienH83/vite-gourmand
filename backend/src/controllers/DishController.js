class DishController {
  constructor(dishService) {
    this._dishService = dishService;
    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async list(req, res, next) {
    try {
      const dishes = await this._dishService.list(req.query);
      res.json(dishes);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const dish = await this._dishService.create(req.body);
      res.status(201).json(dish);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const dish = await this._dishService.update(req.params.id, req.body);
      res.json(dish);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await this._dishService.delete(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DishController;
