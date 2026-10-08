// Behaviour test for the sales activity log: change detection and read-only entries.
// Runs without a database (model hooks are called directly).
const assert = require('assert');
const { diffSales } = require('../utils/salesActivity');
const SalesActivityLog = require('../models/SalesActivityLog');

const SLIP = 'data:image/png;base64,AAAA';
const OTHER_SLIP = 'data:image/png;base64,BBBB';
const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg>Followup Verified Receipt</svg>';

// Status change to Completed
let diff = diffSales({ followupStatus: 'Pending' }, { followupStatus: 'Completed' });
assert.deepStrictEqual(diff.types.sort(), ['completed', 'status_changed']);
assert.strictEqual(diff.changes[0].from, 'Pending');
assert.strictEqual(diff.changes[0].to, 'Completed');

// Payment slip added, replaced, removed
assert.deepStrictEqual(diffSales({ paymentScreenshot: '' }, { paymentScreenshot: SLIP }).types, ['payment_slip_added']);
assert.deepStrictEqual(diffSales({ paymentScreenshot: SLIP }, { paymentScreenshot: OTHER_SLIP }).types, ['payment_slip_replaced']);
assert.deepStrictEqual(diffSales({ paymentScreenshot: SLIP }, { paymentScreenshot: '' }).types, ['payment_slip_removed']);
// A placeholder is not a slip: replacing it with a real one is "added"
assert.deepStrictEqual(diffSales({ paymentScreenshot: PLACEHOLDER }, { paymentScreenshot: SLIP }).types, ['payment_slip_added']);
// Unchanged image and list-row marker are not changes
assert.deepStrictEqual(diffSales({ paymentScreenshot: SLIP }, { paymentScreenshot: SLIP }).changes, []);
assert.deepStrictEqual(diffSales({ paymentScreenshot: SLIP }, { paymentScreenshot: '__stored_document__' }).changes, []);
// Images never appear in the log, only Uploaded / Removed / Replaced
diff = diffSales({ paymentScreenshot: '' }, { paymentScreenshot: SLIP });
assert.ok(!JSON.stringify(diff.changes).includes('base64'), 'image data must not be logged');

// Reassignment, price and note tags
assert.deepStrictEqual(diffSales({ agentId: 'a' }, { agentId: 'b' }).types, ['reassigned']);
assert.deepStrictEqual(diffSales({ coursePrice: 100 }, { coursePrice: 200 }).types, ['price_changed']);
assert.deepStrictEqual(diffSales({ note: 'x' }, { note: 'y' }).types, ['note_changed']);
// Values-only comparison ignores documents
assert.deepStrictEqual(diffSales({ paymentScreenshot: '' }, { paymentScreenshot: SLIP }, { documents: false }).changes, []);
// Nothing changed
assert.deepStrictEqual(diffSales({ phone: '1' }, { phone: '1' }).changes, []);

// Read-only: every update and delete path is refused
const OWN_HOOKS = new Set(['refuseChange', 'refuseResave']);
const presFor = (name) => (SalesActivityLog.schema.s.hooks._pres.get(name) || [])
  .map((hook) => hook.fn)
  .filter((fn) => OWN_HOOKS.has(fn.name));
