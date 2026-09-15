const test = require('node:test');
const assert = require('node:assert/strict');
const { defaults, validateReport } = require('../utils/customerDepartmentKpi');
const body = () => ({ periodType: 'monthly', periodKey: '2026-09', metrics: defaults().map((row) => ({ ...row, actual: 0 })) });
test('sheet has 12 B2B and 8 Training metrics with exact targets and unreported actuals', () => {
  const rows = defaults();
  assert.equal(rows.filter((row) => row.section === 'B2B').length, 12);
  assert.equal(rows.filter((row) => row.section === 'Training').length, 8);
  assert.deepEqual(rows.map((row) => row.target), [120, 90, 2, 40, 30, 2, 5, 180, 200, 10, 15, 15, 60, 15, 15, 60, 60, 60, 60, 60]);
  assert.ok(rows.every((row) => row.actual === null));
});
test('zero achieved is valid, blank, negative, fractional and nonfinite results are rejected', () => {
  assert.equal(validateReport(body()).metrics[0].actual, 0);
  for (const actual of [null, '', -1, 1.5, Infinity, '5']) {
    const report = body(); report.metrics[0].actual = actual;
    assert.throws(() => validateReport(report));
  }
});
test('rejects incomplete, duplicate metrics and invalid periods; ignores client labels', () => {
  const incomplete = body(); incomplete.metrics.pop();
  assert.throws(() => validateReport(incomplete));
  const duplicate = body(); duplicate.metrics[1] = duplicate.metrics[0];
  assert.throws(() => validateReport(duplicate));
  assert.throws(() => validateReport({ ...body(), periodKey: '2026-13' }));
  const renamed = body(); renamed.metrics[0].kpi = 'Untrusted label';
  assert.equal(validateReport(renamed).metrics[0].kpi, 'Emails sent');
  assert.equal(validateReport({ ...body(), periodType: 'weekly', periodKey: '2026-W38' }).periodKey, '2026-W38');
  assert.equal(validateReport({ ...body(), periodType: 'quarterly', periodKey: '2026-Q3' }).periodKey, '2026-Q3');
});
test('submission persists period and authenticated author, and reads return saved results', async () => {
  const Model = require('../models/CustomerDepartmentKpi');
  const controller = require('../controllers/customerDepartmentKpiController');
  const originalSave = Model.findOneAndUpdate;
  const originalFind = Model.findOne;
  const User = require('../models/user.model');
  const originalUsers = User.find;
  User.find = () => ({ select: async () => [] });
  let saved;
  Model.findOneAndUpdate = async (query, update, options) => {
    assert.deepEqual(query, { periodType: 'monthly', periodKey: '2026-09' });
    assert.equal(options.upsert, true);
    saved = update.$set; return saved;
  };
  Model.findOne = () => ({ lean: async () => saved });
  let result;
  const res = { json: (value) => { result = value; }, status: () => res };
  try {
    await controller.submitReport({ body: body(), user: { _id: 'author', fullName: 'Customer Service' } }, res);
    assert.equal(result.data.submittedBy, 'author');
    assert.ok(result.data.submittedAt instanceof Date);
    await controller.getReport({ query: { periodType: 'monthly', periodKey: '2026-09' } }, res);
    assert.equal(result.data.metrics.length, 20);
    assert.equal(result.data.metrics[0].actual, 0);
  } finally { Model.findOneAndUpdate = originalSave; Model.findOne = originalFind; User.find = originalUsers; }
});
