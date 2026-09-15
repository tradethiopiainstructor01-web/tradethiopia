const router = require('express').Router();
const { protect } = require('../middleware/auth');
const Report = require('../models/SocialKpiReport');
const { defaults, validateReport } = require('../utils/socialKpiReport');
const { notifyKpiSubmission } = require('../services/kpiSubmissionNotificationService');

router.use(protect);
router.use((req, res, next) => {
  const role = String(req.user.role || '').toLowerCase().replace(/[\s_-]/g, '');
  if (!['socialmedia', 'socialmediamanager', 'admin', 'superadmin', 'coo', 'coo2', 'ceo'].includes(role)) return res.status(403).json({ message: 'Social media KPI access required.' });
  next();
});

router.get('/', async (req, res) => {
  try {
    const { periodType, periodKey } = req.query;
    const query = {};
    if (periodType) query.periodType = periodType;
    if (periodKey) query.periodKey = periodKey;

    let currentReport = null;
    if (periodType && periodKey) {
      currentReport = await Report.findOne({ periodType, periodKey }).lean();
    }

    const reports = await Report.find().sort({ submittedAt: -1 }).limit(50).lean();
    res.json({ defaults: defaults(), reports, report: currentReport, currentReport });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load KPI reports.' });
  }
});

router.post('/', async (req, res) => {
  let payload;
  try { payload = validateReport(req.body); }
  catch (error) { return res.status(400).json({ message: error.message }); }
  try {
    // Canonical calendar ranges uniquely identify each frequency and allow an
    // older date-only report with matching boundaries to be updated in place.
    const report = await Report.findOneAndUpdate({ startDate: payload.startDate, endDate: payload.endDate }, {
      $set: { ...payload, submittedBy: req.user._id, submittedByName: req.user.fullName || req.user.username || '', submittedAt: new Date() },
    }, { upsert: true, new: true, runValidators: true });

    try {
      await notifyKpiSubmission(req, {
        departmentId: 'social_media',
        periodType: payload.periodType,
        periodKey: payload.periodKey,
        reportId: report._id,
        notes: payload.summaryNotes || '',
      });
    } catch (notifErr) {
      console.warn('Failed to send KPI submission notification:', notifErr.message);
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Unable to submit KPI report. Please retry.' });
  }
});

module.exports = router;
