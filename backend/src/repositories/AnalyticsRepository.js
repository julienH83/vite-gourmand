class AnalyticsRepository {
  constructor(OrderAnalyticsModel) {
    this._model = OrderAnalyticsModel;
  }

  async syncOrder(orderData) {
    await this._model.findOneAndUpdate(
      { order_id: orderData.order_id },
      {
        order_id: orderData.order_id,
        menu_id: orderData.menu_id,
        menu_title: orderData.menu_title,
        total_price: parseFloat(orderData.total_price),
        menu_price: parseFloat(orderData.menu_price),
        delivery_price: parseFloat(orderData.delivery_price),
        discount: parseFloat(orderData.discount),
        nb_persons: orderData.nb_persons,
        status: orderData.status,
        created_at: orderData.created_at || new Date(),
      },
      { upsert: true, new: true }
    );
  }

  async aggregateByMenu(filters = {}) {
    const match = {};

    if (filters.menu_id) {
      match.menu_id = filters.menu_id;
    }

    if (filters.date_from || filters.date_to) {
      match.created_at = {};
      if (filters.date_from) match.created_at.$gte = new Date(filters.date_from);
      if (filters.date_to) match.created_at.$lte = new Date(filters.date_to);
    }

    match.status = { $ne: 'annulee' };

    return this._model.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$menu_id',
          menu_title: { $first: '$menu_title' },
          total_orders: { $sum: 1 },
          total_revenue: { $sum: '$total_price' },
          total_menu_revenue: { $sum: '$menu_price' },
          total_delivery_revenue: { $sum: '$delivery_price' },
          total_discount: { $sum: '$discount' },
          avg_persons: { $avg: '$nb_persons' },
        },
      },
      { $sort: { total_orders: -1 } },
    ]);
  }

  /**
   * Compare les 30 derniers jours vs les 30 jours précédents par menu.
   * Retourne un tableau trié par popularité courante avec delta et tendance.
   */
  async aggregateTrends() {
    const now = new Date();
    const start30 = new Date(now); start30.setDate(now.getDate() - 30);
    const start60 = new Date(now); start60.setDate(now.getDate() - 60);

    const [currentPeriod, previousPeriod] = await Promise.all([
      this._model.aggregate([
        { $match: { status: { $ne: 'annulee' }, created_at: { $gte: start30 } } },
        { $group: { _id: '$menu_id', menu_title: { $first: '$menu_title' }, count: { $sum: 1 }, revenue: { $sum: '$total_price' } } },
      ]),
      this._model.aggregate([
        { $match: { status: { $ne: 'annulee' }, created_at: { $gte: start60, $lt: start30 } } },
        { $group: { _id: '$menu_id', count: { $sum: 1 }, revenue: { $sum: '$total_price' } } },
      ]),
    ]);

    const prevMap = new Map(previousPeriod.map(p => [p._id, p]));

    return currentPeriod
      .map(cur => {
        const prev = prevMap.get(cur._id) || { count: 0, revenue: 0 };
        const delta = cur.count - prev.count;
        const pct = prev.count === 0 ? null : Math.round((delta / prev.count) * 100);
        return {
          menu_id:    cur._id,
          menu_title: cur.menu_title,
          current:    cur.count,
          previous:   prev.count,
          delta,
          delta_pct:  pct,
          revenue:    cur.revenue,
          trend:      delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
        };
      })
      .sort((a, b) => b.current - a.current);
  }

  async aggregateRevenueOverTime(filters = {}) {
    const match = { status: { $ne: 'annulee' } };

    if (filters.menu_id) {
      match.menu_id = filters.menu_id;
    }

    if (filters.date_from || filters.date_to) {
      match.created_at = {};
      if (filters.date_from) match.created_at.$gte = new Date(filters.date_from);
      if (filters.date_to) match.created_at.$lte = new Date(filters.date_to);
    }

    return this._model.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' },
          },
          total_orders: { $sum: 1 },
          total_revenue: { $sum: '$total_price' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }
}

module.exports = AnalyticsRepository;
