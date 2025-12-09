const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const financeController = require('../controllers/financeController');

router.get('/metrics', financeController.getMetrics);
router.get('/agent-sales-performance', protect, financeController.getAgentSalesPerformance);

module.exports = router;