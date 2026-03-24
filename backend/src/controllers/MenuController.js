class MenuController {
  constructor(menuService) {
    this._menuService = menuService;
    this.list = this.list.bind(this);
    this.getFilters = this.getFilters.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async list(req, res, next) {
    try {
      const menus = await this._menuService.list(req.query);
      res.json(menus);
    } catch (err) {
      next(err);
    }
  }

  async getFilters(req, res, next) {
    try {
      const filters = await this._menuService.getFilters();
      res.json(filters);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const menu = await this._menuService.getById(req.params.id);
      res.json(menu);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const menu = await this._menuService.create(req.body);
      res.status(201).json(menu);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const menu = await this._menuService.update(req.params.id, req.body);
      res.json(menu);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await this._menuService.delete(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MenuController;
