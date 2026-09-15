const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const helpers = require('../utils/tessbinKpiReport');

test('submission choices list named months and quarters and identify the current period', async () => {
  const { reportingPeriodOptions } = await import('../../frontend/src/utils/tessbinReportingPeriods.js');
  const months = reportingPeriodOptions('monthly', 2026, '2026-09-14');
  assert.equal(months.length, 12);
  assert.equal(months[5].label, 'June');
  assert.equal(months[7].label, 'August');
  assert.equal(months[8].label, 'September (This month)');
  const quarters = reportingPeriodOptions('quarterly', 2026, '2026-09-14');
  assert.equal(quarters.length, 4);
  assert.equal(quarters[2].value, '2026-07-01');
  assert.match(quarters[2].label, /Q3.*July.*September.*This quarter/);
});

test('weekly submission choices match backend periods including weeks spanning calendar years', async () => {
  const { reportingPeriodOptions, reportingPeriodStart } = await import('../../frontend/src/utils/tessbinReportingPeriods.js');
  for (const year of [2024, 2025, 2026, 2027]) {
    const weeks = reportingPeriodOptions('weekly', year, `${year}-01-01`);
    assert.equal(weeks[0].value, `${year}-01-01`);
    assert.match(weeks[0].label, /This week/);
    assert.equal(new Set(weeks.map((week) => week.start)).size, weeks.length);
    for (const week of weeks) {
      assert.equal(week.start, helpers.periodFor('weekly', week.value).periodStart);
      assert.equal(week.start, reportingPeriodStart('weekly', week.value));
    }
  }
  const current = reportingPeriodOptions('weekly', 2026, '2026-09-14').find((week) => week.label.startsWith('This week'));
  assert.equal(current.value, '2026-09-14');
  assert.match(current.label, /20 Sept 2026/);
});

const body = (changes = {}) => ({
  timeframe: 'monthly', date: '2026-09-14', revision: 0, status: 'submitted', notes: 'Period results',
  metrics: helpers.METRICS.map(({ key }) => ({ key, target: 10, actual: 0 })), ...changes,
});

test('report periods use Monday weeks and calendar months/quarters across year boundaries', () => {
  assert.deepEqual(helpers.periodFor('weekly', '2026-01-04'), { timeframe: 'weekly', periodStart: '2025-12-29', periodEnd: '2026-01-04' });
  assert.equal(helpers.periodFor('weekly', '2026-01-05').periodStart, '2026-01-05');
  assert.equal(helpers.periodFor('monthly', '2024-02-14').periodEnd, '2024-02-29');
  assert.deepEqual(helpers.periodFor('quarterly', '2026-12-31'), { timeframe: 'quarterly', periodStart: '2026-10-01', periodEnd: '2026-12-31' });
  for (const date of ['2026-02-30', 'invalid', '', '2026-13-01']) assert.throws(() => helpers.periodFor('monthly', date));
  assert.throws(() => helpers.periodFor('yearly', '2026-09-14'));
});

test('drafts allow missing results; submissions require positive targets and explicit actuals including zero', () => {
  assert.equal(helpers.validateReport(body()).metrics[0].actual, 0);
  const emptyMetrics = helpers.METRICS.map(({ key }) => ({ key, target: null, actual: null }));
  assert.doesNotThrow(() => helpers.validateReport(body({ status: 'draft', metrics: emptyMetrics })));
  assert.throws(() => helpers.validateReport(body({ metrics: emptyMetrics })));
  for (const value of [-1, 1.5, '10', Infinity, NaN, false]) {
    const payload = body(); payload.metrics[0].actual = value;
    assert.throws(() => helpers.validateReport(payload));
  }
  const zeroTarget = body(); zeroTarget.metrics[0].target = 0;
  assert.throws(() => helpers.validateReport(zeroTarget));
  const duplicates = body(); duplicates.metrics[1].key = 'coc';
  assert.throws(() => helpers.validateReport(duplicates));
  assert.throws(() => helpers.validateReport(body({ notes: 'a'.repeat(3001) })));
});

function setup() {
  const stored = new Map();
  const model = {
    countDocuments: async () => 7,
    findOne(query) { return { lean: async () => stored.get(`${query.timeframe}:${query.periodStart}`) || null }; },
    find(query) { return { sort: () => ({ limit: () => ({ lean: async () => [...stored.values()].filter((item) => item.timeframe === query.timeframe) }) }) }; },
    async findOneAndUpdate(query, update, options) {
      const key = `${query.timeframe}:${query.periodStart}`;
      const current = stored.get(key);
      if (current && current.revision !== query.revision) {
        if (options.upsert) throw Object.assign(new Error('duplicate'), { code: 11000 });
        return null;
      }
      if (!current && !options.upsert) return null;
      const result = { ...update.$set, _id: key, revision: (current?.revision || 0) + update.$inc.revision };
      stored.set(key, result);
      return result;
    },
  };
  const notifications = [];
  const context = { exports: {}, console, require: (name) => name.includes('/models/') ? model : name.endsWith('/kpiSubmissionNotificationService') ? { periodKeyFor: require('../services/kpiSubmissionNotificationService').periodKeyFor, notifyKpiSubmission: async (_req, event) => notifications.push(event) } : name.endsWith('/departmentKpiAnalytics') ? require('../utils/departmentKpiAnalytics') : helpers };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controllers/tessbinKpiReportController.js'), 'utf8'), context);
  const call = async (handler, input = {}) => {
    const result = { status: 200 };
    const res = { status(code) { result.status = code; return this; }, json(data) { result.body = data; return this; } };
    await context.exports[handler]({ user: { _id: 'staff', role: 'tessbinadmin' }, ...input }, res, () => { result.allowed = true; });
    return result;
  };
  return { call, stored, notifications };
}

