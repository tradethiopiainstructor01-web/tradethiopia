const Report = require('../models/CustomerDepartmentKpi');
const { defaults, validateReport } = require('../utils/customerDepartmentKpi');
const { notifyKpiSubmission } = require('../services/kpiSubmissionNotificationService');
const { periodRange } = require('../utils/departmentKpiAnalytics');
exports.getReport = async (req, res) => {
  const { periodType, periodKey } = req.query;
  try { periodRange(periodType, periodKey); }
  catch { return res.status(400).json({ message: 'Choose a valid reporting period.' }); }
  try {
    const data = await Report.findOne({ periodType, periodKey }).lean();
    return res.json({ data: data || { periodType, periodKey, metrics: defaults(), submittedAt: null } });
  } catch { return res.status(500).json({ message: 'Unable to load customer service KPIs.' }); }
};
exports.submitReport = async (req, res) => {
  let report;
  try { report = validateReport(req.body); }
  catch (error) { return res.status(400).json({ message: error.message }); }
  try {
    const data = await Report.findOneAndUpdate(
      { periodType: report.periodType, periodKey: report.periodKey },
      { $set: { ...report, submittedAt: new Date(), submittedBy: req.user._id, submittedByName: req.user.fullName || req.user.name || '' } },
      { upsert: true, new: true, runValidators: true },
    );
    await notifyKpiSubmission(req, { departmentId: 'customer_services', periodType: report.periodType, periodKey: report.periodKey, reportId: data._id });
    return res.json({ data, message: 'Customer service KPI report submitted to COO2.' });
  } catch (error) { return res.status(error.code === 11000 ? 409 : 500).json({ message: 'Unable to submit report. Please retry.' }); }
};
