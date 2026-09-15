const express = require('express');
const router = express.Router();
const metricController = require('../controllers/metricController');
const { getKpis, upsertKpiTarget } = require('../controllers/cooDashboardController');
const { getDepartmentAnalytics } = require('../controllers/departmentKpiAnalyticsController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

router.get('/revenue-actuals', metricController.listRevenue);
router.post('/revenue-actuals', metricController.upsertRevenue);

router.get('/social-actuals', metricController.listSocial);
router.post('/social-actuals', metricController.upsertSocial);
router.get('/social-weekly-kpis', metricController.listSocialWeeklyKpis);
router.post('/social-weekly-kpis', optionalAuth, metricController.upsertSocialWeeklyKpi);
router.get('/coo-dashboard/kpis', protect, getKpis);
router.get('/coo-dashboard/department-analytics', protect, authorize('COO', 'COO2', 'COO 2', 'coo_2', '2coo', 'CEO', 'admin'), getDepartmentAnalytics);
router.get('/coo-dashboard/tessbin-kpi-report', protect, authorize('COO', 'COO2', 'COO 2', 'coo_2', '2coo', 'CEO', 'admin'), require('../controllers/tessbinKpiReportController').getSubmitted);
router.put('/coo-dashboard/kpi-target', protect, authorize('COO', 'coo', 'COO2', 'coo2', 'CEO', 'admin'), upsertKpiTarget);

module.exports = router;

