const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { orderValidation, handleValidation } = require('../utils/validators');

module.exports = function createOrderRoutes(orderController) {
  const router = express.Router();

  // GET /api/orders — liste (user: ses commandes, employee/admin: toutes + filtres)
  router.get('/', authenticate, orderController.list);

  // GET /api/orders/:id — détail + historique statuts + avis
  router.get('/:id', authenticate, orderController.getById);

  // POST /api/orders — création commande (client authentifié)
  router.post('/', authenticate, orderValidation, orderController.create);

  // PUT /api/orders/:id — modification commande (client: en_attente uniquement)
  router.put('/:id', authenticate, orderController.update);

  // POST /api/orders/:id/cancel — annulation commande (client: en_attente uniquement)
  router.post('/:id/cancel', authenticate, orderController.cancel);

  // POST /api/orders/:id/confirm-deposit — confirmer acompte reçu (employé/admin)
  router.post('/:id/confirm-deposit', authenticate, authorize('employee', 'admin'), orderController.confirmDeposit);

  // POST /api/orders/:id/mark-paid — marquer comme payé (employé/admin)
  router.post('/:id/mark-paid', authenticate, authorize('employee', 'admin'), orderController.markPaid);

  // PUT /api/orders/:id/status — changement statut (employé/admin uniquement)
  router.put('/:id/status', authenticate, authorize('employee', 'admin'), [
    body('status').isIn([
      'confirmed', 'acceptee', 'en_preparation', 'en_livraison', 'livree',
      'attente_retour_materiel', 'terminee', 'annulee'
    ]).withMessage('Statut invalide.'),
    body('reason')
      .if(body('status').equals('annulee'))
      .notEmpty().withMessage('Le motif est obligatoire pour une annulation.'),
    body('contact_method')
      .if(body('status').equals('annulee'))
      .isIn(['phone', 'email']).withMessage('Le mode de contact est obligatoire pour une annulation.'),
    handleValidation,
  ], orderController.updateStatus);

  return router;
};
