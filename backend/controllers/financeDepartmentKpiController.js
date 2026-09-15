const FinanceDepartmentKpi = require('../models/FinanceDepartmentKpi');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Cost = require('../models/Cost');
const RevenueActual = require('../models/RevenueActual');
const { notifyKpiSubmission } = require('../services/kpiSubmissionNotificationService');
const User = require('../models/user.model');

const DEFAULT_FINANCIAL_METRICS = [
  { kpi: 'Weekly Revenue', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Weekly Expenses', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Net Position', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Receivables Collected', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
  { kpi: 'Tax Status', target: 0, actual: 0, achievement: 0, status: 'Not Reported', notes: '' },
];

const calculateMetricAchievement = (actual, target, manualStatus) => {
  const numActual = (actual === '' || actual === null || actual === undefined || isNaN(actual)) ? 0 : Number(actual);
  const numTarget = (target === '' || target === null || target === undefined || isNaN(target)) ? 0 : Number(target);
  const achievement = numTarget > 0 ? Math.round((numActual / numTarget) * 100) : 0;

  let status = manualStatus;
  if (!status || status === 'Pending' || status === 'Not Reported' || numTarget === 0) {
    if (numTarget === 0 && numActual === 0) {
      status = 'Not Reported';
    } else if (numTarget > 0) {
      if (achievement >= 100) status = 'Completed';
      else if (achievement >= 80) status = 'On Track';
      else if (achievement >= 50) status = 'At Risk';
      else status = 'Behind';
    } else {
      status = 'Not Reported';
    }
  }

  return { achievement: achievement ?? 0, status };
};

const resolvePeriodKey = (periodType, periodKey) => {
  if (periodKey) return periodKey;
  const now = new Date();
  const currentYear = now.getFullYear();

  if (periodType === 'weekly') {
    const startOfYear = new Date(currentYear, 0, 1);
    const pastDays = (now - startOfYear) / 86400000;
    const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
    return `${currentYear}-W${String(weekNum).padStart(2, '0')}`;
  }
  if (periodType === 'quarterly') {
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `${currentYear}-Q${q}`;
  }
  return `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const parsePeriodDateRange = (periodType, periodKey) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const key = resolvePeriodKey(periodType, periodKey);

  if (periodType === 'weekly') {
    const match = String(key || '').match(/^(\d{4})-W(\d{1,2})$/);
    const year = match ? parseInt(match[1]) : currentYear;
    const week = match ? parseInt(match[2]) : 1;

    // ISO week calculation
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const mondayWeek1 = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
    const startDate = new Date(mondayWeek1.getTime() + (week - 1) * 7 * 86400000);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate.getTime() + 7 * 86400000 - 1);

    return {
      startDate,
      endDate,
      year,
      label: `Week ${week}, ${year}`,
      periodKey: key,
    };
  }

  if (periodType === 'quarterly') {
    const match = String(key || '').match(/^(\d{4})-Q(\d)$/);
    const year = match ? parseInt(match[1]) : currentYear;
    const quarter = match ? parseInt(match[2]) : 1;

    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1, 0, 0, 0, 0);
    const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);

    return {
      startDate,
      endDate,
      year,
      label: `Q${quarter} ${year}`,
      periodKey: key,
    };
  }

  // Monthly default
  const match = String(key || '').match(/^(\d{4})-(\d{1,2})$/);
  const year = match ? parseInt(match[1]) : currentYear;
  const month = match ? parseInt(match[2]) - 1 : now.getMonth();

  const startDate = new Date(year, month, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return {
    startDate,
    endDate,
    year,
    label: `${monthNames[month]} ${year}`,
    periodKey: key,
  };
};

// Calculate real operational financial metrics from database for a given date range
const calculateRealOperationalFinance = async (periodType, periodKey) => {
  const { startDate, endDate, year, label } = parsePeriodDateRange(periodType, periodKey);

  // 1. Revenue from Payments within date range
  const paymentAgg = await Payment.aggregate([
    {
      $match: {
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { paymentDate: { $gte: startDate, $lte: endDate } },
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  const paymentRevenue = paymentAgg[0]?.total || 0;
  const paymentCount = paymentAgg[0]?.count || 0;

  // Revenue from RevenueActual model if recorded for this month/year
  let recordedRevenue = 0;
  try {
    const monthStr = String(startDate.getMonth() + 1);
    const revenueDocs = await RevenueActual.find({
      year,
      month: { $in: [monthStr, `0${monthStr}`, startDate.toLocaleString('en', { month: 'short' }), startDate.toLocaleString('en', { month: 'long' })] },
      active: true,
    });
    recordedRevenue = revenueDocs.reduce((sum, doc) => sum + (Number(doc.actual) || 0), 0);
  } catch (err) {
    console.warn('RevenueActual fetch error:', err.message);
  }

  const operationalRevenue = Math.max(paymentRevenue, recordedRevenue);

  // 2. Operational Expenses from Expense model
  const expenseAgg = await Expense.aggregate([
    {
      $match: {
        $or: [
          { expenseDate: { $gte: startDate, $lte: endDate } },
          { createdAt: { $gte: startDate, $lte: endDate } },
        ],
        status: { $ne: 'rejected' },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        taxTotal: { $sum: '$taxAmount' },
        count: { $sum: 1 },
      },
    },
  ]);
  const expenseTotal = expenseAgg[0]?.total || 0;
  const expenseTaxTotal = expenseAgg[0]?.taxTotal || 0;

  // Costs from Cost model
  let costTotal = 0;
  try {
    const costAgg = await Cost.aggregate([
      {
        $match: {
          $or: [
            { date: { $gte: startDate, $lte: endDate } },
            { createdAt: { $gte: startDate, $lte: endDate } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    costTotal = costAgg[0]?.total || 0;
  } catch (err) {
    console.warn('Cost fetch error:', err.message);
  }

  const operationalExpenses = expenseTotal + costTotal;
  const netPosition = operationalRevenue - operationalExpenses;
  const receivablesCollected = paymentRevenue;
  const taxStatus = expenseTaxTotal;

  return {
    label,
    year,
    startDate,
    endDate,
    stats: {
      revenue: operationalRevenue,
      expenses: operationalExpenses,
      netPosition,
      receivablesCollected,
      taxStatus,
      paymentCount,
    },
  };
};

// GET /api/finance-department-kpi
exports.getFinanceDepartmentKpis = async (req, res) => {
  try {
    const { periodType = 'weekly', periodKey } = req.query;
    const key = resolvePeriodKey(periodType, periodKey);
    const { year, label, startDate, endDate } = parsePeriodDateRange(periodType, key);

    let record = await FinanceDepartmentKpi.findOne({ periodType, periodKey: key });

    // If no exact match found, check for related submissions
    if (!record) {
      if (periodType === 'monthly') {
        // Find weekly submissions in this month
        const weeklyDocs = await FinanceDepartmentKpi.find({
          periodType: 'weekly',
          year,
          status: 'Submitted',
        }).sort({ periodKey: -1 });

        const matchingWeeklyDocs = weeklyDocs.filter((doc) => {
          const docRange = parsePeriodDateRange('weekly', doc.periodKey);
          return (docRange.startDate <= endDate && docRange.endDate >= startDate);
        });

        if (matchingWeeklyDocs.length > 0) {
          const aggregatedFinancials = DEFAULT_FINANCIAL_METRICS.map((base) => {
            let sumTarget = 0;
            let sumActual = 0;
            let latestStatus = 'On Track';
            let latestNotes = '';

            matchingWeeklyDocs.forEach((wDoc) => {
              const row = (wDoc.financials || []).find((f) => f.kpi === base.kpi);
              if (row) {
                sumTarget += Number(row.target) || 0;
                sumActual += Number(row.actual) || 0;
                if (row.status) latestStatus = row.status;
                if (row.notes) latestNotes = row.notes;
              }
            });

            const { achievement, status } = calculateMetricAchievement(sumActual, sumTarget, latestStatus);
            return {
              ...base,
              target: sumTarget,
              actual: sumActual,
              achievement,
              status,
              notes: latestNotes,
            };
          });

          const latestDoc = matchingWeeklyDocs[0];
          return res.json({
            success: true,
            data: {
              periodType,
              periodKey: key,
              year,
              periodLabel: label,
              financials: aggregatedFinancials,
              summaryNotes: latestDoc.summaryNotes || `Reported from weekly submission(s) (${matchingWeeklyDocs.map(d => d.periodKey).join(', ')})`,
              submittedBy: latestDoc.submittedBy,
              submittedByName: latestDoc.submittedByName,
              submittedAt: latestDoc.submittedAt,
              status: 'Submitted',
              isAggregated: true,
            },
          });
        }
      }

      // If weekly queried but not found, check if there's ANY submitted weekly record for this year
      if (periodType === 'weekly') {
        const anyWeekly = await FinanceDepartmentKpi.findOne({
          periodType: 'weekly',
          year,
          status: 'Submitted',
        }).sort({ periodKey: -1 });

        if (anyWeekly) {
          // If within same month or recent, return it so data is not blank
          const normalized = (anyWeekly.financials || []).map((item) => {
            const target = Number(item.target) || 0;
            const actual = Number(item.actual) || 0;
            const { achievement, status } = calculateMetricAchievement(actual, target, item.status);
            return {
              ...item.toObject ? item.toObject() : item,
              target,
              actual,
              achievement,
              status,
            };
          });

          return res.json({
            success: true,
            data: {
              ...anyWeekly.toObject(),
              periodType,
              periodKey: key,
              periodLabel: `${label} (Latest: ${anyWeekly.periodLabel || anyWeekly.periodKey})`,
              financials: normalized,
            },
          });
        }
      }

      // If still nothing, calculate baseline operational data
      const operationalData = await calculateRealOperationalFinance(periodType, key);

      const financials = DEFAULT_FINANCIAL_METRICS.map((item) => {
        let actual = 0;
        if (item.kpi === 'Weekly Revenue' || item.kpi === 'Revenue') actual = operationalData.stats.revenue;
        else if (item.kpi === 'Weekly Expenses' || item.kpi === 'Expenses') actual = operationalData.stats.expenses;
        else if (item.kpi === 'Net Position') actual = operationalData.stats.netPosition;
        else if (item.kpi === 'Receivables Collected') actual = operationalData.stats.receivablesCollected;
        else if (item.kpi === 'Tax Status') actual = operationalData.stats.taxStatus;

        return {
          ...item,
          target: 0,
          actual,
          achievement: 0,
          status: 'Not Reported',
          notes: '',
        };
      });

      return res.json({
        success: true,
        data: {
          periodType,
          periodKey: key,
          year,
          periodLabel: label,
          financials,
          summaryNotes: '',
          submittedBy: null,
          submittedByName: '',
          submittedAt: null,
          status: 'Not Reported',
          isOperationalBaseline: true,
        },
      });
    }

    // Ensure all target/status defaults are normalized
    const normalizedFinancials = (record.financials || []).map((item) => {
      const target = Number(item.target) || 0;
      const actual = Number(item.actual) || 0;
      const { achievement, status } = calculateMetricAchievement(actual, target, item.status);
      return {
        ...item.toObject ? item.toObject() : item,
        target,
        actual,
        achievement,
        status: (target === 0 && actual === 0 && !record.submittedAt) ? 'Not Reported' : status,
      };
    });

    res.json({
      success: true,
      data: {
        ...record.toObject(),
        financials: normalizedFinancials,
        periodLabel: record.periodLabel || label,
      },
    });
  } catch (error) {
    console.error('Error fetching finance department KPI:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/finance-department-kpi
exports.saveFinanceDepartmentKpi = async (req, res) => {
  try {
    const {
      periodType = 'weekly',
      periodKey,
      financials = [],
      detailedCategories = [],
      summaryNotes = '',
      submitToCoo = false,
    } = req.body;

    const key = resolvePeriodKey(periodType, periodKey);
    const { year, label } = parsePeriodDateRange(periodType, key);

    const submitterName = req.user?.name || req.user?.username || 'Finance Department';
    const submitterId = req.user?._id || req.user?.id || null;

    const processedFinancials = financials.map((item) => {
      const target = (item.target === '' || item.target === null || item.target === undefined || isNaN(item.target)) ? 0 : Number(item.target);
      const actual = (item.actual === '' || item.actual === null || item.actual === undefined || isNaN(item.actual)) ? 0 : Number(item.actual);
      const { achievement, status } = calculateMetricAchievement(actual, target, item.status);

      return {
        kpi: item.kpi,
        target,
        actual,
        achievement,
        status,
        notes: item.notes || '',
      };
    });

    const updatePayload = {
      periodType,
      periodKey: key,
      year,
      periodLabel: label,
      financials: processedFinancials,
      detailedCategories,
      summaryNotes,
    };

    if (submitToCoo) {
      updatePayload.submittedBy = submitterId;
      updatePayload.submittedByName = submitterName;
      updatePayload.submittedAt = new Date();
      updatePayload.status = 'Submitted';
    } else {
      updatePayload.status = 'Draft';
    }

    const record = await FinanceDepartmentKpi.findOneAndUpdate(
      { periodType, periodKey: key },
      { $set: updatePayload },
      { new: true, upsert: true, runValidators: true }
    );

    if (submitToCoo) await notifyKpiSubmission(req, { departmentId: 'finance', periodType, periodKey: key, reportId: record._id, notes: summaryNotes });

    res.json({
      success: true,
      message: submitToCoo
        ? `Finance KPI report for ${key} submitted successfully to COO2.`
        : `Finance KPI draft for ${key} saved successfully.`,
      data: record,
    });
  } catch (error) {
    console.error('Error saving Finance department KPI:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/finance-department-kpi/live-stats
exports.getFinanceLiveStats = async (req, res) => {
  try {
    const { periodType = 'weekly', periodKey } = req.query;
    const key = resolvePeriodKey(periodType, periodKey);
    const operationalData = await calculateRealOperationalFinance(periodType, key);

    res.json({
      success: true,
      stats: operationalData.stats,
      data: {
        operationalStats: operationalData.stats,
        periodLabel: operationalData.label,
      },
      periodLabel: operationalData.label,
    });
  } catch (error) {
    console.error('Error fetching finance live stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
