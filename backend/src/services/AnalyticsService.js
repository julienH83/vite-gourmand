class AnalyticsService {
  constructor(analyticsRepository, clientScoreRepository) {
    this._analyticsRepo = analyticsRepository;
    this._clientScoreRepo = clientScoreRepository || null;
  }

  async syncOrder(order, menuTitle) {
    await this._analyticsRepo.syncOrder({
      order_id: order.id,
      menu_id: order.menu_id,
      menu_title: menuTitle,
      total_price: order.total_price,
      menu_price: order.menu_price,
      delivery_price: order.delivery_price,
      discount: order.discount,
      nb_persons: order.nb_persons,
      status: order.status,
      created_at: order.created_at,
    });
  }

  async getOrdersByMenu(filters) {
    return this._analyticsRepo.aggregateByMenu(filters);
  }

  async getRevenueOverTime(filters) {
    return this._analyticsRepo.aggregateRevenueOverTime(filters);
  }

  async getMenuTrends() {
    return this._analyticsRepo.aggregateTrends();
  }

  async getClientScores() {
    if (!this._clientScoreRepo) return [];
    return this._clientScoreRepo.findClientScores();
  }
}

module.exports = AnalyticsService;
