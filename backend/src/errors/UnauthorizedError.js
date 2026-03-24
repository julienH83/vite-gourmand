const AppError = require('./AppError');

class UnauthorizedError extends AppError {
  constructor(message = 'Authentification requise.') {
    super(message, 401);
  }
}

module.exports = UnauthorizedError;
