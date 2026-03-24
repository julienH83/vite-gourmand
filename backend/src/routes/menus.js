const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation } = require('../utils/validators');

module.exports = function createMenuRoutes(menuController) {
  const router = express.Router();

  router.get('/', menuController.list);

  router.get('/filters', menuController.getFilters);

  router.get('/:id', menuController.getById);

  router.post('/', authenticate, authorize('employee', 'admin'), [
    body('title').trim().notEmpty().withMessage('Titre requis.'),
    body('description').trim().notEmpty().withMessage('Description requise.'),
    body('theme').trim().notEmpty().withMessage('Thème requis.'),
    body('diet').trim().notEmpty().withMessage('Régime requis.'),
    body('min_persons').isInt({ min: 1 }).withMessage('Nombre minimum de personnes invalide.'),
    body('min_price').isFloat({ min: 0 }).withMessage('Prix minimum invalide.'),
    body('stock').isInt({ min: 0 }).withMessage('Stock invalide.'),
    handleValidation,
  ], menuController.create);

  router.put('/:id', authenticate, authorize('employee', 'admin'), menuController.update);

  router.delete('/:id', authenticate, authorize('employee', 'admin'), menuController.delete);

  return router;
};
