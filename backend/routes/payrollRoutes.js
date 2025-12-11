const express = require('express');
const router = express.Router();
const {
  getPayrollList,
  calculatePayrollForAll,
  submitHRAdjustment,
  submitFinanceAdjustment,
  getPayrollDetails,
  approvePayroll,
  lockPayroll,
  submitCommission,
  getCommissionByUser,
  getSalesDataForCommission
} = require('../controllers/payrollController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

// All payroll routes require authentication
router.use(protect);

// GET /payroll/:month → full payroll list
// Access: HR, Finance, Admin
router.get('/:month', getPayrollList);

// POST /payroll/calculate → run payroll engine
// Access: Admin
router.post('/calculate', authorize('admin'), calculatePayrollForAll);

// POST /payroll/hr-adjust → HR attendance submission
// Access: HR
router.post('/hr-adjust', authorize('HR', 'hr'), submitHRAdjustment);

// POST /payroll/finance-adjust → Finance allowances & deductions
// Access: Finance
router.post('/finance-adjust', authorize('finance', 'Finance'), submitFinanceAdjustment);

// POST /payroll/commission → Submit or update commission data
// Access: Admin, Finance
router.post('/commission', authorize('admin', 'finance', 'Finance'), submitCommission);

// GET /payroll/commission/:userId → Get commission data for a user
// Access: Admin, Finance, HR
router.get('/commission/:userId', authorize('admin', 'finance', 'Finance', 'hr', 'HR'), getCommissionByUser);

// GET /payroll/sales-data/:agentId → Get sales data for commission calculation
// Access: Admin, Finance, HR
router.get('/sales-data/:agentId', authorize('admin', 'finance', 'Finance', 'hr', 'HR'), getSalesDataForCommission);

// GET /payroll/:userId/details → detailed payroll view
// Access: HR, Finance, Admin, Employee (own data only)
router.get('/:userId/details', getPayrollDetails);

// PUT /payroll/:id/approve → Approve payroll
// Access: Admin
router.put('/:id/approve', authorize('admin'), approvePayroll);

// PUT /payroll/:id/lock → Lock payroll
// Access: Admin
router.put('/:id/lock', authorize('admin'), lockPayroll);

module.exports = router;