const refuses = (name) => presFor(name).some((fn) => {
  let error = null;
  fn.call({ isNew: false }, (err) => { error = err; });
  return error && /read-only/.test(error.message);
});
['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'save']
  .forEach((name) => assert.ok(refuses(name), `${name} must be refused`));
// New entries can still be saved
const saveHooks = presFor('save').filter((fn) => fn.name === 'refuseResave');
let newError = 'not called';
saveHooks[0].call({ isNew: true }, (err) => { newError = err; });
assert.strictEqual(newError, undefined, 'new entries are allowed');

// Rebuilt history from before the log existed
const { buildHistoryEntries } = require('../utils/salesActivityHistory');
const AGENT = '64b000000000000000000001';
const MANAGER = '64b000000000000000000002';
const day = (n, hour = 9) => new Date(Date.UTC(2026, 8, n, hour));
const users = new Map([[AGENT, { name: 'Frehiwot', role: 'sales' }], [MANAGER, { name: 'Abel', role: 'salesmanager' }]]);
const sales = [
  { _id: '64b0000000000000000000a1', customerName: 'Hana Girma', phone: '0911', courseName: 'Barista', coursePrice: 12000,
    followupStatus: 'Completed', agentId: AGENT, createdBy: MANAGER, createdAt: day(1), updatedAt: day(3), hasSlip: true },
  { _id: '64b0000000000000000000a2', customerName: 'Abebe', followupStatus: 'Pending', agentId: AGENT, createdBy: AGENT,
    createdAt: day(2), updatedAt: new Date(day(2).getTime() + 5000), hasSlip: false },
  { _id: '64b0000000000000000000a3', customerName: 'Late Sale', followupStatus: 'Pending', agentId: AGENT, createdBy: AGENT,
    createdAt: day(20), updatedAt: day(21), hasSlip: false },
];
const notices = [
  { user: AGENT, text: 'Hana Girma: Sales follow-up completed. Please make sure the bank slip, ID front, and ID back are submitted.', createdAt: day(2, 15) },
  { user: AGENT, text: 'Unknown Person: Sales follow-up completed.', createdAt: day(2, 16) },
  { user: AGENT, text: 'Some other notification', createdAt: day(2, 17) },
];
const history = buildHistoryEntries({ sales, notices, users, cutoff: day(10) });
const summarize = (entry) => `${entry.action}:${entry.customerName}:${entry.createdAt.toISOString().slice(0, 13)}`;
assert.deepStrictEqual(history.map(summarize).sort(), [
  'created:Abebe:2026-09-02T09',
  'created:Hana Girma:2026-09-01T09',
  'updated:Hana Girma:2026-09-02T15', // completion notice
  'updated:Hana Girma:2026-09-03T09', // last edit
].sort(), 'only traceable events before the cutoff are rebuilt');
const created = history.find((entry) => entry.action === 'created' && entry.customerName === 'Hana Girma');
assert.strictEqual(created.actorName, 'Abel', 'creator comes from createdBy');
assert.strictEqual(created.agentName, 'Frehiwot');
assert.ok(created.changeTypes.includes('history') && created.source === 'history', 'rebuilt entries are marked as history');
const completedEntry = history.find((entry) => entry.changeTypes.includes('completed'));
assert.strictEqual(completedEntry.actorName, 'Frehiwot');
const lastEdit = history.find((entry) => entry.changeTypes.includes('details_edited'));
assert.ok(lastEdit.changes.some((change) => change.field === 'paymentScreenshot' && change.to === 'On file'));
assert.ok(!history.some((entry) => entry.changeTypes.includes('payment_slip_added')), 'the activity phase leaves slips to their own phase');

// Rebuilt payment slip uploads, dated by the best evidence
const { buildSlipHistoryEntries } = require('../utils/salesActivityHistory');
const slipSales = [
  // completed with a notice: dated at completion
  { ...sales[0] },
  // never edited after creation, slip on its student registration: dated at creation
  { _id: '64b0000000000000000000b1', customerName: 'Created With Slip', agentId: AGENT, createdBy: MANAGER,
    createdAt: day(4), updatedAt: new Date(day(4).getTime() + 1000), hasSlip: false, hasRegistrationSlip: true },
  // edited later, no completion evidence: last edit, marked approximate
  { _id: '64b0000000000000000000b2', customerName: 'Edited Later', agentId: AGENT, createdBy: AGENT,
    createdAt: day(5), updatedAt: day(7), hasSlip: true },
  // completedAt recorded (newer sales)
  { _id: '64b0000000000000000000b3', customerName: 'Has CompletedAt', agentId: AGENT, createdBy: AGENT,
    createdAt: day(5), updatedAt: day(8), completedAt: day(6, 11), hasSlip: true },
  // no slip: no entry
  { _id: '64b0000000000000000000b4', customerName: 'No Slip', agentId: AGENT, createdAt: day(5), updatedAt: day(6), hasSlip: false },
  // after the cutoff: covered by live logging, not rebuilt
  { _id: '64b0000000000000000000b5', customerName: 'After Cutoff', agentId: AGENT, createdAt: day(12), updatedAt: day(12), hasSlip: true },
];
const slipHistory = buildSlipHistoryEntries({ sales: slipSales, notices, users, cutoff: day(10) });
const slipWhen = Object.fromEntries(slipHistory.map((entry) => [
  entry.customerName,
  `${entry.createdAt.toISOString().slice(0, 13)} ${entry.changes.find((c) => c.field === 'slipUploadTime').to}`,
]));
assert.deepStrictEqual(slipWhen, {
  'Hana Girma': '2026-09-02T15 With completion',
  'Created With Slip': '2026-09-04T09 When the follow-up was created',
  'Edited Later': '2026-09-07T09 Approximate (last edit time)',
  'Has CompletedAt': '2026-09-06T11 With completion',
});
assert.ok(slipHistory.every((entry) => entry.changeTypes.includes('payment_slip_added') && entry.source === 'history'));
assert.strictEqual(slipHistory.find((e) => e.customerName === 'Created With Slip').changes[0].label, 'Payment slip (student registration)');
assert.strictEqual(slipHistory.find((e) => e.customerName === 'Created With Slip').actorName, 'Abel', 'uploaded by the creator');

// Removal archive: what is kept when documents are removed or a follow-up is deleted
const { removedDocuments, plainRecord } = require('../utils/salesActivity');
const kinds = (list) => list.map((doc) => `${doc.field}:${doc.change}`);
assert.deepStrictEqual(kinds(removedDocuments({ paymentScreenshot: SLIP }, { paymentScreenshot: '' }, 'updated')), ['paymentScreenshot:removed']);
assert.deepStrictEqual(kinds(removedDocuments({ paymentScreenshot: SLIP }, { paymentScreenshot: OTHER_SLIP }, 'updated')), ['paymentScreenshot:replaced']);
assert.strictEqual(removedDocuments({ paymentScreenshot: SLIP }, { paymentScreenshot: '' }, 'updated')[0].data, SLIP, 'the removed image itself is kept');
assert.deepStrictEqual(removedDocuments({ paymentScreenshot: SLIP }, { paymentScreenshot: SLIP }, 'updated'), [], 'unchanged slip is not archived');
assert.deepStrictEqual(removedDocuments({ paymentScreenshot: SLIP }, { paymentScreenshot: '__stored_document__' }, 'updated'), [], 'list marker means unchanged');
assert.deepStrictEqual(removedDocuments({ paymentScreenshot: PLACEHOLDER }, { paymentScreenshot: '' }, 'updated'), [], 'placeholder is not a real slip');
assert.deepStrictEqual(removedDocuments({ paymentScreenshot: '' }, { paymentScreenshot: SLIP }, 'updated'), [], 'adding is not a removal');
assert.deepStrictEqual(
  kinds(removedDocuments({ paymentScreenshot: SLIP, nationalIdFrontImage: OTHER_SLIP, nationalIdBackImage: '' }, null, 'deleted')),
  ['paymentScreenshot:deleted_with_record', 'nationalIdFrontImage:deleted_with_record'],
  'a deleted follow-up archives every document it held',
);
const recordCopy = plainRecord({ _id: 'x', customerName: 'Hana', coursePrice: 12000, paymentScreenshot: SLIP, nationalIdBackImage: SLIP, __v: 3 });
assert.deepStrictEqual(recordCopy, { _id: 'x', customerName: 'Hana', coursePrice: 12000 }, 'record copy keeps fields, images go to documents');

const { SalesRemovalArchive, SalesRemovedDocument } = require('../models/SalesRemovalArchive');
[SalesRemovalArchive, SalesRemovedDocument].forEach((Model) => {
  const ownPres = (name) => (Model.schema.s.hooks._pres.get(name) || []).map((hook) => hook.fn).filter((fn) => OWN_HOOKS.has(fn.name));
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'save'].forEach((name) => {
    const refused = ownPres(name).some((fn) => {
      let error = null;
      fn.call({ isNew: false }, (err) => { error = err; });
      return error && /read-only/.test(error.message);
    });
    assert.ok(refused, `${Model.modelName}: ${name} must be refused`);
  });
});

console.log('salesActivity: all checks passed');
