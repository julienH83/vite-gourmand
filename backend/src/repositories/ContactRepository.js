class ContactRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  async create(data, client) {
    const result = await this._db(client).query(
      'INSERT INTO contact_messages (title, description, email) VALUES ($1, $2, $3) RETURNING *',
      [data.title, data.description, data.email]
    );
    return result.rows[0];
  }
}

module.exports = ContactRepository;
