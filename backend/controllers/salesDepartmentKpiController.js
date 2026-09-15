const SalesDepartmentKpi = require('../models/SalesDepartmentKpi');
const SalesCustomer = require('../models/SalesCustomer');
const PackageSale = require('../models/PackageSale');
const Order = require('../models/Order');
const RevenueActual = require('../models/RevenueActual');
const CooKpiTarget = require('../models/CooKpiTarget');
const { notifyKpiSubmission } = require('../services/kpiSubmissionNotificationService');
const User = require('../models/user.model');

// Service line definitions mapped to regex patterns for real SalesCustomer courses/interests
// Service line definitions mapped to regex patterns for real SalesCustomer courses/interests
const SERVICE_DEFINITIONS = [
  { kpi: 'International Import/Export', target: 0, regex: /(international|import|export|trade)/i, notes: 'Trades & training conversions' },
  { kpi: 'Stock Market', target: 0, regex: /stock/i, notes: 'Stock advisory & training' },
  { kpi: 'Coffee Cupping', target: 0, regex: /(coffee|cupping)/i, notes: 'Sensory evaluations & courses' },
  { kpi: 'Digital Marketing', target: 0, regex: /digital\s*marketing/i, notes: 'Marketing campaigns & courses' },
  { kpi: 'Barista', target: 0, regex: /barista/i, notes: 'Barista services & trainings' },
  { kpi: 'Sales & Marketing', target: 0, regex: /sales\s*(&|and)?\s*marketing/i, notes: 'Consulting & sales training' },
  { kpi: 'Documentation', target: 0, regex: /document/i, notes: 'Export doc packages' },
  { kpi: 'Business Development', target: 0, regex: /(business\s*dev|business\s*analytics)/i, notes: 'B2B enterprise pipeline' },
  { kpi: 'International Trade Brokerage', target: 0, regex: /broker/i, notes: 'Brokerage mandates' },
  { kpi: 'Logistic & Supply Management', target: 0, regex: /(logistic|supply)/i, notes: 'Freight & logistics deals' },
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

// Precise date range parser for monthly, weekly, and quarterly periods
const parsePeriodDateRange = (periodType, periodKey) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const key = resolvePeriodKey(periodType, periodKey);

  if (periodType === 'weekly') {
    const match = String(key || '').match(/^(\d{4})-W(\d{1,2})$/);
    const year = match ? parseInt(match[1]) : currentYear;
    const week = match ? parseInt(match[2]) : 1;

    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = (jan4.getUTCDay() + 6) % 7;
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + (week - 1) * 7);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    return { startDate: monday, endDate: sunday, year, label: `${year}-W${String(week).padStart(2, '0')}` };
  }

  if (periodType === 'quarterly') {
    const match = String(key || '').match(/^(\d{4})-Q(\d)$/);
    const year = match ? parseInt(match[1]) : currentYear;
    const q = match ? parseInt(match[2]) : Math.floor(now.getMonth() / 3) + 1;

    const startMonth = (q - 1) * 3;
    const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59, 999));

    return { startDate, endDate, year, label: `${year}-Q${q}` };
  }

  // Monthly
  const match = String(key || '').match(/^(\d{4})-(\d{1,2})$/);
  const year = match ? parseInt(match[1]) : currentYear;
  const month = match ? parseInt(match[2]) : now.getMonth() + 1;

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return { startDate, endDate, year, label: `${year}-${String(month).padStart(2, '0')}` };
};

