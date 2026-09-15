const HrKpi = require('../models/HrKpi');
const SalesDepartmentKpi = require('../models/SalesDepartmentKpi');
const CustomerDepartmentKpi = require('../models/CustomerDepartmentKpi');
const ITTask = require('../models/ITTask');
const Task = require('../models/Task');
const SalesCustomer = require('../models/SalesCustomer');
const TradexFollowup = require('../models/TradexFollowup');
const Followup = require('../models/Followup');
const EnsraFollowup = require('../models/EnsraFollowup');
const ContentTrackerEntry = require('../models/ContentTrackerEntry');
const Payment = require('../models/Payment');
const TessbinKpiReport = require('../models/TessbinKpiReport');
const { cooMetrics } = require('../utils/tessbinKpiReport');
const CooKpiTarget = require('../models/CooKpiTarget');
const SocialWeeklyKpi = require('../models/SocialWeeklyKpi');
const { periodRange, analyzeMetrics, slug } = require('../utils/departmentKpiAnalytics');

const HR_FIELDS = [
  ['postVacancies', 'Vacancies posted', 'vacancies'], ['screenCvs', 'CVs screened', 'CVs'],
  ['conductInterviews', 'Interviews conducted', 'interviews'], ['facilitateInternalTrainings', 'Internal trainings', 'sessions'],
  ['attendancePunctuality', 'Attendance and punctuality', '%'], ['checkingJobEnisra', 'Ensira job checks', 'checks'],
  ['newHires', 'New hires', 'people'], ['resignations', 'Resignations', 'people', true],
  ['candidatesPool', 'Candidate pool', 'people'], ['staffTrainingParticipants', 'Training participants', 'people'],
];
const MONEY = /\b(revenue|ETB|birr|USD|costs?|expenses?|profits?|budgets?|salary|commission|price|amount|income|ROI)\b/i;

