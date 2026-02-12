class MenuRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  async findAllActive(filters = {}, client) {
    let query = `
      SELECT m.*,
        COALESCE(
          json_agg(
            json_build_object('id', d.id, 'name', d.name, 'type', d.type, 'allergens', d.allergens)
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS dishes,
        COALESCE(AVG(r.rating) FILTER (WHERE r.status = 'approved'), 0) AS avg_rating,
        COUNT(r.id) FILTER (WHERE r.status = 'approved') AS review_count
      FROM menus m
      LEFT JOIN menu_dishes md ON m.id = md.menu_id
      LEFT JOIN dishes d ON md.dish_id = d.id
      LEFT JOIN reviews r ON m.id = r.menu_id
      WHERE m.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.theme) {
      query += ` AND m.theme = $${paramIndex++}`;
      params.push(filters.theme);
    }
    if (filters.diet) {
      query += ` AND m.diet = $${paramIndex++}`;
      params.push(filters.diet);
    }
    if (filters.min_persons) {
      query += ` AND m.min_persons <= $${paramIndex++}`;
      params.push(parseInt(filters.min_persons, 10));
    }
    if (filters.price_min) {
      query += ` AND m.min_price >= $${paramIndex++}`;
      params.push(parseFloat(filters.price_min));
    }
    if (filters.price_max) {
      query += ` AND m.min_price <= $${paramIndex++}`;
      params.push(parseFloat(filters.price_max));
    }

    query += ' GROUP BY m.id ORDER BY m.created_at DESC';

    const result = await this._db(client).query(query, params);
    return result.rows;
  }

  async findFilters(client) {
    const themes = await this._db(client).query(
      'SELECT DISTINCT theme FROM menus WHERE is_active = true ORDER BY theme'
    );
    const diets = await this._db(client).query(
      'SELECT DISTINCT diet FROM menus WHERE is_active = true ORDER BY diet'
    );
    const prices = await this._db(client).query(
      'SELECT MIN(min_price) AS min, MAX(min_price) AS max FROM menus WHERE is_active = true'
    );

    return {
      themes: themes.rows.map(r => r.theme),
      diets: diets.rows.map(r => r.diet),
      priceRange: prices.rows[0],
    };
  }

  async findByIdWithDetails(id, client) {
    const result = await this._db(client).query(
      `SELECT m.*,
        COALESCE(
          json_agg(
            json_build_object('id', d.id, 'name', d.name, 'description', d.description, 'type', d.type, 'allergens', d.allergens)
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS dishes,
        COALESCE(AVG(r.rating) FILTER (WHERE r.status = 'approved'), 0) AS avg_rating,
        COUNT(r.id) FILTER (WHERE r.status = 'approved') AS review_count
      FROM menus m
      LEFT JOIN menu_dishes md ON m.id = md.menu_id
      LEFT JOIN dishes d ON md.dish_id = d.id
      LEFT JOIN reviews r ON m.id = r.menu_id
      WHERE m.id = $1
      GROUP BY m.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findById(id, client) {
    const result = await this._db(client).query(
      'SELECT * FROM menus WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findActiveById(id, client) {
    const result = await this._db(client).query(
      'SELECT * FROM menus WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data, client) {
    const { title, description, theme, diet, min_persons, min_price, stock, conditions, image_url } = data;
    const result = await this._db(client).query(
      `INSERT INTO menus (title, description, theme, diet, min_persons, min_price, stock, conditions, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, theme, diet, min_persons, min_price, stock, conditions || null, image_url || null]
    );
    return result.rows[0];
  }

  async update(id, data, client) {
    const { title, description, theme, diet, min_persons, min_price, stock, conditions, image_url, is_active } = data;
    const result = await this._db(client).query(
      `UPDATE menus SET title = COALESCE($1, title), description = COALESCE($2, description),
       theme = COALESCE($3, theme), diet = COALESCE($4, diet), min_persons = COALESCE($5, min_persons),
       min_price = COALESCE($6, min_price), stock = COALESCE($7, stock), conditions = COALESCE($8, conditions),
       image_url = COALESCE($9, image_url), is_active = COALESCE($10, is_active)
       WHERE id = $11 RETURNING *`,
      [title, description, theme, diet, min_persons, min_price, stock, conditions, image_url, is_active, id]
    );
    return result.rows[0] || null;
  }

  async softDelete(id, client) {
    const result = await this._db(client).query(
      'UPDATE menus SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }

  async setDishes(menuId, dishIds, client) {
    await this._db(client).query(
      'DELETE FROM menu_dishes WHERE menu_id = $1',
      [menuId]
    );
    for (const dishId of dishIds) {
      await this._db(client).query(
        'INSERT INTO menu_dishes (menu_id, dish_id) VALUES ($1, $2)',
        [menuId, dishId]
      );
    }
  }

  async decrementStock(menuId, client) {
    await this._db(client).query(
      'UPDATE menus SET stock = stock - 1 WHERE id = $1',
      [menuId]
    );
  }

  async incrementStock(menuId, client) {
    await this._db(client).query(
      'UPDATE menus SET stock = stock + 1 WHERE id = $1',
      [menuId]
    );
  }

  async findApprovedReviews(menuId, client) {
    const result = await this._db(client).query(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.menu_id = $1 AND r.status = 'approved'
       ORDER BY r.created_at DESC`,
      [menuId]
    );
    return result.rows;
  }

  async findImagesByMenuId(menuId, client) {
    const result = await this._db(client).query(
      'SELECT url FROM menu_images WHERE menu_id = $1 ORDER BY position',
      [menuId]
    );
    return result.rows.map(r => r.url);
  }

  async findImagesByMenuIds(menuIds, client) {
    if (!menuIds.length) return {};
    const result = await this._db(client).query(
      'SELECT menu_id, url FROM menu_images WHERE menu_id = ANY($1) ORDER BY position',
      [menuIds]
    );
    const map = {};
    for (const row of result.rows) {
      if (!map[row.menu_id]) map[row.menu_id] = [];
      map[row.menu_id].push(row.url);
    }
    return map;
  }
}

module.exports = MenuRepository;
