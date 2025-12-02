const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');

router.get('/metrics', financeController.getMetrics);

module.exports = router;
