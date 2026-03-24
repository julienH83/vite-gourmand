class SuggestionController {
  constructor(suggestionService) {
    this._service = suggestionService;
    this.menus = this.menus.bind(this);
    this.budget = this.budget.bind(this);
  }

  async menus(req, res, next) {
    try {
      const { event_type, guest_count } = req.query;
      const count = parseInt(guest_count) || 0;
      const suggestions = await this._service.getMenuSuggestions(event_type || 'autre', count);
      res.json(suggestions);
    } catch (err) {
      next(err);
    }
  }

  async budget(req, res, next) {
    try {
      const { event_type, guest_count } = req.query;
      const count = parseInt(guest_count) || 1;
      const estimate = await this._service.getBudgetEstimate(event_type || 'autre', count);
      res.json(estimate || { available: false });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SuggestionController;