test('Tessbin notifies only accepted submissions with the exact reporting period', async () => {
  const { call, notifications } = setup();
  await call('save', { body: body({ status: 'draft' }) });
  assert.equal(notifications.length, 0);
  await call('save', { body: body({ revision: 1 }) });
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].departmentId, 'tessbin');
  assert.equal(notifications[0].periodKey, '2026-09');
  await call('save', { body: body({ revision: 1 }) });
  assert.equal(notifications.length, 1);
});

test('saving and revising one period preserves other periods and rejects stale concurrent writes', async () => {
  const { call, stored } = setup();
  assert.equal((await call('save', { body: body() })).status, 200);
  assert.equal((await call('save', { body: body() })).status, 409);
  const updated = (await call('save', { body: body({ revision: 1, notes: 'Rev 1' }) })).body.data;
  assert.equal(updated.revision, 2);
  assert.equal(stored.get('monthly:2026-09-01').notes, 'Rev 1');
});

test('invalid requests are rejected before saving and access is role restricted', async () => {
  const { call } = setup();
  assert.equal((await call('save', { body: { timeframe: 'invalid' } })).status, 400);
  assert.equal((await call('get', { query: { timeframe: 'monthly', date: 'bad' } })).status, 400);
  assert.equal((await call('getSubmitted', { query: { periodType: 'invalid' } })).status, 400);
  const res = { status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  let allowed = false;
  const { authorize } = require('../controllers/tessbinKpiReportController');
  authorize({ user: { role: 'guest' } }, res, () => { allowed = true; });
  assert.equal(res.code, 403);
  assert.equal(allowed, false);
});

test('evaluations submitted is saved as a fourth KPI for every reporting frequency', async () => {
  const { call, stored } = setup();
  for (const timeframe of ['weekly', 'monthly', 'quarterly']) {
    const payload = body({ timeframe, date: '2026-09-14' });
    const response = await call('save', { body: payload });
    assert.equal(response.status, 200);
    const saved = stored.get(`${timeframe}:${helpers.periodFor(timeframe, '2026-09-14').periodStart}`);
    assert.equal(saved.metrics.length, 4);
    assert.equal(saved.metrics.find((row) => row.key === 'evaluations').actual, 0);
  }
});

test('existing three-metric reports load with a blank evaluations row without changing stored results', async () => {
  const { call, stored } = setup();
  const legacy = { timeframe: 'monthly', periodStart: '2026-09-01', status: 'submitted', revision: 1,
    metrics: body().metrics.filter((row) => row.key !== 'evaluations') };
  stored.set('monthly:2026-09-01', legacy);
  const loaded = await call('get', { query: { timeframe: 'monthly', date: '2026-09-14' } });
  assert.deepEqual({ ...loaded.body.data.report.metrics.find((row) => row.key === 'evaluations') }, { key: 'evaluations', target: null, actual: null });
  assert.equal(loaded.body.data.report.metrics[0].target, 10);
  assert.equal(loaded.body.data.history[0].metrics.length, 4);
  assert.equal(legacy.metrics.length, 3);
});

test('getLiveCounts returns auto-aggregated counts for chosen period', async () => {
  const { call } = setup();
  const res = await call('getLiveCounts', { query: { timeframe: 'monthly', date: '2026-09-14' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.timeframe, 'monthly');
  assert.equal(res.body.data.periodStart, '2026-09-01');
  assert.equal(res.body.data.periodEnd, '2026-09-30');
  assert.equal(res.body.data.counts.coc, 7);
  assert.equal(res.body.data.counts.online, 7);
  assert.equal(res.body.data.counts.students, 7);
  assert.equal(res.body.data.counts.evaluations, 7);
});

test('COO sees only submitted Tessbin reports for the selected period, including late submissions', async () => {
  const { call } = setup();
  for (const [timeframe, date, periodKey] of [
    ['weekly', '2026-01-01', '2026-W01'],
    ['monthly', '2026-09-14', '2026-09'],
    ['quarterly', '2026-09-14', '2026-Q3'],
  ]) {
    const payload = body({ timeframe, date, status: 'draft' });
    await call('save', { body: payload });
    const query = { periodType: timeframe, periodKey };
    assert.equal((await call('getSubmitted', { query })).body.report, null);
    await call('save', { body: { ...payload, status: 'submitted', revision: 1 } });
    const response = await call('getSubmitted', { query });
    assert.equal(response.status, 200);
    assert.equal(response.body.report.status, 'submitted');
    assert.equal(response.body.metrics.length, 4);
    assert.equal(response.body.metrics.find((row) => row.id === 'tessbin-evaluations').actual, 0);
    assert.equal(response.body.metrics[0].target, 10);
    await call('save', { body: { ...payload, revision: 2 } });
    assert.equal((await call('getSubmitted', { query })).body.report, null);
  }
  assert.equal((await call('getSubmitted', { query: { periodType: 'monthly', periodKey: '2027-06' } })).body.report, null);
  assert.equal((await call('getSubmitted', { query: { periodType: 'monthly', periodKey: 'bad' } })).status, 400);
});
