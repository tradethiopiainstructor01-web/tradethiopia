const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  assignCustomer,
  getSalesStats
} = require('../controllers/salesCustomerController');

// All routes are protected
router.route('/')
  .get(protect, getCustomers)
  .post(protect, createCustomer);

router.route('/stats')
  .get(protect, getSalesStats);

// Alias for completed sales lookup. Keep static routes before dynamic /:id.
router.get('/salescustomers', protect, getCustomers);

router.route('/:id')
  .get(protect, getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

router.put('/:id/assign', protect, authorize('salesmanager', 'sales_manager', 'sales manager'), assignCustomer);

module.exports = router;
