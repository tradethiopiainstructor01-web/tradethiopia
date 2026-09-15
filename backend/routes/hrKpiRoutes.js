const express = require('express');
const router = express.Router();
const hrKpiController = require('../controllers/hrKpiController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', hrKpiController.getHrKpis);
router.post('/', optionalAuth, hrKpiController.saveHrKpi);
router.get('/live-stats', hrKpiController.getLiveStats);

module.exports = router;