// Core helper: Aggregates real operational data from MongoDB collections for the period
const calculateRealOperationalSales = async (periodType, periodKey) => {
  const { startDate, endDate, year, label } = parsePeriodDateRange(periodType, periodKey);

  const dateFilter = {
    $or: [
      { date: { $gte: startDate, $lte: endDate } },
      { createdAt: { $gte: startDate, $lte: endDate } },
    ],
  };

  // 1. Sales Customer Aggregates
  const totalNewClients = await SalesCustomer.countDocuments(dateFilter);
  const completedSales = await SalesCustomer.countDocuments({ ...dateFilter, followupStatus: 'Completed' });
  const conversionRate = totalNewClients > 0 ? Math.round((completedSales / totalNewClients) * 100) : 0;
  const followUpsCompleted = await SalesCustomer.countDocuments({
    ...dateFilter,
    callStatus: { $in: ['Called', '2x Called', 'Callback'] },
  });

  const salesCustomerRevenueAgg = await SalesCustomer.aggregate([
    { $match: { ...dateFilter, followupStatus: 'Completed' } },
    { $group: { _id: null, total: { $sum: '$coursePrice' } } },
  ]);
  const salesCustomerRevenue = salesCustomerRevenueAgg[0]?.total || 0;

  // 2. Package Sales
  const packageSalesCount = await PackageSale.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
  const packageSalesRevenueAgg = await PackageSale.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, total: { $sum: { $ifNull: ['$totalPrice', 0] } } } },
  ]);
  const packageRevenue = packageSalesRevenueAgg[0]?.total || 0;

  // 3. Orders (Products / Equipment)
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $ne: 'Cancelled' },
  }).lean();
  const orderRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // 4. Finance Recorded Sales Actuals
  const revRecords = await RevenueActual.find({
    department: /sales/i,
    date: { $gte: startDate, $lte: endDate },
    active: { $ne: false },
  }).lean();
  const revActualTotal = revRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const totalRealRevenue = salesCustomerRevenue + packageRevenue + orderRevenue + revActualTotal;
  const subscriptionsSold = packageSalesCount + (await SalesCustomer.countDocuments({
    ...dateFilter,
    packageScope: { $in: ['Local', 'International'] },
    followupStatus: 'Completed',
  }));

  // Target overrides lookup from CooKpiTarget
  const targetMap = new Map();
  try {
    const cooTargets = await CooKpiTarget.find({ period: label }).lean();
    cooTargets.forEach((t) => targetMap.set(t.kpiId, t.target));
  } catch {
    // optional
  }

  // 1. Sales Measurements (Uninputted targets default to 0)
  const measurements = [
    {
      kpi: 'Total Revenue',
      target: targetMap.get('total-revenue') || 0,
      actual: totalRealRevenue,
      notes: 'Real operational revenue in ETB',
    },
    {
      kpi: 'New Clients',
      target: targetMap.get('new-clients') || 0,
      actual: totalNewClients,
      notes: 'Real registered sales clients',
    },
    {
      kpi: 'Conversion Rate',
      target: targetMap.get('conversion-rate') || 0,
      actual: conversionRate,
      notes: 'Real lead to completed customer %',
    },
    {
      kpi: 'Subscriptions Sold',
      target: targetMap.get('subscriptions-sold') || 0,
      actual: subscriptionsSold,
      notes: 'Real package & scope subscriptions',
    },
    {
      kpi: 'Follow-Ups Completed',
      target: targetMap.get('follow-ups-completed') || 0,
      actual: followUpsCompleted,
      notes: 'Real logged client touchpoints',
    },
  ].map((item) => {
    const { achievement, status } = calculateMetricAchievement(item.actual, item.target);
    return { ...item, achievement, status };
  });

  // 2. Service Lines Breakdown (Real queries - uninputted targets default to 0)
  const services = [];
  for (const s of SERVICE_DEFINITIONS) {
    const sCount = await SalesCustomer.countDocuments({
      $and: [
        dateFilter,
        {
          $or: [
            { courseName: { $regex: s.regex } },
            { productInterest: { $regex: s.regex } },
          ],
        },
      ],
    });
    const sTarget = targetMap.get(s.kpi.toLowerCase().replace(/[^a-z0-9]/g, '-')) || s.target;
    const { achievement, status } = calculateMetricAchievement(sCount, sTarget);
    services.push({
      kpi: s.kpi,
      target: sTarget,
      actual: sCount,
      achievement,
      status,
      notes: s.notes,
    });
  }

  // 3. Products Breakdown (Real orders - uninputted targets default to 0)
  let coffeeLabActual = 0;
  let otherMachineActual = 0;
  orders.forEach((ord) => {
    (ord.items || []).forEach((item) => {
      const name = String(item.name || item.itemName || ord.notes || '').toLowerCase();
      if (name.includes('lab') || name.includes('coffee') || name.includes('cup') || name.includes('tray')) {
        coffeeLabActual += Number(item.quantity) || 1;
      } else {
        otherMachineActual += Number(item.quantity) || 1;
      }
    });
  });

  const products = [
    {
      kpi: 'Coffee Lab Equipment (full package)',
      target: targetMap.get('coffee-lab-equipment') || 0,
      actual: coffeeLabActual,
      notes: 'Complete lab setup orders',
    },
    {
      kpi: 'Other Machines/Electronics',
      target: targetMap.get('other-machines') || 0,
      actual: otherMachineActual,
      notes: 'Auxiliary machinery',
    },
  ].map((item) => {
    const { achievement, status } = calculateMetricAchievement(item.actual, item.target);
    return { ...item, achievement, status };
  });

  return {
    startDate,
    endDate,
    year,
    label,
    measurements,
    services,
    products,
    stats: {
      totalRevenue: totalRealRevenue,
      newClients: totalNewClients,
      completedDeals: completedSales,
      conversionRate,
      followUpsCompleted,
      subscriptionsSold,
      ordersCount: orders.length,
      packageSalesCount,
    },
  };
};

