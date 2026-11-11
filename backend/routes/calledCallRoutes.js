const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCalledCalls,
  createCalledCall,
  getCalledCallById,
  updateCalledCall,
  deleteCalledCall,
  deleteAllCalledCalls,
  getCalledCallStats,
  bulkCreateCalledCalls,
  sendBulkSms,
  getBulkSmsRecipients,
  saveBulkSmsRecipients,
  deleteBulkSmsRecipient,
  clearBulkSmsRecipients,
} = require('../controllers/calledCallController');

router.route('/')
  .get(protect, getCalledCalls)
  .post(protect, createCalledCall);

router.post('/bulk', protect, bulkCreateCalledCalls);
router.delete('/bulk', protect, deleteAllCalledCalls);
router.post('/bulk-sms', protect, sendBulkSms);
router.route('/bulk-sms/recipients')
  .get(protect, getBulkSmsRecipients)
  .post(protect, saveBulkSmsRecipients)
  .delete(protect, clearBulkSmsRecipients);
router.delete('/bulk-sms/recipients/:id', protect, deleteBulkSmsRecipient);

router.get('/stats', protect, getCalledCallStats);

router.route('/:id')
  .get(protect, getCalledCallById)
  .put(protect, updateCalledCall)
  .delete(protect, deleteCalledCall);

module.exports = router;

