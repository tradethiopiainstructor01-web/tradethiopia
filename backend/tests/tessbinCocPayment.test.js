const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
  const stored = { _id: 'student1', fullName: 'Original student', learningDepartment: 'Coffee Cupping', cocPaymentStatus: 'Unpaid', cocPaymentScreenshot: 'old-receipt', educationFile: 'existing-document' };
  const writes = [];
  const model = {
    findById: () => ({ lean: async () => stored }),
    findByIdAndUpdate: (id, update) => {
      writes.push(update);
      return { select: async () => ({ ...stored, ...update.$set }) };
    },
  };
  const context = { module: { exports: {} }, Buffer, console, require: (name) => name === '../models/StudentRegistration' ? model : {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controllers/studentRegistrationController.js'), 'utf8'), context);
  const call = async (handler, body, role = 'tessbinadmin') => {
    const result = { status: 200 };
    const response = { status(code) { result.status = code; return this; }, json(data) { result.body = data; } };
    await context.module.exports[handler]({ body, params: { id: stored._id }, user: { role, fullName: 'Tessbin staff', email: 'tessbin@example.com' } }, response);
    return result;
  };
  return { call, writes, stored };
}

test('Tessbin cannot edit other student fields or create, delete, or sync registrations', async () => {
  const { call, writes } = setup();
  for (const role of ['tessbinadmin', 'Tessbin Admin', 'tessbin', 'tessbin_admin']) {
    for (const field of ['fullName', 'classCompleted', 'paymentStatus', 'educationFile']) {
      const result = await call('updateStudentRegistration', { [field]: 'changed', cocPaymentStatus: 'Paid' }, role);
      assert.equal(result.status, 403);
    }
    for (const handler of ['createStudentRegistration', 'deleteStudentRegistration', 'handleSyncAllFollowupStudents']) {
      assert.equal((await call(handler, {}, role)).status, 403);
    }
  }
  assert.equal(writes.length, 0);
});

test('Tessbin updates only COC payment fields and can remove a receipt', async () => {
  const { call, writes, stored } = setup();
  const result = await call('updateStudentRegistration', { cocPaymentStatus: 'Paid', cocPaymentBank: 'CBE', cocPaymentScreenshot: '' });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.cocPaymentStatus, 'Paid');
  assert.equal(result.body.data.cocPaymentScreenshot, '');
  assert.equal(result.body.data.fullName, stored.fullName);
  assert.equal(result.body.data.educationFile, stored.educationFile);
  assert.deepEqual(Object.keys(writes[0].$set).sort(), ['cocPaymentBank', 'cocPaymentScreenshot', 'cocPaymentStatus', 'updatedBy', 'updatedByEmail'].sort());
});

test('COC endpoint validates values, course eligibility, and access', async () => {
  const { call, writes, stored } = setup();
  for (const body of [{ cocPaymentStatus: 'Invalid' }, { cocPaymentBank: {} }, { cocPaymentScreenshot: 'not an image' }]) {
    assert.equal((await call('updateStudentCocPayment', body)).status, 400);
  }
  assert.equal((await call('updateStudentCocPayment', { cocPaymentStatus: 'Paid' }, 'unrelated-user')).status, 403);
  stored.learningDepartment = 'Barista';
  const baristaResult = await call('updateStudentCocPayment', { cocPaymentStatus: 'Paid' });
  assert.equal(baristaResult.status, 200);
  assert.equal(baristaResult.body.data.cocPaymentStatus, 'Paid');
  assert.equal(writes.length, 1);
});

test('Tessbin can mark COC completion and undo it without changing other fields', async () => {
  const { call, writes } = setup();
  for (const completed of [true, false]) {
    const result = await call('updateStudentCocCompletion', { classCompleted: completed });
    assert.equal(result.status, 200);
    assert.equal(result.body.data.classCompleted, completed);
    assert.equal(result.body.data.classCompletionStatus, completed ? 'Completed' : 'Not Completed');
  }
  for (const update of writes) {
    assert.deepEqual(Object.keys(update.$set).sort(), ['classCompleted', 'classCompletionStatus', 'updatedBy', 'updatedByEmail'].sort());
  }
});

test('completion endpoint rejects invalid values, extra fields, unrelated users and courses', async () => {
  const { call, writes, stored } = setup();
  for (const value of ['true', null, 1, undefined]) {
    assert.equal((await call('updateStudentCocCompletion', { classCompleted: value })).status, 400);
  }
  assert.equal((await call('updateStudentCocCompletion', { classCompleted: true, fullName: 'Changed' })).status, 403);
  assert.equal((await call('updateStudentCocCompletion', { classCompleted: true }, 'unrelated-user')).status, 403);
  stored.learningDepartment = 'Barista';
  const baristaCompletion = await call('updateStudentCocCompletion', { classCompleted: true });
  assert.equal(baristaCompletion.status, 200);
  assert.equal(baristaCompletion.body.data.classCompleted, true);
});
