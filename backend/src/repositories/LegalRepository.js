class LegalRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  async findByType(type, client) {
    const result = await this._db(client).query(
      'SELECT * FROM legal_pages WHERE type = $1',
      [type]
    );
    return result.rows[0] || null;
  }

  async upsert(type, title, content, client) {
    const result = await this._db(client).query(
      `INSERT INTO legal_pages (type, title, content, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (type) DO UPDATE
         SET title = EXCLUDED.title, content = EXCLUDED.content, updated_at = NOW()
       RETURNING *`,
      [type, title, content]
    );
    return result.rows[0];
  }
}

module.exports = LegalRepository;
