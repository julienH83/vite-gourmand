const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

module.exports = function createHoursRoutes(hoursController) {
  const router = express.Router();

  router.get('/', hoursController.getAll);
  router.put('/:dayOfWeek', authenticate, authorize('employee', 'admin'), hoursController.update);

  return router;
};
