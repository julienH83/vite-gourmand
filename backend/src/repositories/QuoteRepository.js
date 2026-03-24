class QuoteRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  // Liste

  async findAllForUser(userId, filters = {}, client) {
    const params = [userId];
    let where = 'WHERE q.user_id = $1';

    if (filters.status) {
      params.push(filters.status);
      where += ` AND q.status = $${params.length}`;
    }
    if (filters.event_date_from) {
      params.push(filters.event_date_from);
      where += ` AND q.event_date >= $${params.length}`;
    }
    if (filters.event_date_to) {
      params.push(filters.event_date_to);
      where += ` AND q.event_date <= $${params.length}`;
    }

    const page = Math.max(1, parseInt(filters.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit || 20, 10)));
    const offset = (page - 1) * limit;

    const result = await this._db(client).query(
      `SELECT
         q.id, q.status, q.event_type, q.event_date, q.guest_count,
         q.total, q.deposit_amount, q.valid_until, q.created_at,
         q.deposit_instructions_sent_at
       FROM quotes q
       ${where}
       ORDER BY q.created_at DESC
       LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}`,
      params
    );

    const countResult = await this._db(client).query(
      `SELECT COUNT(*) FROM quotes q ${where}`,
      params.slice(0, params.length - 2)
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  async findAllForStaff(filters = {}, client) {
    const params = [];
    let where = 'WHERE 1=1';

    if (filters.status) {
      params.push(filters.status);
      where += ` AND q.status = $${params.length}`;
    }
    if (filters.user_id) {
      params.push(filters.user_id);
      where += ` AND q.user_id = $${params.length}`;
    }
    if (filters.assigned_to) {
      params.push(filters.assigned_to);
      where += ` AND q.assigned_to = $${params.length}`;
    }
    if (filters.event_date_from) {
      params.push(filters.event_date_from);
      where += ` AND q.event_date >= $${params.length}`;
    }
    if (filters.event_date_to) {
      params.push(filters.event_date_to);
      where += ` AND q.event_date <= $${params.length}`;
    }

    const page = Math.max(1, parseInt(filters.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit || 20, 10)));
    const offset = (page - 1) * limit;

    const result = await this._db(client).query(
      `SELECT
         q.id, q.status, q.event_type, q.event_date, q.guest_count,
         q.total, q.deposit_amount, q.valid_until, q.created_at,
         q.assigned_to,
         q.deposit_instructions_sent_at,
         u.first_name AS user_first_name, u.last_name AS user_last_name, u.email AS user_email,
         a.first_name AS assigned_first_name, a.last_name AS assigned_last_name
       FROM quotes q
       JOIN users u ON q.user_id = u.id
       LEFT JOIN users a ON q.assigned_to = a.id
       ${where}
       ORDER BY q.created_at DESC
       LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}`,
      params
    );

    const countResult = await this._db(client).query(
      `SELECT COUNT(*) FROM quotes q JOIN users u ON q.user_id = u.id ${where}`,
      params.slice(0, params.length - 2)
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  // Détail

  async findByIdFull(id, client) {
    const result = await this._db(client).query(
      `SELECT
         q.*,
         u.first_name AS user_first_name, u.last_name AS user_last_name,
         u.email AS user_email, u.phone AS user_phone,
         a.first_name AS assigned_first_name, a.last_name AS assigned_last_name
       FROM quotes q
       JOIN users u ON q.user_id = u.id
       LEFT JOIN users a ON q.assigned_to = a.id
       WHERE q.id = $1`,
      [id]
    );
    if (!result.rows[0]) return null;

    const quote = result.rows[0];

    const itemsResult = await this._db(client).query(
      `SELECT qi.*, m.title AS menu_title
       FROM quote_items qi
       LEFT JOIN menus m ON qi.menu_id = m.id
       WHERE qi.quote_id = $1
       ORDER BY qi.sort_order ASC, qi.created_at ASC`,
      [id]
    );
    quote.items = itemsResult.rows;

    const histResult = await this._db(client).query(
      `SELECT qsh.*, u.first_name AS changed_by_name
       FROM quote_status_history qsh
       LEFT JOIN users u ON qsh.changed_by = u.id
       WHERE qsh.quote_id = $1
       ORDER BY qsh.created_at ASC`,
      [id]
    );
    quote.status_history = histResult.rows;

    return quote;
  }

  async findByIdAndUserId(id, userId, client) {
    const result = await this._db(client).query(
      'SELECT * FROM quotes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  }

  async findById(id, client) {
    const result = await this._db(client).query(
      'SELECT * FROM quotes WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Disponibilité date

  async checkDateAvailability(eventDate, excludeQuoteId = null, client) {
    const params = [eventDate];
    let excludeClause = '';
    if (excludeQuoteId) {
      params.push(excludeQuoteId);
      excludeClause = ` AND q.id != $${params.length}`;
    }

    const quotesResult = await this._db(client).query(
      `SELECT COUNT(*) FROM quotes q
       WHERE q.event_date = $1
         AND q.status IN ('acompte_paye', 'converti_en_commande')
         ${excludeClause}`,
      params
    );

    const ordersResult = await this._db(client).query(
      `SELECT COUNT(*) FROM orders
       WHERE delivery_date = $1
         AND status NOT IN ('annulee')`,
      [eventDate]
    );

    return {
      quoteConflicts: parseInt(quotesResult.rows[0].count, 10),
      orderConflicts: parseInt(ordersResult.rows[0].count, 10),
    };
  }

  // Écriture

  async create(data, client) {
    const result = await this._db(client).query(
      `INSERT INTO quotes
         (user_id, event_type, event_date, event_time, event_address, event_city,
          guest_count, dietary_notes, client_message,
          subtotal, discount_pct, discount_amount, total, deposit_amount, valid_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        data.user_id, data.event_type, data.event_date,
        data.event_time || null, data.event_address, data.event_city,
        data.guest_count, data.dietary_notes || null, data.client_message || null,
        data.subtotal, data.discount_pct, data.discount_amount,
        data.total, data.deposit_amount, data.valid_until,
      ]
    );
    return result.rows[0];
  }

  async insertItems(quoteId, items, client) {
    if (!items || items.length === 0) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await this._db(client).query(
        `INSERT INTO quote_items
           (quote_id, item_type, menu_id, option_id, label, unit_price, unit, quantity, line_total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          quoteId,
          item.item_type,
          item.menu_id || null,
          item.option_id || null,
          item.label,
          item.unit_price,
          item.unit,
          item.quantity,
          item.line_total,
          i,
        ]
      );
    }
  }

  async deleteItems(quoteId, client) {
    await this._db(client).query(
      'DELETE FROM quote_items WHERE quote_id = $1',
      [quoteId]
    );
  }

  async update(id, data, client) {
    const result = await this._db(client).query(
      `UPDATE quotes SET
         event_type      = COALESCE($1,  event_type),
         event_date      = COALESCE($2,  event_date),
         event_time      = COALESCE($3,  event_time),
         event_address   = COALESCE($4,  event_address),
         event_city      = COALESCE($5,  event_city),
         guest_count     = COALESCE($6,  guest_count),
         dietary_notes   = COALESCE($7,  dietary_notes),
         client_message  = COALESCE($8,  client_message),
         internal_notes  = COALESCE($9,  internal_notes),
         assigned_to     = COALESCE($10, assigned_to),
         subtotal        = $11,
         discount_pct    = $12,
         discount_amount = $13,
         total           = $14,
         deposit_amount  = $15,
         valid_until     = COALESCE($16, valid_until)
       WHERE id = $17
       RETURNING *`,
      [
        data.event_type, data.event_date, data.event_time,
        data.event_address, data.event_city, data.guest_count,
        data.dietary_notes, data.client_message, data.internal_notes,
        data.assigned_to,
        data.subtotal, data.discount_pct, data.discount_amount,
        data.total, data.deposit_amount,
        data.valid_until,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  async updateStatus(id, status, timestamps = {}, client) {
    const sets = ['status = $1'];
    const params = [status];

    if (timestamps.sent_at !== undefined) {
      params.push(timestamps.sent_at);
      sets.push(`sent_at = $${params.length}`);
    }
    if (timestamps.accepted_at !== undefined) {
      params.push(timestamps.accepted_at);
      sets.push(`accepted_at = $${params.length}`);
    }
    if (timestamps.refused_at !== undefined) {
      params.push(timestamps.refused_at);
      sets.push(`refused_at = $${params.length}`);
    }
    if (timestamps.deposit_paid_at !== undefined) {
      params.push(timestamps.deposit_paid_at);
      sets.push(`deposit_paid_at = $${params.length}`);
    }
    if (timestamps.deposit_ref !== undefined) {
      params.push(timestamps.deposit_ref);
      sets.push(`deposit_ref = $${params.length}`);
    }

    if (timestamps.deposit_instructions_sent_at !== undefined) {
      params.push(timestamps.deposit_instructions_sent_at);
      sets.push(`deposit_instructions_sent_at = $${params.length}`);
    }
    if (timestamps.deposit_instructions_sent_by !== undefined) {
      params.push(timestamps.deposit_instructions_sent_by);
      sets.push(`deposit_instructions_sent_by = $${params.length}`);
    }

    if (timestamps.converted_order_id !== undefined) {
      params.push(timestamps.converted_order_id);
      sets.push(`converted_order_id = $${params.length}`);
    }

    params.push(id);
    await this._db(client).query(
      `UPDATE quotes SET ${sets.join(', ')} WHERE id = $${params.length}`,
      params
    );
  }

  async insertStatusHistory(quoteId, status, changedBy, note, client) {
    await this._db(client).query(
      'INSERT INTO quote_status_history (quote_id, status, changed_by, note) VALUES ($1,$2,$3,$4)',
      [quoteId, status, changedBy || null, note || null]
    );
  }

  async delete(id, client) {
    await this._db(client).query(
      'DELETE FROM quotes WHERE id = $1',
      [id]
    );
  }

  // Expiration automatique

  async expireOverdue(client) {
    const result = await this._db(client).query(
      `UPDATE quotes
       SET status = 'expire'
       WHERE status = 'sent'
         AND valid_until IS NOT NULL
         AND valid_until < CURRENT_DATE
       RETURNING id, user_id`,
      []
    );
    return result.rows;
  }

  // Lecture pour conversion

  async findFirstMenuItem(quoteId, client) {
    const result = await this._db(client).query(
      `SELECT qi.*, m.min_price, m.min_persons, m.stock
       FROM quote_items qi
       JOIN menus m ON qi.menu_id = m.id
       WHERE qi.quote_id = $1
         AND qi.item_type = 'menu'
       ORDER BY qi.sort_order ASC
       LIMIT 1`,
      [quoteId]
    );
    return result.rows[0] || null;
  }

  async findUserBasic(userId, client) {
    const result = await this._db(client).query(
      'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = QuoteRepository;