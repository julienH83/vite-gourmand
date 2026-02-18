const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('../utils/validators');

const ITEM_UNITS = ['par_personne', 'forfait', 'par_heure'];

const optionValidation = [
  body('label').trim().notEmpty().withMessage('Le libellé est requis.').isLength({ max: 120 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('unit_price').isFloat({ min: 0 }).withMessage('Prix invalide.'),
  body('unit').isIn(ITEM_UNITS).withMessage('Unité invalide.'),
  handleValidation,
];

module.exports = function createQuoteOptionRoutes(quoteOptionController) {
  const router = express.Router();

  // GET /api/quote-options — liste publique + all=true pour admin (optionnel)
  router.get('/', quoteOptionController.list);

  // POST /api/quote-options — créer (employee/admin)
  router.post(
    '/',
    authenticate,
    authorize('employee', 'admin'),
    optionValidation,
    quoteOptionController.create
  );

  // PUT /api/quote-options/:id — modifier (employee/admin)
  router.put(
    '/:id',
    authenticate,
    authorize('employee', 'admin'),
    optionValidation,
    quoteOptionController.update
  );

  // DELETE /api/quote-options/:id — soft delete is_active=false (admin uniquement)
  router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    quoteOptionController.remove
  );

  return router;
};
