class DishRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  async findAll(filters = {}, client) {
    let query = 'SELECT * FROM dishes';
    const params = [];

    if (filters.type) {
      query += ' WHERE type = $1';
      params.push(filters.type);
    }

    query += ' ORDER BY type, name';
    const result = await this._db(client).query(query, params);
    return result.rows;
  }

  async findById(id, client) {
    const result = await this._db(client).query(
      'SELECT * FROM dishes WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data, client) {
    const { name, description, type, allergens } = data;
    const result = await this._db(client).query(
      'INSERT INTO dishes (name, description, type, allergens) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || null, type, allergens || []]
    );
    return result.rows[0];
  }

  async update(id, data, client) {
    const { name, description, type, allergens } = data;
    const result = await this._db(client).query(
      `UPDATE dishes SET name = COALESCE($1, name), description = COALESCE($2, description),
       type = COALESCE($3, type), allergens = COALESCE($4, allergens)
       WHERE id = $5 RETURNING *`,
      [name, description, type, allergens, id]
    );
    return result.rows[0] || null;
  }

  async delete(id, client) {
    const result = await this._db(client).query(
      'DELETE FROM dishes WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = DishRepository;
