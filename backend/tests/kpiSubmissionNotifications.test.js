const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function service({ failInsert = false, failSocket = false } = {}) {
  let query;
  const saved = [];
  const emitted = [];
  const context = { module: { exports: {} }, console: { error() {} }, require: (name) => name.endsWith('/Notification') ? {
    insertMany: async (docs) => { if (failInsert) throw new Error('Database unavailable'); saved.push(...docs); return docs.map((doc, index) => ({ ...doc, _id: `notification-${index}` })); },
  } : { find: (filter) => { query = filter; return { select: async () => [{ _id: 'online' }, { _id: 'offline' }] }; } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../services/kpiSubmissionNotificationService.js'), 'utf8'), context);
  const io = { to: () => ({ emit: (...args) => { if (failSocket) throw new Error('Socket disconnected'); emitted.push(args); } }) };
  const req = { user: { fullName: 'Department Manager' }, app: { get: (name) => name === 'connectedUsers' ? new Map([['online', 'socket']]) : io } };
  return { ...context.module.exports, req, saved, emitted, getQuery: () => query };
}

test('all departments persist offline alerts with matching department, period and report links', async () => {
  const s = service();
  for (const departmentId of Object.keys(s.DEPARTMENTS)) {
    const docs = await s.notifyKpiSubmission(s.req, { departmentId, periodType: 'monthly', periodKey: '2026-09', reportId: 'report' });
    assert.equal(docs.length, 2);
    assert.equal(docs[1].user, 'offline');
    assert.equal(docs[0].metadata.departmentId, departmentId);
    assert.equal(docs[0].metadata.reportId, 'report');
    assert.equal(docs[0].metadata.submittedByName, 'Department Manager');
    assert.equal(docs[0].link, `/coo2?dept=${departmentId}&periodType=monthly&periodKey=2026-09`);
    assert.equal(s.emitted.at(-1)[0], 'newNotification');
    assert.ok(s.emitted.at(-1)[1]._id);
  }
  for (const role of ['COO', 'coo2', 'COO 2', 'coo_2', '2coo', '2 COO', 'CEO', 'admin']) assert.ok(s.getQuery().role.$regex.test(role), role);
  assert.equal(s.getQuery().role.$regex.test('customerservice'), false);
});

test('database failures are surfaced; socket failures preserve persisted alerts', async () => {
  const failure = service({ failInsert: true });
  await assert.rejects(() => failure.notifyKpiSubmission(failure.req, { departmentId: 'hr', periodType: 'monthly', periodKey: '2026-09' }), /Database unavailable/);
  assert.equal(failure.emitted.length, 0);
  const offline = service({ failSocket: true });
  assert.equal((await offline.notifyKpiSubmission(offline.req, { departmentId: 'hr', periodType: 'monthly', periodKey: '2026-09' })).length, 2);
});

test('notification periods handle ISO week years and quarters', () => {
  const { periodKeyFor } = service();
  assert.equal(periodKeyFor('weekly', '2025-12-29'), '2026-W01');
  assert.equal(periodKeyFor('quarterly', '2026-09-15'), '2026-Q3');
  assert.equal(periodKeyFor('monthly', '2026-09-15'), '2026-09');
});

test('notification reads and read actions remain scoped to the current recipient', async () => {
  let query;
  const model = { find: (filter) => { query = filter; return { sort: async () => [] }; }, findOneAndUpdate: async (filter) => { query = filter; return { read: true }; }, updateMany: async (filter) => { query = filter; } };
  const context = { module: { exports: {} }, console, require: (name) => name.includes('Notification') ? model : {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controllers/notificationController.js'), 'utf8'), context);
  const controller = context.module.exports;
  const res = { json() {}, status() { return this; } };
  await controller.getNotifications({ query: { includeRead: 'true' }, user: { _id: 'coo2' } }, res);
  assert.equal(query.user, 'coo2');
  assert.equal(query.$or, undefined);
  await controller.getNotifications({ query: {}, user: { _id: 'coo2' } }, res);
  assert.equal(query.$or[0].read, false);
  await controller.markAsRead({ params: { id: 'alert' }, user: { _id: 'coo2' } }, res);
  assert.equal(query.user, 'coo2');
  assert.equal(query._id, 'alert');
  await controller.markAllAsRead({ user: { _id: 'coo2' } }, res);
  assert.equal(query.user, 'coo2');
  assert.equal(query.read, false);
});
