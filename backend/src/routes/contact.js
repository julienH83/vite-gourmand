const express = require('express');
const { contactValidation } = require('../utils/validators');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation } = require('../utils/validators');

const replyValidation = [
  body('content').trim().notEmpty().withMessage('Le contenu de la réponse est requis.'),
  handleValidation,
];

module.exports = function createContactRoutes(contactController) {
  const router = express.Router();

  // Public
  router.post('/', optionalAuth, contactValidation, contactController.create);

  // Staff : liste tous les messages
  router.get('/', authenticate, authorize('employee', 'admin'), contactController.list);

  // Authentifié : voir un message (staff ou propriétaire)
  router.get('/:id', authenticate, contactController.getById);

  // Staff : marquer comme lu
  router.put('/:id/read', authenticate, authorize('employee', 'admin'), contactController.markAsRead);

  // Authentifié : répondre à un message
  router.post('/:id/reply', authenticate, replyValidation, contactController.reply);

  // Admin seulement : supprimer
  router.delete('/:id', authenticate, authorize('admin'), contactController.delete);

  return router;
};
