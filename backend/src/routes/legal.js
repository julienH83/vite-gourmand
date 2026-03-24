const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation } = require('../utils/validators');

module.exports = function createLegalRoutes(legalController) {
  const router = express.Router();

  router.get('/:type', legalController.getByType);

  router.put('/:type', authenticate, authorize('admin'), [
    body('title').trim().notEmpty().withMessage('Le titre est requis.'),
    body('content').trim().notEmpty().withMessage('Le contenu est requis.'),
    handleValidation,
  ], legalController.upsert);

  return router;
};
