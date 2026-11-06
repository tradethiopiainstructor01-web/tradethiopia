const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCalledCalls,
  createCalledCall,
  getCalledCallById,
  updateCalledCall,
  deleteCalledCall,
  getCalledCallStats,
  bulkCreateCalledCalls,
  sendBulkSms,
} = require('../controllers/calledCallController');

router.route('/')
  .get(protect, getCalledCalls)
  .post(protect, createCalledCall);

router.post('/bulk', protect, bulkCreateCalledCalls);
router.post('/bulk-sms', protect, sendBulkSms);

router.get('/stats', protect, getCalledCallStats);

router.route('/:id')
  .get(protect, getCalledCallById)
  .put(protect, updateCalledCall)
  .delete(protect, deleteCalledCall);

module.exports = router;

