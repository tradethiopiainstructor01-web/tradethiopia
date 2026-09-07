const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(sales, students = [], followups = [], repair = async () => {}) {
  const synced = [];
  let reads = 0;
  const query = (rows) => ({ select: () => ({ lean: async () => rows }) });
  const dependencies = {
    '../models/SalesCustomer': { find: (filter) => {
      reads++;
      return { select: (fields) => {
        assert.equal(fields, '_id studentRegistrationId');
        return { lean: async () => sales.filter((sale) => filter.followupStatus.test(sale.followupStatus)) };
      } };
    }, findById: async (id) => sales.find((sale) => sale._id === id) },
    '../models/StudentRegistration': { find: () => query(students) },
    '../models/TrainingFollowup': { find: () => query(followups) },
    '../controllers/salesCustomerController': {
      syncSalesCustomerToStudentRegistration: async (sale) => { synced.push(sale._id); await repair(); },
    },
  };
  const warnings = [];
  const context = { setImmediate, console: { warn: (...args) => warnings.push(args) }, module: { exports: {} }, require: (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../services/completedSalesSync.js'), 'utf8'), context);
  return { sync: context.module.exports.ensureCompletedSalesSynced,
    schedule: context.module.exports.scheduleCompletedSalesSync, synced, warnings, reads: () => reads };
}

test('repairs completed sales missing either destination and preserves existing training', async () => {
  const fixture = setup([
    { _id: 'new', followupStatus: 'Completed' },
    { _id: 'missing-training', followupStatus: 'completed', studentRegistrationId: 's1' },
    { _id: 'synced', followupStatus: 'Completed', studentRegistrationId: 's2' },
    { _id: 'pending', followupStatus: 'Pending' },
  ], [{ _id: 's1', studentId: 'ST-1' }, { _id: 's2', studentId: 'ST-2' }], [{ idInfo: 'ST-2' }]);
  await fixture.sync();
  assert.deepEqual(fixture.synced, ['new', 'missing-training']);
});

test('concurrent destination requests share a sync and later requests check again', async () => {
  const fixture = setup([]);
  await Promise.all([fixture.sync(), fixture.sync()]);
  assert.equal(fixture.reads(), 1);
  await fixture.sync();
  assert.equal(fixture.reads(), 2);
});

test('repairs completed sales that incorrectly share one student registration', async () => {
  const fixture = setup([
    { _id: 'test1', followupStatus: 'Completed', studentRegistrationId: 'shared' },
    { _id: 'test3', followupStatus: 'Completed', studentRegistrationId: 'shared' },
  ], [{ _id: 'shared', studentId: 'ST-1' }], [{ idInfo: 'ST-1' }]);
  await fixture.sync();
  assert.deepEqual(fixture.synced, ['test1', 'test3']);
});

test('background scheduling returns immediately while repair is pending and coalesces readers', async () => {
  let finishRepair;
  const repair = new Promise((resolve) => { finishRepair = resolve; });
  const fixture = setup([{ _id: 'old', followupStatus: 'Completed' }], [], [], () => repair);
  assert.equal(fixture.schedule(), undefined);
  fixture.schedule();
  assert.equal(fixture.reads(), 0);
  await new Promise(setImmediate);
  assert.deepEqual(fixture.synced, ['old']);
  fixture.schedule();
  assert.equal(fixture.reads(), 1);
  finishRepair();
  await new Promise(setImmediate);
  fixture.schedule();
  await new Promise(setImmediate);
  assert.equal(fixture.reads(), 1, 'refreshes during cooldown do not repeat the scan');
});

test('background failures are handled without rejecting a list request', async () => {
  const fixture = setup([{ _id: 'old', followupStatus: 'Completed' }], [], [], async () => {
    throw new Error('Repair unavailable');
  });
  assert.equal(fixture.schedule(), undefined);
  await new Promise(setImmediate);
  await new Promise(setImmediate);
  assert.equal(fixture.warnings.length, 1);
});
