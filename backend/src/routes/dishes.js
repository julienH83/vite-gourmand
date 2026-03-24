const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation } = require('../utils/validators');

module.exports = function createDishRoutes(dishController) {
  const router = express.Router();

  router.get('/', dishController.list);

  router.post('/', authenticate, authorize('employee', 'admin'), [
    body('name').trim().notEmpty().withMessage('Nom requis.'),
    body('type').isIn(['entree', 'plat', 'dessert']).withMessage('Type invalide.'),
    handleValidation,
  ], dishController.create);

  router.put('/:id', authenticate, authorize('employee', 'admin'), dishController.update);

  router.delete('/:id', authenticate, authorize('employee', 'admin'), dishController.delete);

  return router;
};