exports.getDepartmentAnalytics = async (req, res) => {
  const { periodType, periodKey } = req.query;
  let range;
  try { range = periodRange(periodType, periodKey); }
  catch { return res.status(400).json({ message: 'Provide a valid weekly, monthly, or quarterly reporting period.' }); }
  const between = { $gte: range.start, $lt: range.end };
  try {
    const [hr, salesReport, it, tasks, sales, tradex, customers, ensira, content, payments, tessbin, targets, socialReports] = await Promise.all([
      HrKpi.findOne({ periodType, periodKey }).lean(),
      SalesDepartmentKpi.findOne({ periodType, periodKey, submittedAt: { $ne: null } }).lean(),
      ITTask.find({ date: between }).select('projectType status workflowStatus updatedAt').lean(),
      Task.find({ dueDate: between, status: { $ne: 'Cancelled' } }).select('assignedTo status updatedAt').populate('assignedTo', 'role department').lean(),
      SalesCustomer.find({ createdAt: between }).select('followupStatus callStatus updatedAt').lean(),
      TradexFollowup.find({ createdAt: between }).select('status updatedAt').lean(),
      Followup.find({ createdAt: between }).select('followupStatus updatedAt').lean(),
      EnsraFollowup.find({ createdAt: between }).select('type updatedAt').lean(),
      ContentTrackerEntry.find({ date: between }).select('type approved updatedAt createdBy').populate('createdBy', 'role department').lean(),
      Payment.find({ createdAt: between }).select('createdAt').lean(),
      TessbinKpiReport.findOne({ timeframe: periodType, periodStart: range.start.toISOString().slice(0, 10), status: 'submitted' }).lean(),
      CooKpiTarget.find({ period: periodKey, granularity: periodType === 'weekly' ? 'week' : 'month' }).lean(),
      SocialWeeklyKpi.find({ active: { $ne: false }, weekStart: { $gte: range.start.toISOString().slice(0, 10), $lt: range.end.toISOString().slice(0, 10) } }).lean(),
    ]);
    const customerReport = await CustomerDepartmentKpi.findOne({ periodType, periodKey, submittedAt: { $ne: null } }).lean();
    const records = [];
    const overrides = new Map(targets.map((row) => [row.kpiId, row.target]));
    const add = (department, name, actual, source, options = {}) => {
      const id = slug(`${department}-${name}`);
      records.push({ id, department, name, actual, target: overrides.has(id) ? overrides.get(id) : (options.target ?? null), unit: options.unit || 'records', source, ...options });
      if (overrides.has(id)) records[records.length - 1].target = overrides.get(id);
    };
    const latest = (rows) => rows.reduce((date, row) => row.updatedAt && (!date || row.updatedAt > date) ? row.updatedAt : date, null);
    if (hr) HR_FIELDS.forEach(([field, name, unit, lowerIsBetter]) => {
      const metric = hr[field];
      if (!metric || (metric.status === 'Not Reported' && !metric.actual && !metric.target)) return;
      add('HR', name, metric.actual, 'HR KPI report', { target: metric.target, unit, lowerIsBetter, updatedAt: hr.updatedAt });
    });
    if (salesReport) ['measurements', 'services', 'products'].forEach((section) => {
      (salesReport[section] || []).filter((row) => !MONEY.test(row.kpi)).forEach((row) => {
        if (row.status === 'Not Reported' && !row.actual && !row.target) return;
        add('Sales', `${section}: ${row.kpi}`, row.actual, 'Submitted sales KPI report', { target: row.target, unit: /rate/i.test(row.kpi) ? '%' : 'count', updatedAt: salesReport.updatedAt });
      });
    });
    if (!salesReport && sales.length) {
      add('Sales', 'New clients', sales.length, 'Sales customer records created in period', { updatedAt: latest(sales), unit: 'clients' });
      add('Sales', 'Completed deals for new clients', sales.filter((row) => row.followupStatus === 'Completed').length, 'Current status of sales customers created in period', { updatedAt: latest(sales), unit: 'deals' });
    }
    for (const projectType of ['internal', 'external']) {
      const rows = it.filter((row) => row.projectType === projectType);
      if (rows.length) add('IT', `${projectType} tasks completed`, rows.filter((row) => row.status === 'done' || row.workflowStatus === 'completed').length, 'Current status of IT tasks dated in period', { unit: 'tasks', updatedAt: latest(rows) });
    }
    if (tradex.length) add('Tradex TV', 'Completed client follow-ups', tradex.filter((row) => String(row.status).toLowerCase() === 'completed').length, 'Current status of Tradex follow-ups created in period', { unit: 'follow-ups', updatedAt: latest(tradex) });
    if (customerReport) customerReport.metrics.forEach((row) => add('Customer Success', `${row.section}: ${row.kpi}`, row.actual, 'Submitted customer service KPI report', { target: row.target, unit: 'count', updatedAt: customerReport.updatedAt }));
    if (!customerReport && customers.length) add('Customer Success', 'Completed customer follow-ups', customers.filter((row) => row.followupStatus === 'Completed').length, 'Current status of customer follow-ups created in period', { unit: 'follow-ups', updatedAt: latest(customers) });
    for (const type of ['company', 'jobSeeker']) {
      const rows = ensira.filter((row) => row.type === type);
      if (rows.length) add('Ensira', type === 'company' ? 'Companies registered' : 'Job seekers registered', rows.length, 'Ensira registrations created in period', { updatedAt: latest(rows) });
    }
    const socialContent = content.filter((row) => /socialmedia|social media/i.test(`${row.createdBy?.role || ''} ${row.createdBy?.department || ''}`));
    for (const platform of [...new Set(socialReports.map((row) => row.platform))]) {
      const rows = socialReports.filter((row) => row.platform === platform);
      for (const field of ['videos', 'graphics', 'views', 'likes', 'shares']) {
        add('Social Media', `${platform} ${field}`, rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0), 'Saved weekly social reports with week start in period', { unit: field, updatedAt: latest(rows) });
      }
    }
    for (const type of [...new Set(socialContent.map((row) => row.type))]) {
      const rows = socialContent.filter((row) => row.type === type);
      add('Social Media', `${type} approved`, rows.filter((row) => row.approved).length, 'Approved content dated in period, owned by Social Media staff', { updatedAt: latest(rows) });
    }
    if (payments.length) add('Finance', 'Payments recorded', payments.length, 'Payment records created in period', { unit: 'payments', updatedAt: payments[payments.length - 1].createdAt });
    for (const department of ['Supervisor', 'Finance']) {
      const rows = tasks.filter((row) => String(row.assignedTo?.role).toLowerCase() === department.toLowerCase() || String(row.assignedTo?.department).toLowerCase() === department.toLowerCase());
      if (rows.length) add(department, 'Assigned tasks completed', rows.filter((row) => row.status === 'Completed').length, 'Current status of assigned tasks due in period', { unit: 'tasks', updatedAt: latest(rows) });
    }
    records.push(...cooMetrics(tessbin));
    return res.json({ ...analyzeMetrics(records, periodKey), periodType, periodKey, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Department KPI analytics failed:', error.message);
    return res.status(500).json({ message: 'Unable to load department KPI analysis.' });
  }
};
