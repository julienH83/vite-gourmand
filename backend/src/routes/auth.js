const express = require('express');
const { body } = require('express-validator');
const { registerValidation, loginValidation, handleValidation, passwordRegex } = require('../utils/validators');
const { authenticate } = require('../middleware/auth');

module.exports = function createAuthRoutes(authController) {
  const router = express.Router();

  router.post('/register', [
    ...registerValidation.slice(0, -1),
    body('rgpd_consent').isBoolean().custom(val => val === true).withMessage('Vous devez accepter la politique de confidentialit\u00e9.'),
    handleValidation,
  ], authController.register);

  router.post('/login', loginValidation, authController.login);

  router.post('/refresh', authController.refresh);

  router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
    handleValidation,
  ], authController.forgotPassword);

  router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token requis.'),
    body('password').matches(passwordRegex).withMessage('Mot de passe trop faible.'),
    handleValidation,
  ], authController.resetPassword);

  router.get('/me', authenticate, authController.getMe);

  return router;
};
