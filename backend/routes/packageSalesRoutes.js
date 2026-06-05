const express = require('express');
const {
  getPackageSales,
  createPackageSale,
  getPackageSalesCommissions,
  getPackageSalesFollowups,
  logPackageSalesActivity,
  getPackageSalesActivities
} = require('../controllers/packageSalesController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getPackageSales);
router.post('/', protect, createPackageSale);
router.get('/activities', protect, getPackageSalesActivities);
router.post('/activities', protect, logPackageSalesActivity);
router.get('/commissions', getPackageSalesCommissions);
router.get('/followups', getPackageSalesFollowups);

module.exports = router;
