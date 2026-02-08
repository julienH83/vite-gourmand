class UserRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  async findById(id, client) {
    const result = await this._db(client).query(
      'SELECT id, first_name, last_name, phone, email, address, role, status, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email, client) {
    const result = await this._db(client).query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findByEmailFull(email, client) {
    const result = await this._db(client).query(
      'SELECT id, first_name, email FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findByEmailWithPassword(email, client) {
    const result = await this._db(client).query(
      'SELECT id, first_name, last_name, email, password_hash, role, status FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findByIdBasic(id, client) {
    const result = await this._db(client).query(
      'SELECT id, email, role, status FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(userData, client) {
    const result = await this._db(client).query(
      `INSERT INTO users (first_name, last_name, phone, email, address, password_hash, role, status, rgpd_consent, rgpd_consent_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING id, first_name, last_name, email, role`,
      [
        userData.first_name,
        userData.last_name,
        userData.phone,
        userData.email,
        userData.address,
        userData.password_hash,
        userData.role,
        userData.status,
        userData.rgpd_consent
      ]
    );
    return result.rows[0];
  }

  async findByResetToken(token, client) {
    const result = await this._db(client).query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    return result.rows[0] || null;
  }

  async setResetToken(id, token, expires, client) {
    await this._db(client).query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, id]
    );
  }

  async findPasswordHash(id, client) {
    const result = await this._db(client).query(
      'SELECT password_hash FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0]?.password_hash || null;
  }

  async updatePassword(id, passwordHash, client) {
    await this._db(client).query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [passwordHash, id]
    );
  }

  async updateProfile(id, data, client) {
    const result = await this._db(client).query(
      `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
       phone = COALESCE($3, phone), address = COALESCE($4, address)
       WHERE id = $5
       RETURNING id, first_name, last_name, phone, email, address, role, status`,
      [data.first_name, data.last_name, data.phone, data.address, id]
    );
    return result.rows[0] || null;
  }

  async findAll(filters, client) {
    let query = 'SELECT id, first_name, last_name, phone, email, address, role, status, created_at FROM users';
    const params = [];

    if (filters && filters.role) {
      query += ' WHERE role = $1';
      params.push(filters.role);
    }

    query += ' ORDER BY created_at DESC';
    const result = await this._db(client).query(query, params);
    return result.rows;
  }

  async findClients(client) {
    const result = await this._db(client).query(
      "SELECT id, first_name, last_name, email FROM users WHERE role = 'user' ORDER BY last_name"
    );
    return result.rows;
  }

  async findRoleAndStatus(id, client) {
    const result = await this._db(client).query(
      'SELECT role, status FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateStatus(id, newStatus, client) {
    const result = await this._db(client).query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, role, status',
      [newStatus, id]
    );
    return result.rows[0] || null;
  }

  async findNameAndEmail(id, client) {
    const result = await this._db(client).query(
      'SELECT first_name, email FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async anonymize(id, client) {
    // RGPD art.17 — anonymisation complète des données personnelles
    // anonymized_at horodate la demande (preuve de conformité)
    await this._db(client).query(
      `UPDATE users SET
       first_name          = 'Utilisateur',
       last_name           = 'Supprim\u00e9',
       phone               = '0000000000',
       email               = $1,
       address             = 'Adresse supprim\u00e9e',
       password_hash       = 'DELETED',
       status              = 'inactive',
       reset_token         = NULL,
       reset_token_expires = NULL,
       anonymized_at       = NOW()
       WHERE id = $2`,
      [`deleted_${id}@supprime.local`, id]
    );
  }

  async findActiveOrdersByUserId(userId, client) {
    const result = await this._db(client).query(
      "SELECT id FROM orders WHERE user_id = $1 AND status NOT IN ('terminee', 'annulee')",
      [userId]
    );
    return result.rows;
  }

  async createEmployee(data, client) {
    const result = await this._db(client).query(
      `INSERT INTO users (first_name, last_name, phone, email, address, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'employee', 'active')
       RETURNING id, first_name, last_name, email, role, status`,
      [data.first_name, data.last_name, data.phone, data.email, data.address, data.password_hash]
    );
    return result.rows[0];
  }

  async findOrdersForExport(userId, client) {
    const result = await this._db(client).query(
      `SELECT o.id, o.nb_persons, o.delivery_address, o.delivery_city, o.delivery_date,
       o.delivery_time, o.menu_price, o.delivery_price, o.discount, o.total_price, o.status, o.created_at,
       m.title as menu_title
       FROM orders o JOIN menus m ON o.menu_id = m.id WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async findReviewsForExport(userId, client) {
    const result = await this._db(client).query(
      `SELECT r.rating, r.comment, r.status, r.created_at, m.title as menu_title
       FROM reviews r JOIN menus m ON r.menu_id = m.id WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

module.exports = UserRepository;
