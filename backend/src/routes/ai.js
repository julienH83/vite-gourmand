const express = require('express');
const { body } = require('express-validator');
const { optionalAuth } = require('../middleware/auth');
const { handleValidation } = require('../utils/validators');

const aiValidation = [
  body('type')
    .isIn(['menu', 'quote', 'chat'])
    .withMessage('Type invalide. Utilisez : menu, quote, chat.'),
  body('data')
    .isObject()
    .withMessage('Le champ data doit être un objet.'),
  handleValidation,
];

module.exports = function createAIRoutes(aiController) {
  const router = express.Router();

  router.post('/', optionalAuth, aiValidation, aiController.handle);

  return router;
};
