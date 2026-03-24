const ValidationError = require('../errors/ValidationError');

class AIController {
  constructor(aiService) {
    this._aiService = aiService;
    this.handle = this.handle.bind(this);
  }

  async handle(req, res, next) {
    try {
      const { type, data } = req.body;

      let result;
      switch (type) {
        case 'menu':
          result = await this._aiService.suggestMenus(data || {});
          break;
        case 'quote':
          result = await this._aiService.suggestForQuote(data || {});
          break;
        case 'chat':
          result = await this._aiService.chat(data || {});
          break;
        default:
          throw new ValidationError('Type invalide. Utilisez : menu, quote, chat.');
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AIController;
