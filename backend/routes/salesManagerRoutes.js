const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const {
  getAllSales,
  updateSupervisorComment,
  getAllAgents,
  getTeamPerformance,
  getDashboardStats,
  getAgentSales
} = require('../controllers/salesManagerController');

// All routes are protected and require sales manager role
router.route('/all-sales')
  .get(protect, authorize('salesmanager'), getAllSales);

router.route('/sales/:id/supervisor-comment')
  .put(protect, authorize('salesmanager'), updateSupervisorComment);

router.route('/agents')
  .get(protect, authorize('salesmanager'), getAllAgents);

router.route('/team-performance')
  .get(protect, authorize('salesmanager'), getTeamPerformance);

router.route('/dashboard-stats')
  .get(protect, authorize('salesmanager'), getDashboardStats);

router.route('/agent-sales/:agentId')
  .get(protect, authorize('salesmanager'), getAgentSales);

module.exports = router;