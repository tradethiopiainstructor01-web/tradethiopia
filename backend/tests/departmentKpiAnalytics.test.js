const test = require('node:test');
const assert = require('node:assert/strict');
const { periodRange, analyzeMetrics } = require('../utils/departmentKpiAnalytics');

test('reporting periods use exact exclusive boundaries and reject invalid ISO weeks', () => {
  assert.equal(periodRange('weekly', '2026-W37').start.toISOString(), '2026-09-07T00:00:00.000Z');
  assert.equal(periodRange('weekly', '2026-W37').end.toISOString(), '2026-09-14T00:00:00.000Z');
  assert.equal(periodRange('monthly', '2024-02').end.toISOString(), '2024-03-01T00:00:00.000Z');
  assert.equal(periodRange('quarterly', '2026-Q4').end.toISOString(), '2027-01-01T00:00:00.000Z');
  assert.throws(() => periodRange('weekly', '2025-W53'));
  assert.throws(() => periodRange('monthly', '2026-13'));
});

test('analysis separates missing targets from zero results and respects lower-is-better KPIs', () => {
  const result = analyzeMetrics([
    { department: 'HR', actual: 0, target: 10, unit: 'people' },
    { department: 'HR', actual: 5, target: null },
    { department: 'HR', actual: 0, target: 0, lowerIsBetter: true },
    { department: 'HR', actual: 3, target: 1, lowerIsBetter: true, unit: 'people' },
    { department: 'Sales', actual: null, target: 10 },
  ], '2026-W37');
  assert.deepEqual(result.metrics.map(row => row.status), ['Below target', 'No measurable target', 'Target met', 'Below target', 'Not reported']);
  assert.equal(result.metrics[0].gap, 10);
  assert.equal(result.metrics[3].gap, 2);
  assert.equal(result.departments.find(row => row.name === 'IT').achievement, null);
  assert.equal(result.departments.length, 10);
  assert.equal(result.departments.find(row => row.name === 'HR').scored, 3);
});

test('endpoint reads department records, excludes money, applies saved targets, and never fabricates missing departments', async () => {
  const names = ['HrKpi', 'SalesDepartmentKpi', 'CustomerDepartmentKpi', 'ITTask', 'Task', 'SalesCustomer', 'TradexFollowup', 'Followup', 'EnsraFollowup', 'ContentTrackerEntry', 'Payment', 'TessbinKpiReport', 'CooKpiTarget', 'SocialWeeklyKpi'];
  const fixtures = {
    CustomerDepartmentKpi: { metrics: [{ section: 'B2B', kpi: 'Emails sent', actual: 100, target: 120 }], submittedAt: '2026-09-14T00:00:00Z' },
    HrKpi: { postVacancies: { actual: 2, target: 4 }, screenCvs: { actual: 0, target: 0, status: 'Not Reported' } },
    SalesDepartmentKpi: { measurements: [{ kpi: 'Total Revenue', actual: 50000, target: 60000 }, { kpi: 'New Clients', actual: 8, target: 10 }], services: [], products: [] },
    TessbinKpiReport: { status: 'submitted', metrics: [{ key: 'evaluations', target: 10, actual: 8 }], submittedAt: '2026-10-01T00:00:00Z' },
    ITTask: [{ projectType: 'internal', status: 'done' }, { projectType: 'internal', status: 'ongoing' }],
    CooKpiTarget: [{ kpiId: 'it-internal-tasks-completed', target: 4 }],
    ContentTrackerEntry: [{ type: 'Video', approved: true, createdBy: { role: 'socialmedia' } }, { type: 'Video', approved: true, createdBy: { role: 'sales' } }],
  };
  const originals = new Map();
  const queries = new Map();
  for (const name of names) {
    const path = require.resolve('../models/' + name);
    originals.set(path, require.cache[path]);
    const find = (query) => {
      queries.set(name, query);
      return { select() { return this; }, populate() { return this; }, lean: async () => fixtures[name] || (['HrKpi', 'SalesDepartmentKpi', 'TessbinKpiReport'].includes(name) ? null : []) };
    };
    require.cache[path] = { id: path, filename: path, loaded: true, exports: { find, findOne: find } };
  }
  const controllerPath = require.resolve('../controllers/departmentKpiAnalyticsController');
  try {
    delete require.cache[controllerPath];
    const { getDepartmentAnalytics } = require(controllerPath);
    let response;
    let status = 200;
    const res = { status(code) { status = code; return this; }, json(value) { response = value; return this; } };
    await getDepartmentAnalytics({ query: { periodType: 'weekly', periodKey: '2026-W37' } }, res);
    assert.equal(status, 200);
    assert.equal(queries.get('CustomerDepartmentKpi').periodKey, '2026-W37');
    assert.deepEqual(queries.get('CustomerDepartmentKpi').submittedAt, { $ne: null });
    assert.equal(response.metrics.find(row => row.department === 'Customer Success').gap, 20);
    assert.equal(response.metrics.some(row => /Revenue/.test(row.name)), false);
    assert.equal(response.metrics.find(row => row.department === 'IT').achievement, 25);
    assert.equal(response.metrics.find(row => row.department === 'Social Media').actual, 1);
    assert.equal(response.departments.find(row => row.name === 'Finance').count, 0);
    assert.equal(queries.get('HrKpi').periodKey, '2026-W37');
    assert.equal(queries.get('TessbinKpiReport').status, 'submitted');
    assert.equal(queries.get('TessbinKpiReport').periodStart, '2026-09-07');
    assert.equal(response.metrics.find(row => row.id === 'tessbin-evaluations').achievement, 80);
    assert.equal(response.metrics.find(row => row.id === 'tessbin-evaluations').source, 'Submitted Tessbin KPI report');
    assert.equal(queries.get('ITTask').date.$lt.toISOString(), '2026-09-14T00:00:00.000Z');
    await getDepartmentAnalytics({ query: { periodType: 'weekly', periodKey: 'bad' } }, res);
    assert.equal(status, 400);
  } finally {
    delete require.cache[controllerPath];
    for (const [path, original] of originals) {
      if (original) require.cache[path] = original;
      else delete require.cache[path];
    }
  }
});
