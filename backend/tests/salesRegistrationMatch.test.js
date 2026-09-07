const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(students, sales) {
  const dependencies = {
    '../models/SalesCustomer': { exists: async (query) => sales.some((sale) =>
      sale._id !== query._id.$ne && sale.studentRegistrationId === query.studentRegistrationId) },
    '../models/StudentRegistration': {
      findById: async (id) => students.find((student) => student._id === id),
      findOne: async (query) => students.find((student) => Object.entries(query).every(([key, value]) =>
        typeof value.test === 'function' ? value.test(student[key] || '') : student[key] === value)),
    },
  };
  const context = { module: { exports: {} }, require: (name) => dependencies[name] };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../services/salesRegistrationMatch.js'), 'utf8'), context);
  return context.module.exports.findSalesRegistration;
}

test('test1 and test3 sharing email and phone keep separate registrations', async () => {
  const students = [{ _id: 'r1', fullName: 'test1', learningDepartment: 'Logistic', email: 'shared@example.com' }];
  const sales = [{ _id: 's1', studentRegistrationId: 'r1' }];
  const match = setup(students, sales);
  assert.equal(await match({ _id: 's3', customerName: 'test3', courseName: 'digital marketing', email: 'shared@example.com' }), null);
  assert.equal(await match({ _id: 's1', studentRegistrationId: 'r1' }), students[0]);
});

test('historical shared links are split instead of overwriting another sale', async () => {
  const student = { _id: 'shared', fullName: 'test3', learningDepartment: 'digital marketing', email: 'shared@example.com' };
  const match = setup([student], [{ _id: 's1', studentRegistrationId: 'shared' }, { _id: 's3', studentRegistrationId: 'shared' }]);
  assert.equal(await match({ _id: 's1', studentRegistrationId: 'shared', customerName: 'test1', courseName: 'Logistic', email: 'shared@example.com' }), null);
});

test('an unclaimed registration matches by name, course and contact', async () => {
  const student = { _id: 'r1', fullName: 'Test1', learningDepartment: 'Logistic', email: 'shared@example.com' };
  assert.equal(await setup([student], [])({ _id: 's1', customerName: 'test1', courseName: 'Logistic', email: 'shared@example.com' }), student);
});
