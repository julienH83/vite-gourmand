const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, passwordRegex } = require('../utils/validators');

module.exports = function createUserRoutes(userController) {
  const router = express.Router();

  router.put('/profile', authenticate, [
    body('first_name').optional().trim().notEmpty().withMessage('Le prénom ne peut pas être vide.'),
    body('last_name').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide.'),
    body('phone').optional().trim().notEmpty().withMessage('Le téléphone ne peut pas être vide.'),
    body('address').optional().trim().notEmpty().withMessage('L\'adresse ne peut pas être vide.'),
    handleValidation,
  ], userController.updateProfile);

  router.get('/export', authenticate, userController.exportData);

  router.delete('/account', authenticate, userController.deleteAccount);

  router.get('/', authenticate, authorize('admin'), userController.listUsers);

  router.get('/clients', authenticate, authorize('employee', 'admin'), userController.listClients);

  router.post('/employee', authenticate, authorize('admin'), [
    body('first_name').trim().notEmpty().withMessage('Prénom requis.'),
    body('last_name').trim().notEmpty().withMessage('Nom requis.'),
    body('phone').trim().notEmpty().withMessage('Téléphone requis.'),
    body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
    body('address').trim().notEmpty().withMessage('Adresse requise.'),
    body('password').matches(passwordRegex).withMessage('Mot de passe trop faible.'),
    handleValidation,
  ], userController.createEmployee);

  router.put('/password', authenticate, [
    body('current_password').notEmpty().withMessage('Mot de passe actuel requis.'),
    body('new_password').matches(passwordRegex).withMessage('Le nouveau mot de passe ne respecte pas les critères de sécurité.'),
    handleValidation,
  ], userController.changePassword);

  router.put('/:id/toggle-status', authenticate, authorize('admin'), userController.toggleStatus);

  return router;
};
