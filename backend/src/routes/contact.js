const express = require('express');
const { contactValidation } = require('../utils/validators');

module.exports = function createContactRoutes(contactController) {
  const router = express.Router();

  router.post('/', contactValidation, contactController.create);

  return router;
};
