const express = require('express');
const router = express.Router();
const itController = require('../controllers/it.controller');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');

// All routes require authentication; creation/update/delete limited to IT and admin
router.get('/', protect, itController.getTasks);

// Reports
router.get('/reports/all', protect, authorizeRoles('IT','admin'), itController.getReports);
router.get('/reports/:id', protect, authorizeRoles('IT','admin'), itController.getReportById);
router.put('/reports/:id', protect, authorizeRoles('IT','admin'), itController.updateReport);
router.post('/reports', protect, authorizeRoles('IT','admin'), itController.createReport);

// Task routes
router.get('/:id', protect, itController.getTaskById);
router.post('/', protect, authorizeRoles('IT','admin'), itController.createTask);
router.put('/:id', protect, authorizeRoles('IT','admin'), itController.updateTask);
router.delete('/:id', protect, authorizeRoles('IT','admin'), itController.deleteTask);

module.exports = router;
