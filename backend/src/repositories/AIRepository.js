class AIRepository {
  constructor(pool) {
    this._pool = pool;
  }

  _db(client) {
    return client || this._pool;
  }

  async getMenusForContext(filters = {}, client) {
    let query = `
      SELECT m.id, m.title, m.description, m.theme, m.diet,
             m.min_price, m.min_persons, m.stock,
             COALESCE(
               json_agg(
                 json_build_object('name', d.name, 'type', d.type, 'allergens', d.allergens)
               ) FILTER (WHERE d.id IS NOT NULL), '[]'
             ) AS dishes
      FROM menus m
      LEFT JOIN menu_dishes md ON m.id = md.menu_id
      LEFT JOIN dishes d ON md.dish_id = d.id
      WHERE m.is_active = true AND m.stock > 0
    `;
    const params = [];
    let i = 1;

    if (filters.guestCount) {
      query += ` AND m.min_persons <= $${i++}`;
      params.push(parseInt(filters.guestCount, 10));
    }
    if (filters.maxPricePerPerson) {
      query += ` AND m.min_price <= $${i++}`;
      params.push(parseFloat(filters.maxPricePerPerson));
    }
    if (filters.diet) {
      query += ` AND m.diet = $${i++}`;
      params.push(filters.diet);
    }

    query += ' GROUP BY m.id ORDER BY m.min_price ASC';

    const result = await this._db(client).query(query, params);
    return result.rows;
  }

  async getQuoteOptionsForContext(client) {
    const result = await this._db(client).query(
      `SELECT id, label, description, unit_price, unit
       FROM quote_options
       WHERE is_active = true
       ORDER BY label`
    );
    return result.rows;
  }

  getPricingRules() {
    return {
      delivery: {
        bordeaux: 'Livraison gratuite',
        outside: '5 EUR + 0.59 EUR/km',
      },
      discount: 'Remise 10% si nombre de convives >= minimum du menu + 5',
      deposit: 'Acompte obligatoire de 30% du total',
      payment: 'Solde de 70% le jour de la livraison',
    };
  }

  async getBusinessInfo(client) {
    const hoursResult = await this._db(client).query(
      'SELECT day_of_week, open_time, close_time, is_closed FROM business_hours ORDER BY day_of_week'
    );

    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const hours = hoursResult.rows.map(r => ({
      day: days[r.day_of_week],
      hours: r.is_closed ? 'Fermé' : `${r.open_time} - ${r.close_time}`,
    }));

    return {
      name: 'Vite & Gourmand',
      type: 'Traiteur événementiel à Bordeaux',
      address: process.env.ON_SITE_ADDRESS || 'Bordeaux, France',
      phone: process.env.ON_SITE_PHONE || '',
      hours,
    };
  }
}

module.exports = AIRepository;
