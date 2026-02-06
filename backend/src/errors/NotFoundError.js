const AppError = require('./AppError');

class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée.') {
    super(message, 404);
  }
}

module.exports = NotFoundError;
