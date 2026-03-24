const { Router } = require('express');

module.exports = function createSuggestionRoutes(controller) {
  const router = Router();

  // GET /api/suggestions/menus?event_type=mariage&guest_count=80
  router.get('/menus',  (req, res, next) => controller.menus(req, res, next));

  // GET /api/suggestions/budget?event_type=mariage&guest_count=80
  router.get('/budget', (req, res, next) => controller.budget(req, res, next));

  return router;
};
