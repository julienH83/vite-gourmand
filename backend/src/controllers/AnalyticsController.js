class AnalyticsController {
  constructor(analyticsService) {
    this._analyticsService = analyticsService;
    this.getOrdersByMenu  = this.getOrdersByMenu.bind(this);
    this.getRevenue       = this.getRevenue.bind(this);
    this.getTrends        = this.getTrends.bind(this);
    this.getClientScores  = this.getClientScores.bind(this);
  }

  async getOrdersByMenu(req, res, next) {
    try {
      const { menu_id, date_from, date_to } = req.query;
      const result = await this._analyticsService.getOrdersByMenu({ menu_id, date_from, date_to });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getRevenue(req, res, next) {
    try {
      const { menu_id, date_from, date_to } = req.query;
      const result = await this._analyticsService.getRevenueOverTime({ menu_id, date_from, date_to });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getTrends(req, res, next) {
    try {
      const result = await this._analyticsService.getMenuTrends();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getClientScores(req, res, next) {
    try {
      const result = await this._analyticsService.getClientScores();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AnalyticsController;
