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

  async getAll(client) {
    const result = await this._db(client).query(`
      SELECT cm.*,
        rb.first_name AS read_by_first_name, rb.last_name AS read_by_last_name,
        (SELECT COUNT(*) FROM contact_replies cr WHERE cr.message_id = cm.id) AS reply_count
      FROM contact_messages cm
      LEFT JOIN users rb ON cm.read_by = rb.id
      ORDER BY cm.created_at DESC
    `);
    return result.rows;
  }

  async getById(id, client) {
    const msgResult = await this._db(client).query(`
      SELECT cm.*,
        rb.first_name AS read_by_first_name, rb.last_name AS read_by_last_name
      FROM contact_messages cm
      LEFT JOIN users rb ON cm.read_by = rb.id
      WHERE cm.id = $1
    `, [id]);
    if (!msgResult.rows[0]) return null;

    const repliesResult = await this._db(client).query(`
      SELECT cr.*, u.first_name, u.last_name, u.role
      FROM contact_replies cr
      JOIN users u ON cr.author_id = u.id
      WHERE cr.message_id = $1
      ORDER BY cr.created_at ASC
    `, [id]);

    return { ...msgResult.rows[0], replies: repliesResult.rows };
  }

  async markAsRead(id, userId, client) {
    const result = await this._db(client).query(
      'UPDATE contact_messages SET is_read = true, read_by = $2, read_at = NOW() WHERE id = $1 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }

  async addReply(messageId, authorId, content, client) {
    const result = await this._db(client).query(
      'INSERT INTO contact_replies (message_id, author_id, content) VALUES ($1, $2, $3) RETURNING *',
      [messageId, authorId, content]
    );
    return result.rows[0];
  }

  async delete(id, client) {
    const result = await this._db(client).query(
      'DELETE FROM contact_messages WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = ContactRepository;
