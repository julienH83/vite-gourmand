const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  }
  next();
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;

const registerValidation = [
  body('first_name').trim().notEmpty().withMessage('Le prénom est requis.'),
  body('last_name').trim().notEmpty().withMessage('Le nom est requis.'),
  body('phone').trim().notEmpty().withMessage('Le numéro de téléphone est requis.'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
  body('address').trim().notEmpty().withMessage('L\'adresse est requise.'),
  body('password')
    .matches(passwordRegex)
    .withMessage('Le mot de passe doit contenir au moins 10 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'),
  handleValidation,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
  body('password').notEmpty().withMessage('Le mot de passe est requis.'),
  handleValidation,
];

const orderValidation = [
  body('menu_id').notEmpty().withMessage('Menu invalide.'),
  body('nb_persons').isInt({ min: 1 }).withMessage('Nombre de personnes invalide.'),
  body('delivery_address').trim().notEmpty().withMessage('L\'adresse de livraison est requise.'),
  body('delivery_city').trim().notEmpty().withMessage('La ville est requise.'),
  body('delivery_date').isDate().withMessage('Date invalide.'),
  body('delivery_time').matches(/^\d{2}:\d{2}$/).withMessage('Heure invalide (format HH:MM).'),
  body('delivery_distance_km').isFloat({ min: 0 }).withMessage('Distance invalide.'),
  handleValidation,
];

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5.'),
  body('comment').optional().trim(),
  handleValidation,
];

const contactValidation = [
  body('title').trim().notEmpty().withMessage('Le titre est requis.'),
  body('description').trim().notEmpty().withMessage('La description est requise.'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
  handleValidation,
];

module.exports = {
  handleValidation,
  registerValidation,
  loginValidation,
  orderValidation,
  reviewValidation,
  contactValidation,
  passwordRegex,
};
