const express = require('express');
const router = express.Router();
const tessbinController = require('../controllers/tessbinController');

// GET dashboard statistics & KPI summary
router.get('/dashboard-stats', tessbinController.getDashboardStats);

// GET all exam records with search and filter
router.get('/exams', tessbinController.getExamRecords);

// POST create a new student exam record
router.post('/exams', tessbinController.createExamRecord);

// PUT update an exam record
router.put('/exams/:id', tessbinController.updateExamRecord);

// DELETE remove an exam record
router.delete('/exams/:id', tessbinController.deleteExamRecord);

// KPI Targets CRUD
router.get('/kpis', tessbinController.getKpiTargets);
router.post('/kpis', tessbinController.createKpiTarget);
router.put('/kpis/:id', tessbinController.updateKpiTarget);
router.delete('/kpis/:id', tessbinController.deleteKpiTarget);

// 3rd Party Online Examination API Proxy Routes
router.get('/third-party/summary', tessbinController.getThirdPartySummary);
router.get('/third-party/exam-takers', tessbinController.getThirdPartyExamTakers);
router.get('/third-party/registrations', tessbinController.getThirdPartyRegistrations);
router.get('/third-party/applications', tessbinController.getThirdPartyApplications);
router.get('/third-party/courses-breakdown', tessbinController.getThirdPartyCoursesBreakdown);

module.exports = router;
