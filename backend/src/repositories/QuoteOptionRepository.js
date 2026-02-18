class QuoteOptionRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  async findAll({ page = 1, limit = 50, includeInactive = false } = {}, client) {
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';
    if (!includeInactive) {
      where = 'WHERE is_active = true';
    }
    const result = await this._db(client).query(
      `SELECT * FROM quote_options ${where} ORDER BY label ASC LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}`,
      params
    );
    const count = await this._db(client).query(
      `SELECT COUNT(*) FROM quote_options ${where}`
    );
    return {
      data: result.rows,
      total: parseInt(count.rows[0].count, 10),
      page,
      limit,
    };
  }

  async findById(id, client) {
    const result = await this._db(client).query(
      'SELECT * FROM quote_options WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data, client) {
    const result = await this._db(client).query(
      `INSERT INTO quote_options (label, description, unit_price, unit)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.label, data.description || null, data.unit_price, data.unit || 'forfait']
    );
    return result.rows[0];
  }

  async update(id, data, client) {
    const result = await this._db(client).query(
      `UPDATE quote_options SET
         label       = COALESCE($1, label),
         description = COALESCE($2, description),
         unit_price  = COALESCE($3, unit_price),
         unit        = COALESCE($4, unit)
       WHERE id = $5
       RETURNING *`,
      [data.label, data.description, data.unit_price, data.unit, id]
    );
    return result.rows[0] || null;
  }

  async softDelete(id, client) {
    const result = await this._db(client).query(
      'UPDATE quote_options SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  }
}

module.exports = QuoteOptionRepository;
