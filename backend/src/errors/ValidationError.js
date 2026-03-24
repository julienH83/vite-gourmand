const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(message = 'Données invalides.') {
    super(message, 400);
  }
}

module.exports = ValidationError;
