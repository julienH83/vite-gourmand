const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('../utils/validators');

const EVENT_TYPES = ['mariage', 'anniversaire', 'seminaire', 'cocktail', 'gala', 'autre'];
const ITEM_TYPES  = ['menu', 'option', 'prestation'];
const ITEM_UNITS  = ['par_personne', 'forfait', 'par_heure'];

const quoteCreateValidation = [
  body('event_type').isIn(EVENT_TYPES).withMessage('Type d\'événement invalide.'),
  body('event_date')
    .isDate().withMessage('Date invalide.')
    .custom(val => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      if (new Date(val) < tomorrow) throw new Error('La date doit être dans le futur.');
      return true;
    }),
  body('event_time').optional({ nullable: true })
    .matches(/^\d{2}:\d{2}$/).withMessage('Heure invalide (HH:MM).'),
  body('event_address').trim().notEmpty().withMessage('L\'adresse est requise.').isLength({ max: 200 }),
  body('event_city').trim().notEmpty().withMessage('La ville est requise.').isLength({ max: 100 }),
  body('guest_count').isInt({ min: 1, max: 500 }).withMessage('Nombre d\'invités invalide (1-500).'),
  body('dietary_notes').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('client_message').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  body('discount_pct').optional().isFloat({ min: 0, max: 100 }).withMessage('Remise invalide (0-100%).'),
  body('items').isArray({ min: 1 }).withMessage('Au moins un item est requis.'),
  body('items.*.item_type').isIn(ITEM_TYPES).withMessage('Type d\'item invalide.'),
  body('items.*.label').trim().notEmpty().withMessage('Le libellé de l\'item est requis.'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Prix unitaire invalide.'),
  body('items.*.unit').isIn(ITEM_UNITS).withMessage('Unité invalide.'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantité invalide.'),
  handleValidation,
];

const depositValidation = [
  body('deposit_ref').trim().notEmpty().withMessage('La référence de paiement est requise.'),
  handleValidation,
];

module.exports = function createQuoteRoutes(quoteController) {
  const router = express.Router();

  // Endpoint admin : expiration automatique (cron ou appel manuel)
  router.post(
    '/expire',
    authenticate,
    authorize('admin'),
    quoteController.expireOverdue
  );

  // GET /api/quotes — liste (user: les siens, staff: tous + filtres + pagination)
  router.get('/', authenticate, quoteController.list);

  // GET /api/quotes/:id — détail complet
  router.get('/:id', authenticate, quoteController.getById);

  // POST /api/quotes — créer un devis (draft)
  router.post('/', authenticate, quoteCreateValidation, quoteController.create);

  // PUT /api/quotes/:id — modifier (user: draft only, staff: draft + champs internes)
  router.put('/:id', authenticate, quoteController.update);

  // POST /api/quotes/:id/send — envoyer au client (employee/admin)
  router.post(
    '/:id/send',
    authenticate,
    authorize('employee', 'admin'),
    quoteController.send
  );

  // POST /api/quotes/:id/accept — client accepte (sent → accepted)
  router.post('/:id/accept', authenticate, quoteController.accept);

  // Envoyer les instructions d'acompte (staff)
  router.post(
    '/:id/send-deposit-instructions',
    authenticate,
    authorize('employee', 'admin'),
    quoteController.sendDepositInstructions
  );

  // POST /api/quotes/:id/refuse — refus (client ou staff)
  router.post('/:id/refuse', authenticate, quoteController.refuse);

  // POST /api/quotes/:id/deposit — enregistrer acompte (employee/admin)
  router.post(
    '/:id/deposit',
    authenticate,
    authorize('employee', 'admin'),
    depositValidation,
    quoteController.deposit
  );

  // POST /api/quotes/:id/convert — convertir en commande (employee/admin)
  router.post(
    '/:id/convert',
    authenticate,
    authorize('employee', 'admin'),
    quoteController.convert
  );

  // DELETE /api/quotes/:id — supprimer (user: draft only, admin: tous)
  router.delete('/:id', authenticate, quoteController.delete);

  return router;
};