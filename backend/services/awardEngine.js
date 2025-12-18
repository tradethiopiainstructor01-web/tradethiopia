const MonthlyPerformance = require('../models/MonthlyPerformance');
const Award = require('../models/Award');
const User = require('../models/user.model');

const SCORE_SCALE = 100;

// Strategy map for KPIs per department. Add entries here to extend the engine.
const strategies = {
  TradeXTV: (perf) => ratio(perf.actual, perf.target),
  IT: (perf) => ratio(perf.completedTasks || perf.actual, perf.taskTarget || perf.target),
  SocialMedia: (perf) => ratio(perf.actualAchievements || perf.actual, perf.contentTarget || perf.target),
  Sales: (perf) => ratio(perf.actualSales || perf.actual, perf.salesTarget || perf.target),
  CustomerSuccess: (perf) => inverse(perf.targetServiceTime || perf.target, perf.actualServiceTime || perf.actual),
};

const defaultStrategy = (perf) => ratio(perf.actual, perf.target);

function ratio(actual, target) {
  const actualValue = Number(actual) || 0;
  const targetValue = Number(target) || 0;
  if (targetValue <= 0) return 0;
  return (actualValue / targetValue) * SCORE_SCALE;
}

function inverse(target, actual) {
  const targetValue = Number(target) || 0;
  const actualValue = Number(actual) || 0;
  if (targetValue <= 0 || actualValue <= 0) return 0;
  return (targetValue / actualValue) * SCORE_SCALE;
}

function finalizeScore(value) {
  const candidate = Number(value);
  if (!Number.isFinite(candidate)) return 0;
  const clamped = Math.max(0, Math.min(SCORE_SCALE, candidate));
  return Math.round(clamped * 100) / 100;
}

async function calculateForMonth(month) {
  const alreadyPublished = await Award.exists({ month });
  if (alreadyPublished) {
    throw new Error('Awards for this month have already been published');
  }

  const users = await User.find({ status: 'active' }).lean();
  const computed = [];

  for (const user of users) {
    let perf = await MonthlyPerformance.findOne({ employeeId: user._id, month });
    if (!perf) {
      perf = new MonthlyPerformance({
        employeeId: user._id,
        department: user.jobTitle || user.role || 'Unknown',
        month,
        target: 0,
        actual: 0,
        taskTarget: 0,
        completedTasks: 0,
        contentTarget: 0,
        actualAchievements: 0,
        salesTarget: 0,
        actualSales: 0,
        targetServiceTime: 0,
        actualServiceTime: 0,
      });
      await perf.save();
    }

    const populatedPerf = await perf.populate('employeeId');
    const deptKey = normalizeDept(populatedPerf.department, populatedPerf.employeeId);
    const strategy = strategies[deptKey] || defaultStrategy;
    const score = finalizeScore(strategy(populatedPerf));

    computed.push({
      perf: populatedPerf,
      score,
      department: deptKey,
    });
  }

  await Promise.all(computed.map((entry) => {
    entry.perf.score = entry.score;
    entry.perf.calculatedAt = new Date();
    return entry.perf.save();
  }));

  const byDepartment = {};
  computed.forEach((entry) => {
    const department = entry.department || 'Unknown';
    if (!byDepartment[department]) {
      byDepartment[department] = [];
    }
    byDepartment[department].push(entry);
  });

  const awardDocs = [];
  const publishedAt = new Date();

  Object.entries(byDepartment).forEach(([department, entries]) => {
    const winner = entries.sort((a, b) => b.score - a.score)[0];
    if (!winner) return;
    awardDocs.push({
      month,
      department,
      employeeId: winner.perf.employeeId._id,
      score: winner.score,
      awardType: 'Department Winner',
      publishedAt,
    });
  });

  const overall = computed.slice().sort((a, b) => b.score - a.score)[0];
  if (overall) {
    awardDocs.push({
      month,
      department: overall.department,
      employeeId: overall.perf.employeeId._id,
      score: overall.score,
      awardType: 'Overall Winner',
      publishedAt,
    });
  }

  if (!awardDocs.length) {
    throw new Error('No eligible performances found for the month');
  }

  const saved = await Award.insertMany(awardDocs);
  return saved;
}

function normalizeDept(department, user) {
  if (!department && user) return user.role || 'Unknown';
  const dept = String(department || '').trim();
  if (/tradex|tradextv|tvetv/i.test(dept)) return 'TradeXTV';
  if (/it/i.test(dept)) return 'IT';
  if (/social|socialmedia|social media/i.test(dept)) return 'SocialMedia';
  if (/sales/i.test(dept)) return 'Sales';
  if (/customer|service|success/i.test(dept)) return 'CustomerSuccess';
  return dept || (user && user.role) || 'Unknown';
}

module.exports = {
  calculateForMonth,
  strategies,
  normalizeDept,
};