// GET /api/sales-department-kpi?periodType=monthly&periodKey=2026-09
exports.getSalesDepartmentKpis = async (req, res) => {
  try {
    const { periodType = 'monthly', periodKey } = req.query;
    const key = resolvePeriodKey(periodType, periodKey);
    const keyYear = parseInt(key.split('-')[0]) || new Date().getFullYear();

    // Calculate real operational values for this exact period
    const operationalData = await calculateRealOperationalSales(periodType, key);

    const record = await SalesDepartmentKpi.findOne({ periodType, periodKey: key });

    // If no manual submission exists yet, return dynamically aggregated real operational data
    if (!record) {
      return res.json({
        success: true,
        data: {
          periodType,
          periodKey: key,
          year: keyYear,
          periodLabel: key,
          measurements: operationalData.measurements,
          services: operationalData.services,
          products: operationalData.products,
          summaryNotes: '',
          isDefault: true,
          isLiveOperational: true,
          submittedAt: null,
          submittedByName: null,
        },
        operationalRealData: operationalData,
      });
    }

    return res.json({
      success: true,
      data: record,
      operationalRealData: operationalData,
    });
  } catch (error) {
    console.error('Error fetching sales department KPIs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sales-department-kpi/live-operational-data
exports.getRealSalesOperationalDataEndpoint = async (req, res) => {
  try {
    const { periodType = 'monthly', periodKey } = req.query;
    const key = resolvePeriodKey(periodType, periodKey);
    const operationalData = await calculateRealOperationalSales(periodType, key);

    res.json({
      success: true,
      periodType,
      periodKey: key,
      data: operationalData,
    });
  } catch (error) {
    console.error('Error fetching real sales operational data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/sales-department-kpi
exports.saveSalesDepartmentKpi = async (req, res) => {
  try {
    const {
      periodType = 'monthly',
      periodKey,
      year,
      measurements = [],
      services = [],
      products = [],
      summaryNotes = '',
    } = req.body;

    const key = resolvePeriodKey(periodType, periodKey);
    const keyYear = Number(year) || parseInt(key.split('-')[0]) || new Date().getFullYear();

    const sanitizeRows = (rows) => (rows || []).map((row) => {
      const target = (row.target === '' || row.target === null || row.target === undefined || isNaN(row.target)) ? 0 : Number(row.target);
      const actual = (row.actual === '' || row.actual === null || row.actual === undefined || isNaN(row.actual)) ? 0 : Number(row.actual);
      const { achievement, status } = calculateMetricAchievement(actual, target, row.status);
      return {
        kpi: String(row.kpi || '').trim(),
        target,
        actual,
        achievement: achievement ?? 0,
        status: status || (target === 0 && actual === 0 ? 'Not Reported' : 'Pending'),
        notes: String(row.notes || '').trim(),
      };
    });

    const sanitizedMeasurements = sanitizeRows(measurements);
    const sanitizedServices = sanitizeRows(services);
    const sanitizedProducts = sanitizeRows(products);

    const submitterName = req.user?.fullName || req.user?.username || 'Sales Manager';

    const record = await SalesDepartmentKpi.findOneAndUpdate(
      { periodType, periodKey: key },
      {
        $set: {
          periodType,
          periodKey: key,
          year: keyYear,
          periodLabel: key,
          measurements: sanitizedMeasurements,
          services: sanitizedServices,
          products: sanitizedProducts,
          summaryNotes: String(summaryNotes || '').trim(),
          submittedBy: req.user?._id || null,
          submittedByName: submitterName,
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await notifyKpiSubmission(req, { departmentId: 'sales', periodType, periodKey: key, reportId: record._id, notes: summaryNotes });

    res.json({
      success: true,
      message: `Sales KPI report for ${key} submitted successfully to COO2.`,
      data: record,
    });
  } catch (error) {
    console.error('Error saving sales department KPI:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sales-department-kpi/live-stats
exports.getSalesLiveStats = async (req, res) => {
  try {
    const { periodType = 'monthly', periodKey } = req.query;
    const key = resolvePeriodKey(periodType, periodKey);
    const operationalData = await calculateRealOperationalSales(periodType, key);

    const totalAllTimeClients = await SalesCustomer.countDocuments();
    const allTimeCompletedAgg = await SalesCustomer.aggregate([
      { $match: { followupStatus: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$coursePrice' } } },
    ]);
    const totalAllTimeRevenue = allTimeCompletedAgg[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        totalRevenue: operationalData.stats.totalRevenue,
        clientCount: operationalData.stats.newClients,
        completedDeals: operationalData.stats.completedDeals,
        conversionRate: operationalData.stats.conversionRate,
        followUpsCompleted: operationalData.stats.followUpsCompleted,
        subscriptionsSold: operationalData.stats.subscriptionsSold,
        allTimeClients: totalAllTimeClients,
        allTimeRevenue: totalAllTimeRevenue,
        periodLabel: operationalData.label,
      },
    });
  } catch (error) {
    console.error('Error fetching sales live stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
