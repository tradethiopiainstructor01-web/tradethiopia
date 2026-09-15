const test = require('node:test');
const assert = require('node:assert/strict');
const { defaults, validateReport, resolvePeriod } = require('../utils/socialKpiReport');
const body = () => ({ periodType: 'weekly', periodKey: '2026-W37', metrics: defaults().map(row => ({ ...row, target: 20, actual: 25 })) });
test('supports report date range and calculates achievement without capping overperformance', () => {
  const report = validateReport(body());
  assert.equal(report.metrics.length, 22);
  assert.equal(report.metrics[0].achievement, 125);
  const input = body(); input.metrics[0].target = 0;
  assert.equal(validateReport(input).metrics[0].achievement, null);
});
test('rejects missing, duplicate, negative, fractional and nonnumeric metrics', () => {
  for (const value of [null, '', -1, 1.5, Infinity, '25']) {
    const input = body(); input.metrics[0].actual = value;
    assert.throws(() => validateReport(input));
  }
  const missing = body(); missing.metrics.pop(); assert.throws(() => validateReport(missing));
  const duplicate = body(); duplicate.metrics[1] = duplicate.metrics[0]; assert.throws(() => validateReport(duplicate));
});
test('rejects invalid periods and keeps canonical labels and computed percentages', () => {
  for (const periodKey of ['2026-W00', '2025-W53', '2026-W54', 'invalid', '2026-09-15']) assert.throws(() => validateReport({ ...body(), periodKey }));
  assert.throws(() => validateReport({ ...body(), periodType: 'daily' }));
  assert.throws(() => validateReport({ ...body(), periodType: undefined }));
  const input = body(); input.metrics[0].label = 'Changed'; input.metrics[0].achievement = 99;
  assert.equal(validateReport(input).metrics[0].label, 'Total posts');
  assert.equal(validateReport(input).metrics[0].achievement, 125);
});
test('resolves weekly, monthly, quarterly and yearly boundaries, including leap years and ISO year transitions', () => {
  for (const [type, key, start, end] of [
    ['weekly', '2026-W37', '2026-09-07', '2026-09-13'],
    ['weekly', '2026-W01', '2025-12-29', '2026-01-04'],
    ['weekly', '2026-W53', '2026-12-28', '2027-01-03'],
    ['monthly', '2024-02', '2024-02-01', '2024-02-29'],
    ['monthly', '2026-12', '2026-12-01', '2026-12-31'],
    ['quarterly', '2026-Q3', '2026-07-01', '2026-09-30'],
    ['quarterly', '2026-Q4', '2026-10-01', '2026-12-31'],
    ['yearly', '2026', '2026-01-01', '2026-12-31'],
  ]) {
    const result = validateReport({ ...body(), periodType: type, periodKey: key, startDate: 'untrusted', endDate: 'untrusted' });
    assert.equal(result.startDate, start);
    assert.equal(result.endDate, end);
    assert.equal(result.periodType, type);
    assert.equal(result.periodKey, key);
  }
  for (const [type, key] of [['monthly', '2026-13'], ['monthly', '2026-00'], ['quarterly', '2026-Q5'], ['quarterly', '2026-Q0'], ['yearly', 'invalid']]) assert.throws(() => resolvePeriod(type, key));
});
