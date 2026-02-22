class SuggestionRepository {
  constructor(pool) {
    this._pool = pool;
  }

  /**
   * Returns menus sorted by how often they were chosen for a given event_type.
   * Falls back to all active/available menus when no historical data exists.
   */
  async findMenuSuggestions(dbEventType, guestCount) {
    const result = await this._pool.query(
      `SELECT
         m.id, m.title, m.description, m.min_price, m.min_persons,
         m.theme, m.diet, m.stock,
         COUNT(qi.id) AS times_chosen
       FROM menus m
       LEFT JOIN quote_items qi
         ON qi.menu_id = m.id
         AND qi.item_type = 'menu'
       LEFT JOIN quotes q
         ON q.id = qi.quote_id
         AND q.event_type = $1::event_type
         AND q.status NOT IN ('draft', 'refuse', 'expire')
       WHERE m.is_active = true
         AND m.stock > 0
         AND ($2::int = 0 OR m.min_persons <= $2)
       GROUP BY m.id
       ORDER BY times_chosen DESC, m.min_price ASC
       LIMIT 10`,
      [dbEventType, guestCount]
    );
    return result.rows;
  }

  /**
   * Returns budget percentiles (Q1, median, Q3) for accepted quotes
   * with a similar guest count (±30%).
   */
  async getBudgetEstimate(dbEventType, guestCount) {
    const result = await this._pool.query(
      `SELECT
         ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY total)::numeric, 2) AS q1,
         ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY total)::numeric, 2) AS median,
         ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total)::numeric, 2) AS q3,
         COUNT(*) AS sample_count
       FROM quotes
       WHERE event_type = $1::event_type
         AND status IN ('accepted', 'acompte_paye', 'converti_en_commande')
         AND guest_count BETWEEN ($2::int * 0.7)::int AND ($2::int * 1.3)::int`,
      [dbEventType, guestCount]
    );
    return result.rows[0] || null;
  }
}

module.exports = SuggestionRepository;
