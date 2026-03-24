const AppError = require('../errors/AppError');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }

  logger.error({ err, method: req.method, url: req.url }, 'Unhandled error');
  res.status(500).json({ error: 'Erreur interne du serveur.' });
}

module.exports = errorHandler;
