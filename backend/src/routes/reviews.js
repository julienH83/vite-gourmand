const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { reviewValidation } = require('../utils/validators');

module.exports = function createReviewRoutes(reviewController) {
  const router = express.Router();

  router.get('/', reviewController.listApproved);

  router.get('/pending', authenticate, authorize('employee', 'admin'), reviewController.listPending);

  router.post('/:orderId', authenticate, reviewValidation, reviewController.create);

  router.put('/:id/validate', authenticate, authorize('employee', 'admin'), reviewController.validate);

  return router;
};
