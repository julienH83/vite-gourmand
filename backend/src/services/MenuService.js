const NotFoundError = require('../errors/NotFoundError');

class MenuService {
  constructor(pool, menuRepository) {
    this._pool = pool;
    this._menuRepo = menuRepository;
  }

  async list(filters) {
    const menus = await this._menuRepo.findAllActive(filters);
    const ids = menus.map(m => m.id);
    const imagesMap = await this._menuRepo.findImagesByMenuIds(ids);
    return menus.map(m => ({ ...m, images: imagesMap[m.id] || [] }));
  }

  async getFilters() {
    return this._menuRepo.findFilters();
  }

  async getById(id) {
    const menu = await this._menuRepo.findByIdWithDetails(id);
    if (!menu) {
      throw new NotFoundError('Menu non trouvé.');
    }

    const [reviews, images] = await Promise.all([
      this._menuRepo.findApprovedReviews(id),
      this._menuRepo.findImagesByMenuId(id),
    ]);
    menu.reviews = reviews;
    menu.images = images;

    return menu;
  }

  async create(data) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      const { dish_ids, ...menuData } = data;
      const menu = await this._menuRepo.create(menuData, client);

      if (dish_ids && dish_ids.length > 0) {
        await this._menuRepo.setDishes(menu.id, dish_ids, client);
      }

      await client.query('COMMIT');
      return menu;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id, data) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      const { dish_ids, ...menuData } = data;
      const menu = await this._menuRepo.update(id, menuData, client);
      if (!menu) {
        throw new NotFoundError('Menu non trouvé.');
      }

      if (dish_ids !== undefined) {
        await this._menuRepo.setDishes(id, dish_ids, client);
      }

      await client.query('COMMIT');
      return menu;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async delete(id) {
    const deleted = await this._menuRepo.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Menu non trouvé.');
    }
    return { message: 'Menu désactivé.' };
  }
}

module.exports = MenuService;
