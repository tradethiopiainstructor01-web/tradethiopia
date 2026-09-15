const Report = require('../models/TessbinKpiReport');
const TessbinExamRecord = require('../models/TessbinExamRecord');
const StudentRegistration = require('../models/StudentRegistration');
const TrainingFollowup = require('../models/TrainingFollowup');
const { METRICS, periodFor, validateReport, cooMetrics } = require('../utils/tessbinKpiReport');
const { periodRange, analyzeMetrics } = require('../utils/departmentKpiAnalytics');

exports.getSubmitted = async (req, res) => {
  let range;
  try { range = periodRange(req.query.periodType, req.query.periodKey); }
  catch { return res.status(400).json({ message: 'Choose a valid reporting period.' }); }
  try {
    const report = await Report.findOne({ timeframe: req.query.periodType, periodStart: range.start.toISOString().slice(0, 10), status: 'submitted' }).lean();
    // Also guard status here so drafts can never be returned to the COO view.
    const submitted = report?.status === 'submitted' ? report : null;
    return res.json({ report: submitted, metrics: analyzeMetrics(cooMetrics(submitted), req.query.periodKey).metrics });
  } catch (error) {
    console.error('Unable to load submitted Tessbin report:', error);
    return res.status(500).json({ message: 'Unable to load the submitted Tessbin report.' });
  }
};

exports.authorize = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase().replace(/[\s_-]/g, '');
  if (!['tessbin', 'tessbinadmin', 'admin', 'superadmin', 'ceo', 'coo', 'coo2', '2coo'].includes(role)) {
    return res.status(403).json({ success: false, message: 'You do not have access to Tessbin KPI reports.' });
  }
  return next();
};

exports.get = async (req, res) => {
  let period;
  try { period = periodFor(req.query.timeframe, req.query.date); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }
  try {
    const [report, history] = await Promise.all([
      Report.findOne({ timeframe: period.timeframe, periodStart: period.periodStart }).lean(),
      Report.find({ timeframe: period.timeframe }).sort({ periodStart: -1 }).limit(12).lean(),
    ]);
    // Older reports keep their saved results; newly introduced metrics start blank.
    const withCurrentMetrics = (item) => ({
      ...item,
      metrics: METRICS.map(({ key }) => item.metrics?.find((row) => row.key === key) || { key, target: null, actual: null }),
    });
    return res.json({ success: true, data: {
      report: withCurrentMetrics(report || { ...period, status: 'draft', revision: 0, notes: '' }),
      history: history.map(withCurrentMetrics),
    } });
  } catch (error) {
    console.error('Failed to load Tessbin KPI report:', error);
    return res.status(500).json({ success: false, message: 'Unable to load KPI reports. Please try again.' });
  }
};

exports.getLiveCounts = async (req, res) => {
  let period;
  try { period = periodFor(req.query.timeframe, req.query.date); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }
  try {
    const startDate = new Date(`${period.periodStart}T00:00:00.000Z`);
    const endDate = new Date(`${period.periodEnd}T23:59:59.999Z`);

    const [cocExams, onlineExams, students, followups] = await Promise.all([
      TessbinExamRecord.countDocuments({
        examType: 'COC Exam',
        $or: [
          { examDate: { $gte: startDate, $lte: endDate } },
          { examDate: { $exists: false }, createdAt: { $gte: startDate, $lte: endDate } },
        ],
      }).catch(() => 0),
      TessbinExamRecord.countDocuments({
        examType: 'Online Final Exam',
        $or: [
          { examDate: { $gte: startDate, $lte: endDate } },
          { examDate: { $exists: false }, createdAt: { $gte: startDate, $lte: endDate } },
        ],
      }).catch(() => 0),
      StudentRegistration.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }).catch(() => 0),
      TrainingFollowup.countDocuments({
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { startDate: { $gte: startDate, $lte: endDate } },
        ],
      }).catch(() => 0),
    ]);

    return res.json({
      success: true,
      data: {
        timeframe: period.timeframe,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        counts: {
          coc: cocExams,
          online: onlineExams,
          students: students,
          evaluations: followups,
        },
      },
    });
  } catch (error) {
    console.error('Failed to get live KPI counts:', error);
    return res.status(500).json({ success: false, message: 'Unable to calculate live KPI counts.' });
  }
};

const { notifyKpiSubmission, periodKeyFor } = require('../services/kpiSubmissionNotificationService');
exports.save = async (req, res) => {
  let values;
  try { values = validateReport(req.body); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }
  try {
    const report = await Report.findOneAndUpdate(
      { timeframe: values.timeframe, periodStart: values.periodStart, revision: req.body.revision },
      { $set: { ...values, updatedBy: req.user._id, submittedAt: values.status === 'submitted' ? new Date() : null }, $inc: { revision: 1 } },
      { new: true, upsert: req.body.revision === 0, runValidators: true, setDefaultsOnInsert: false },
    );
    if (!report) return res.status(409).json({ success: false, message: 'This report changed in another session. Reload before saving.' });
    if (values.status === 'submitted') await notifyKpiSubmission(req, { departmentId: 'tessbin', periodType: values.timeframe, periodKey: periodKeyFor(values.timeframe, values.periodStart), reportId: report._id, notes: values.notes });
    return res.json({ success: true, data: report });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'This period already has a newer report. Reload before saving.' });
    console.error('Failed to save Tessbin KPI report:', error);
    return res.status(500).json({ success: false, message: 'Unable to save the report. Your entries are still in the form.' });
  }
};
