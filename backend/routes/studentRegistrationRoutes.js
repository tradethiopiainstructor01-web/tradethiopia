const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getStudentRegistrations,
  getStudentRegistrationById,
  createStudentRegistration,
  updateStudentRegistration,
  deleteStudentRegistration,
} = require('../controllers/studentRegistrationController');

const router = express.Router();

router.use(protect);

router.get('/', getStudentRegistrations);
router.get('/:id', getStudentRegistrationById);
router.post('/', createStudentRegistration);
router.put('/:id', updateStudentRegistration);
router.delete('/:id', deleteStudentRegistration);

module.exports = router;
