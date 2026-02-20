class HoursRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  async findAll(client) {
    const result = await this._db(client).query(
      'SELECT * FROM business_hours ORDER BY day_of_week'
    );
    return result.rows;
  }

  async update(dayOfWeek, data, client) {
    const { open_time, close_time, is_closed } = data;
    const result = await this._db(client).query(
      'UPDATE business_hours SET open_time = $1, close_time = $2, is_closed = $3 WHERE day_of_week = $4 RETURNING *',
      [is_closed ? null : open_time, is_closed ? null : close_time, is_closed, parseInt(dayOfWeek, 10)]
    );
    return result.rows[0] || null;
  }
}

module.exports = HoursRepository;
