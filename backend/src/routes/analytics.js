const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

module.exports = function createAnalyticsRoutes(analyticsController) {
  const router = express.Router();

  router.get('/orders-by-menu',  authenticate, authorize('admin'), analyticsController.getOrdersByMenu);
  router.get('/revenue',         authenticate, authorize('admin'), analyticsController.getRevenue);
  router.get('/trends',          authenticate, authorize('admin'), analyticsController.getTrends);
  router.get('/client-scores',   authenticate, authorize('admin'), analyticsController.getClientScores);

  return router;
};
