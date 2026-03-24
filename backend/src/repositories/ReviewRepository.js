class ReviewRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  async findApproved(client) {
    const result = await this._db(client).query(
      `SELECT r.*, u.first_name, u.last_name, m.title as menu_title
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN menus m ON r.menu_id = m.id
       WHERE r.status = 'approved'
       ORDER BY r.created_at DESC`
    );
    return result.rows;
  }

  async findPending(client) {
    const result = await this._db(client).query(
      `SELECT r.*, u.first_name, u.last_name, m.title as menu_title
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN menus m ON r.menu_id = m.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC`
    );
    return result.rows;
  }

  async findByOrderId(orderId, client) {
    const result = await this._db(client).query(
      'SELECT * FROM reviews WHERE order_id = $1',
      [orderId]
    );
    return result.rows[0] || null;
  }

  async create(data, client) {
    const result = await this._db(client).query(
      `INSERT INTO reviews (order_id, user_id, menu_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.order_id, data.user_id, data.menu_id, data.rating, data.comment]
    );
    return result.rows[0];
  }

  async updateStatus(id, status, validatedBy, client) {
    const result = await this._db(client).query(
      'UPDATE reviews SET status = $1, validated_by = $2 WHERE id = $3 RETURNING *',
      [status, validatedBy, id]
    );
    return result.rows[0] || null;
  }
}

module.exports = ReviewRepository;
