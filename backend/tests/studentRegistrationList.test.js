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
  for (const field of ['passportPhoto', 'nationalIdImage', 'nationalIdFrontImage', 'nationalIdBackImage', 'paymentScreenshot', 'cocPaymentScreenshot', 'educationFile']) {
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

const controllerSource = fs.readFileSync(path.join(__dirname, '../controllers/studentRegistrationController.js'), 'utf8');

test('cursor batches bound database work and preserve filters across pages', async () => {
  let pipeline;
  const ids = ['000000000000000000000003', '000000000000000000000002', '000000000000000000000001'];
  const context = { module: { exports: {} }, console, require: (name) => {
    if (name === 'mongoose') return { Types: { ObjectId: function (id) { this.value = id; } } };
    if (name === '../models/StudentRegistration') return { aggregate: async (stages) => {
      pipeline = stages;
      return ids.map((_id) => ({ _id, fullName: 'Student' }));
    } };
    if (name === '../utils/studentListProjection') return projection;
    return {};
  } };
  vm.runInNewContext(controllerSource, context);
  let body;
  let status = 200;
  const res = { json: (value) => { body = value; }, status: (value) => { status = value; return res; } };
  const query = { batchSize: '2', autoSync: 'false', department: 'Barista', cursor: ids[0] };
  await context.module.exports.getStudentRegistrations({ query, user: { role: 'tessbinadmin' } }, res);
  assert.equal(status, 200);
  assert.equal(body.data.length, 2);
  assert.equal(body.nextCursor, ids[1]);
  assert.equal(pipeline[0].$match.learningDepartment, 'Barista');
  assert.equal(pipeline[0].$match.$and[0]._id.$lt.value, ids[0]);
  assert.equal(pipeline[1].$sort._id, -1);
  assert.equal(pipeline[2].$limit, 3);
  assert.ok(pipeline.findIndex((stage) => stage.$project) > 2);
  await context.module.exports.getStudentRegistrations({ query: { ...query, batchSize: '3' }, user: {} }, res);
  assert.equal(body.nextCursor, null);
  for (const invalid of [{ batchSize: '201' }, { batchSize: '0' }, { cursor: 'invalid' }]) {
    await context.module.exports.getStudentRegistrations({ query: { ...query, ...invalid }, user: {} }, res);
    assert.equal(status, 400);
  }
});

const validationContext = { Buffer };
vm.runInNewContext(controllerSource.slice(controllerSource.indexOf('const isValidEducationFile ='), controllerSource.indexOf('const buildPayload =')) + ';globalThis.validate = isValidEducationFile;', validationContext);
const validateEducation = validationContext.validate;
const documentBody = (name, type, bytes) => ({ educationFileName: name, educationFile: 'data:' + type + ';base64,' + bytes.toString('base64') });

test('education upload accepts PDF and both Word formats and supports omission/removal', () => {
  assert.equal(validateEducation({}), true);
  assert.equal(validateEducation({ educationFile: '', educationFileName: '' }), true);
  assert.equal(validateEducation(documentBody('Education.PDF', 'application/pdf', Buffer.from('%PDF-1.7'))), true);
  assert.equal(validateEducation(documentBody('Education.doc', 'application/msword', Buffer.from('d0cf11e0a1b11ae1', 'hex'))), true);
  assert.equal(validateEducation(documentBody('Education.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', Buffer.from('504b0304', 'hex'))), true);
});

test('education upload rejects unsupported, mismatched, malformed and oversized files', () => {
  assert.equal(validateEducation({ educationFile: [] }), false);
  assert.equal(validateEducation(documentBody('image.png', 'image/png', Buffer.from('image'))), false);
  assert.equal(validateEducation(documentBody('fake.pdf', 'application/pdf', Buffer.from('not a PDF'))), false);
  assert.equal(validateEducation(documentBody('file.doc', 'application/pdf', Buffer.from('%PDF-1.7'))), false);
  assert.equal(validateEducation({ educationFileName: 'file.pdf', educationFile: 'data:application/pdf;base64,%%%%' }), false);
  assert.equal(validateEducation(documentBody('large.pdf', 'application/pdf', Buffer.alloc(5 * 1024 * 1024 + 1))), false);
});

test('list-based updates preserve education files and explicit removal clears them', () => {
  const context = { module: { exports: {} }, Buffer, console, require: () => ({}) };
  vm.runInNewContext(controllerSource + ';globalThis.helpers = { buildPayload, normalizeStudent };', context);
  const { buildPayload, normalizeStudent } = context.helpers;
  const stored = { _id: 's1', fullName: 'Student', learningDepartment: 'Barista',
    ...documentBody('Education.pdf', 'application/pdf', Buffer.from('%PDF-1.7')) };
  const listed = normalizeStudent(stored);
  assert.equal(listed.hasEducationFile, true);
  assert.equal(Object.hasOwn(listed, 'educationFile'), false);
  const updated = buildPayload({ ...stored, ...listed, classCompleted: true });
  assert.equal(updated.educationFile, stored.educationFile);
  assert.equal(updated.educationFileName, stored.educationFileName);
  assert.equal(normalizeStudent(stored, true).educationFile, stored.educationFile);
  const removed = buildPayload({ ...stored, educationFile: '', educationFileName: '' });
  assert.equal(removed.educationFile, '');
  assert.equal(removed.educationFileName, '');
});
