const express = require('express');
const router = express.Router();
const {
  getPayrollList,
  calculatePayrollForAll,
  submitHRAdjustment,
  submitFinanceAdjustment,
  getPayrollDetails,
  approvePayroll,
  lockPayroll
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
router.post('/hr-adjust', authorize('hr', 'HR'), submitHRAdjustment);

// POST /payroll/finance-adjust → Finance allowances & deductions
// Access: Finance
router.post('/finance-adjust', authorize('finance', 'Finance'), submitFinanceAdjustment);

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