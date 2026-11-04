const assert = require('assert');
const CalledCall = require('../models/CalledCall');

// Test 1: Validation failure when required fields are missing
const invalidCall = new CalledCall({});
const validationError = invalidCall.validateSync();
assert.ok(validationError, 'Validation error must be raised when fields are missing');
assert.ok(validationError.errors.clientName, 'clientName should be required');
assert.ok(validationError.errors.phoneNumber, 'phoneNumber should be required');

// Test 2: Validation passes with required fields and defaults are applied
const validCall = new CalledCall({
  clientName: 'Abebe Kebede',
  phoneNumber: '+251911223344',
  createdBy: '507f1f77bcf86cd799439011',
});
const validErr = validCall.validateSync();
assert.ifError(validErr);
assert.strictEqual(validCall.clientName, 'Abebe Kebede');
assert.strictEqual(validCall.phoneNumber, '+251911223344');
assert.strictEqual(validCall.purpose, 'Cold Outreach');
assert.strictEqual(validCall.callStatus, 'Interested');
assert.strictEqual(validCall.priority, 'Warm');
assert.ok(validCall.callDate instanceof Date);

// Test 3: Custom purpose and different call statuses
const customCall = new CalledCall({
  customerName: 'Sara Haile',
  companyName: 'Tana Trading PLC',
  phoneNumber: '0912345678',
  email: 'sara@tanatrading.com',
  city: 'Addis Ababa',
  purpose: 'Course / Training Inquiry',
  productInterest: 'Import and Export Training',
  callResult: 'Callback Requested',
  followUpDate: new Date('2026-11-10'),
  salesAmount: 5000,
  priority: 'Hot',
  callDuration: '4 mins',
  notes: 'Client interested in upcoming weekend batch, requested callback on Friday.',
  createdBy: '507f1f77bcf86cd799439011',
  salesAgentName: 'Test Agent',
});
const customErr = customCall.validateSync();
assert.ifError(customErr);
assert.strictEqual(customCall.callResult, 'Callback Requested');
assert.strictEqual(customCall.salesAmount, 5000);
assert.strictEqual(customCall.customerName, 'Sara Haile');
assert.strictEqual(customCall.priority, 'Hot');
assert.strictEqual(customCall.callDuration, '4 mins');

console.log('calledCall: all checks passed');

