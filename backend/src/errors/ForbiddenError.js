const AppError = require('./AppError');

class ForbiddenError extends AppError {
  constructor(message = 'Accès non autorisé.') {
    super(message, 403);
  }
}

module.exports = ForbiddenError;
