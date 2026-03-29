class OrderRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  // Lecture

  async findAllForUser(userId, filters = {}, client) {
    let query = `
      SELECT o.*, m.title AS menu_title, m.image_url AS menu_image
      FROM orders o
      JOIN menus m ON o.menu_id = m.id
      WHERE o.user_id = $1
    `;
    const params = [userId];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ' ORDER BY o.created_at DESC';
    const result = await this._db(client).query(query, params);
    return result.rows;
  }

  async findAllForStaff(filters = {}, client) {
    let query = `
      SELECT o.*, m.title AS menu_title, m.image_url AS menu_image,
             u.first_name, u.last_name,
             u.first_name AS user_first_name, u.last_name AS user_last_name,
             u.email AS user_email, u.phone AS user_phone
      FROM orders o
      JOIN menus m ON o.menu_id = m.id
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND o.status = $${params.length}`;
    }
    if (filters.user_id) {
      params.push(filters.user_id);
      query += ` AND o.user_id = $${params.length}`;
    }

    query += ' ORDER BY o.created_at DESC';
    const result = await this._db(client).query(query, params);
    return result.rows;
  }

  async findByIdFull(id, client) {
    const result = await this._db(client).query(
      `SELECT o.*, m.title AS menu_title, m.image_url AS menu_image, m.conditions AS menu_conditions,
              u.first_name, u.last_name,
              u.first_name AS user_first_name, u.last_name AS user_last_name,
              u.email AS user_email, u.phone AS user_phone
       FROM orders o
       JOIN menus m ON o.menu_id = m.id
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIdFullForUser(id, userId, client) {
    const result = await this._db(client).query(
      `SELECT o.*, m.title AS menu_title, m.image_url AS menu_image, m.conditions AS menu_conditions,
              u.first_name, u.last_name,
              u.first_name AS user_first_name, u.last_name AS user_last_name,
              u.email AS user_email, u.phone AS user_phone
       FROM orders o
       JOIN menus m ON o.menu_id = m.id
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  }

  async findById(id, client) {
    const result = await this._db(client).query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIdAndUserId(orderId, userId, client) {
    const result = await this._db(client).query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );
    return result.rows[0] || null;
  }

  // Historique de statut

  async findStatusHistory(orderId, client) {
    const result = await this._db(client).query(
      `SELECT osh.*, u.first_name AS changed_by_name
       FROM order_status_history osh
       LEFT JOIN users u ON osh.changed_by = u.id
       WHERE osh.order_id = $1
       ORDER BY osh.created_at ASC`,
      [orderId]
    );
    return result.rows;
  }

  async insertStatusHistory(orderId, status, changedBy, client) {
    await this._db(client).query(
      'INSERT INTO order_status_history (order_id, status, changed_by) VALUES ($1, $2, $3)',
      [orderId, status, changedBy || null]
    );
  }

  // Avis

  async findReviewByOrderId(orderId, client) {
    const result = await this._db(client).query(
      'SELECT * FROM reviews WHERE order_id = $1',
      [orderId]
    );
    return result.rows[0] || null;
  }

  // Menu

  async findActiveMenu(menuId, client) {
    const result = await this._db(client).query(
      'SELECT * FROM menus WHERE id = $1 AND is_active = true',
      [menuId]
    );
    return result.rows[0] || null;
  }

  async findMenuDishes(menuId, client) {
    const result = await this._db(client).query(
      `SELECT d.name, d.type, d.description
       FROM dishes d
       JOIN menu_dishes md ON d.id = md.dish_id
       WHERE md.menu_id = $1
       ORDER BY CASE d.type WHEN 'entree' THEN 1 WHEN 'plat' THEN 2 WHEN 'dessert' THEN 3 END, d.name`,
      [menuId]
    );
    return result.rows;
  }

  async findMenu(menuId, client) {
    const result = await this._db(client).query(
      'SELECT * FROM menus WHERE id = $1',
      [menuId]
    );
    return result.rows[0] || null;
  }

  async decrementMenuStock(menuId, client) {
    const result = await this._db(client).query(
      'UPDATE menus SET stock = stock - 1 WHERE id = $1 AND stock > 0',
      [menuId]
    );
    return result.rowCount > 0;
  }

  async incrementMenuStock(menuId, client) {
    await this._db(client).query(
      'UPDATE menus SET stock = stock + 1 WHERE id = $1',
      [menuId]
    );
  }

  // Utilisateur

  async findUserBasic(userId, client) {
    const result = await this._db(client).query(
      'SELECT id, first_name, email FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  // Ecriture

  async create(data, client) {
    const result = await this._db(client).query(
      `INSERT INTO orders
         (user_id, menu_id, nb_persons, delivery_address, delivery_city,
          delivery_date, delivery_time, delivery_distance_km,
          menu_price, delivery_price, discount, total_price, status, deposit_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        data.user_id, data.menu_id, data.nb_persons,
        data.delivery_address, data.delivery_city,
        data.delivery_date, data.delivery_time, data.delivery_distance_km,
        data.menu_price, data.delivery_price, data.discount, data.total_price,
        data.status || 'en_attente', data.deposit_amount || null,
      ]
    );
    return result.rows[0];
  }

  // Le Service DOIT fournir toutes les valeurs calculées (nb_persons, delivery_distance_km, prix).
  // COALESCE est utilisé uniquement pour les champs texte optionnels (address, city, date, time).
  async update(id, data, client) {
    const result = await this._db(client).query(
      `UPDATE orders SET
         nb_persons = $1,
         delivery_address = COALESCE($2, delivery_address),
         delivery_city = COALESCE($3, delivery_city),
         delivery_date = COALESCE($4, delivery_date),
         delivery_time = COALESCE($5, delivery_time),
         delivery_distance_km = $6,
         menu_price = $7, delivery_price = $8, discount = $9, total_price = $10,
         deposit_amount = $11
       WHERE id = $12
       RETURNING *`,
      [
        data.nb_persons, data.delivery_address, data.delivery_city,
        data.delivery_date, data.delivery_time, data.delivery_distance_km,
        data.menu_price, data.delivery_price, data.discount, data.total_price,
        data.deposit_amount || null,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  async updateStatus(id, status, client) {
    await this._db(client).query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, id]
    );
  }

  // Paiement

  async confirmDeposit(id, client) {
    const result = await this._db(client).query(
      `UPDATE orders SET payment_status = 'acompte_paye', deposit_paid_at = NOW(), status = 'confirmed'
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  async markPaid(id, client) {
    const result = await this._db(client).query(
      `UPDATE orders SET payment_status = 'paye'
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Log de contact employé (annulation)

  async insertContactLog(data, client) {
    await this._db(client).query(
      'INSERT INTO employee_contact_logs (order_id, employee_id, reason, contact_method) VALUES ($1, $2, $3, $4)',
      [data.order_id, data.employee_id, data.reason, data.contact_method]
    );
  }
}

module.exports = OrderRepository;
