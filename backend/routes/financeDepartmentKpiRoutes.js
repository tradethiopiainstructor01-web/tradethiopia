const express = require('express');
const router = express.Router();
const financeDepartmentKpiController = require('../controllers/financeDepartmentKpiController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, financeDepartmentKpiController.getFinanceDepartmentKpis);
router.post('/', optionalAuth, financeDepartmentKpiController.saveFinanceDepartmentKpi);
router.get('/live-stats', optionalAuth, financeDepartmentKpiController.getFinanceLiveStats);

module.exports = router;
