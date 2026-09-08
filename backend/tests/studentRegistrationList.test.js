const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const projection = require('../utils/studentListProjection');

test('student list returns existing students without awaiting historical repairs', async () => {
  let scheduled = 0;
  let pipeline;
  const dependencies = {
    mongoose: {}, crypto: {},
    '../models/StudentRegistration': { aggregate: async (stages) => {
      pipeline = stages;
      return [{ _id: 's1', fullName: 'Student', hasPassportPhoto: true }];
    } },
    '../models/TrainingFollowup': {}, '../models/SalesCustomer': {},
    '../services/completedSalesSync': {
      scheduleCompletedSalesSync: () => { scheduled++; },
      ensureCompletedSalesSynced: () => { throw new Error('List must not await repair'); },
    },
    '../utils/studentListProjection': projection,
  };
  const context = { module: { exports: {} }, console, require: (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../controllers/studentRegistrationController.js'), 'utf8'), context);
  let response;
  let afterResponse;
  const res = { once: (event, callback) => { assert.equal(event, 'finish'); afterResponse = callback; }, json: (body) => { response = body; }, status: (status) => {
    assert.fail(`Unexpected HTTP ${status}`);
  } };
  await context.module.exports.getStudentRegistrations({ query: {}, user: { role: 'customerservice' } }, res);
  assert.equal(scheduled, 0, 'normal reads must not start repair scans');
  assert.equal(typeof afterResponse, 'function');
  assert.equal(response.success, true);
  assert.equal(response.data[0].fullName, 'Student');
  assert.equal(response.data[0].hasPassportPhoto, true);
  assert.equal(response.data[0].passportPhoto, '');
  for (const field of ['passportPhoto', 'nationalIdImage', 'nationalIdFrontImage', 'nationalIdBackImage', 'paymentScreenshot', 'cocPaymentScreenshot']) {
    const projectIndex = pipeline.findIndex((stage) => stage.$project);
    const sortIndex = pipeline.findIndex((stage) => stage.$sort);
    assert.ok(projectIndex < sortIndex, 'strip large attachments before sorting');
    assert.equal(pipeline[projectIndex].$project[field], 0);
  }
  await context.module.exports.getStudentRegistrations({ query: { autoSync: 'false' }, user: { role: 'customerservice' } }, res);
  assert.equal(scheduled, 0, 'explicitly disabled sync stays disabled');
  afterResponse();
  assert.equal(scheduled, 1, 'repair scans start only after the response finishes');
});
