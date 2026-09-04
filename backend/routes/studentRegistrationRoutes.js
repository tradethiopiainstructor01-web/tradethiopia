const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getStudentRegistrations,
  getStudentRegistrationById,
  createStudentRegistration,
  updateStudentRegistration,
  deleteStudentRegistration,
  verifyStudentRegistration,
  handleSyncAllFollowupStudents,
} = require('../controllers/studentRegistrationController');

const router = express.Router();

// ==========================================
// PUBLIC VERIFICATION ROUTE (No Auth Required)
// Used when scanning QR Code from printed/digital certificate
// ==========================================
router.get('/verify/:id', verifyStudentRegistration);
router.get('/public-verify/:id', verifyStudentRegistration);

// Protected routes
router.use(protect);

router.post('/sync-all', handleSyncAllFollowupStudents);
router.get('/', getStudentRegistrations);
router.get('/:id', getStudentRegistrationById);
router.post('/', createStudentRegistration);
router.put('/:id', updateStudentRegistration);
router.delete('/:id', deleteStudentRegistration);

module.exports = router;

