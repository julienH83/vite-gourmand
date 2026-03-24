const AppError = require('./AppError');

class ConflictError extends AppError {
  constructor(message = 'Conflit avec une ressource existante.') {
    super(message, 409);
  }
}

module.exports = ConflictError;
