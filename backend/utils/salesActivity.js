const mongoose = require('mongoose');
const SalesActivityLog = require('../models/SalesActivityLog');

// Fields shown in the sales activity log, with their display labels.
const VALUE_FIELDS = [
  ['customerName', 'Customer name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['contactTitle', 'Training'],
  ['courseName', 'Course'],
  ['followupStatus', 'Follow-up status'],
  ['callStatus', 'Call status'],
  ['schedulePreference', 'Schedule'],
  ['packageScope', 'Package scope'],
  ['pipelineStatus', 'Pipeline status'],
  ['coursePrice', 'Course price'],
  ['paymentOption', 'Payment option'],
  ['paymentBank', 'Bank'],
  ['fsNumber', 'FS number'],
  ['note', 'Note'],
  ['supervisorComment', 'Supervisor comment'],
  ['agentId', 'Sales agent'],
];
// Document images: the log records only that one was added, replaced or removed.
const DOCUMENT_FIELDS = [
  ['paymentScreenshot', 'Payment slip', 'payment_slip'],
  ['nationalIdFrontImage', 'ID front', 'id_front'],
  ['nationalIdBackImage', 'ID back', 'id_back'],
  ['passportPhoto', 'Passport photo', 'passport_photo'],
];
const SNAPSHOT_FIELDS = ['_id', ...VALUE_FIELDS.map(([field]) => field), ...DOCUMENT_FIELDS.map(([field]) => field)];
// Projection for reading a "before" snapshot without loading document images.
const SNAPSHOT_SELECT = ['_id', ...VALUE_FIELDS.map(([field]) => field)].join(' ');

const PLACEHOLDER_PREFIX = 'data:image/svg+xml';
const STORED_DOCUMENT = '__stored_document__';
const hasDocument = (value) => typeof value === 'string' && value.trim() !== ''
  && !value.startsWith(PLACEHOLDER_PREFIX) && value !== STORED_DOCUMENT;

const toText = (value) => {
  if (value === undefined || value === null) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  return text.length > 300 ? `${text.slice(0, 297)}...` : text;
};

// A plain copy of the fields the log compares (call before changing a follow-up).
const snapshotSale = (sale) => {
  if (!sale) return null;
  const source = typeof sale.toObject === 'function' ? sale.toObject() : sale;
  return Object.fromEntries(SNAPSHOT_FIELDS.map((field) => [field, source[field]]));
};

const userNameCache = new Map(); // id -> { name, at }
const resolveUserNames = async (ids) => {
  const now = Date.now();
  const wanted = [...new Set(ids.filter((id) => id && mongoose.Types.ObjectId.isValid(String(id))).map(String))];
  const missing = wanted.filter((id) => !(now - (userNameCache.get(id)?.at || 0) < 5 * 60 * 1000));
  if (missing.length) {
    const User = require('../models/user.model');
    const users = await User.find({ _id: { $in: missing } }).select('fullName username name email').lean();
    const found = new Map(users.map((user) => [String(user._id), user.fullName || user.username || user.name || user.email || '']));
    missing.forEach((id) => userNameCache.set(id, { name: found.get(id) || '', at: now }));
  }
  return (id) => (id ? userNameCache.get(String(id))?.name || '' : '');
};

// Changed fields between two snapshots, and tags describing them. With
// documents: false only text fields are compared (for snapshots read without images).
const diffSales = (before, after, { documents = true } = {}) => {
  const changes = [];
  const types = new Set();
  VALUE_FIELDS.forEach(([field, label]) => {
    const from = toText(before?.[field]);
    const to = toText(after?.[field]);
    if (from === to) return;
    changes.push({ field, label, kind: 'value', from, to });
    if (field === 'followupStatus') {
      types.add('status_changed');
      if (to.toLowerCase() === 'completed') types.add('completed');
      else if (from.toLowerCase() === 'completed') types.add('reopened');
    } else if (field === 'agentId') types.add('reassigned');
    else if (field === 'coursePrice') types.add('price_changed');
    else if (field === 'note' || field === 'supervisorComment') types.add('note_changed');
    else types.add('details_edited');
  });
  if (!documents) return { changes, types: [...types] };
  DOCUMENT_FIELDS.forEach(([field, label, key]) => {
    const had = hasDocument(before?.[field]);
    const has = hasDocument(after?.[field]);
    // A list-row marker means "unchanged" and is never treated as a change.
    if (after?.[field] === STORED_DOCUMENT) return;
    let change = null;
    if (!had && has) change = 'added';
    else if (had && !has) change = 'removed';
    else if (had && has && before[field] !== after[field]) change = 'replaced';
    if (!change) return;
    changes.push({ field, label, kind: 'document', from: had ? 'Uploaded' : 'None', to: change === 'removed' ? 'Removed' : change === 'added' ? 'Uploaded' : 'Replaced' });
    types.add(`${key}_${change}`);
  });
  return { changes, types: [...types] };
};

const actorOf = (user) => ({
  actorId: user?._id || (mongoose.Types.ObjectId.isValid(String(user?.id || '')) ? user.id : undefined),
  actorName: user?.fullName || user?.username || user?.name || user?.email || '',
  actorRole: user?.role || '',
});

const buildEntry = async ({ action, before, after, user, source, valuesOnly = false }) => {
  const sale = after || before || {};
  const options = { documents: !valuesOnly };
  let changes = [];
  let types = [];
  if (action === 'updated') {
    ({ changes, types } = diffSales(before, after, options));
    if (!changes.length) return null;
  } else if (action === 'created') {
    ({ changes, types } = diffSales({}, after, options));
    types = ['created', ...types.filter((type) => type.endsWith('_added') || type === 'completed')];
  } else {
    // Deleted: record what the follow-up held, including any documents it carried.
    ({ changes } = diffSales(before, {}));
    types = ['deleted', ...DOCUMENT_FIELDS
      .filter(([field]) => hasDocument(before?.[field]))
      .map(([, , key]) => `${key}_deleted`)];
  }

  const nameOf = await resolveUserNames([sale.agentId, ...changes.filter((c) => c.field === 'agentId').flatMap((c) => [c.from, c.to])]);
  changes.forEach((change) => {
    if (change.field !== 'agentId') return;
    change.from = nameOf(change.from) || change.from;
    change.to = nameOf(change.to) || change.to;
  });

  return {
    action,
    changeTypes: types,
    saleId: mongoose.Types.ObjectId.isValid(String(sale._id || '')) ? sale._id : undefined,
    customerName: toText(sale.customerName),
    phone: toText(sale.phone),
    courseName: toText(sale.courseName || sale.contactTitle),
    agentId: toText(sale.agentId),
    agentName: nameOf(sale.agentId),
    ...actorOf(user),
    source,
    changes,
  };
};

// Documents that left a follow-up between two snapshots, with the removed data.
// A deleted follow-up loses every document it held.
const removedDocuments = (before, after, action) => DOCUMENT_FIELDS.flatMap(([field, label, key]) => {
  const old = before?.[field];
  if (!hasDocument(old)) return [];
  if (action === 'deleted') return [{ field, label, key, change: 'deleted_with_record', data: old }];
  const next = after?.[field];
  if (next === STORED_DOCUMENT) return [];
  if (!hasDocument(next)) return [{ field, label, key, change: 'removed', data: old }];
  if (next !== old) return [{ field, label, key, change: 'replaced', data: old }];
  return [];
});

const IMAGE_FIELDS = new Set(DOCUMENT_FIELDS.map(([field]) => field));
// A deleted follow-up's fields as plain values (images are archived separately).
const plainRecord = (record) => {
  if (!record) return undefined;
  const source = typeof record.toObject === 'function' ? record.toObject() : record;
  return JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(source)
    .filter(([field]) => !IMAGE_FIELDS.has(field) && field !== '__v' && field !== 'nationalIdImage'))));
};

// Keeps a copy of whatever was removed (slips and other documents, and deleted
// follow-ups) in the read-only removal archive shown to the sales manager.
const archiveRemovals = async ({ entry, logId, before, after, action, record, labels = {} }) => {
  const documents = removedDocuments(before, after, action);
  if (action !== 'deleted' && !documents.length) return;
  const { SalesRemovalArchive, SalesRemovedDocument } = require('../models/SalesRemovalArchive');
  const archiveId = new mongoose.Types.ObjectId();
  const stored = documents.length
    ? await SalesRemovedDocument.insertMany(documents.map((doc) => ({
      archiveId, field: doc.field, label: labels[doc.field] || doc.label, data: doc.data,
    })))
    : [];
  await SalesRemovalArchive.create({
    _id: archiveId,
    kind: action === 'deleted' ? 'followup_deleted' : 'document_removed',
    activityLogId: logId,
    saleId: entry.saleId,
    customerName: entry.customerName,
    phone: entry.phone,
    courseName: entry.courseName,
    agentId: entry.agentId,
    agentName: entry.agentName,
    actorId: entry.actorId,
    actorName: entry.actorName,
    actorRole: entry.actorRole,
    source: entry.source,
    removedTypes: [
      ...(action === 'deleted' ? ['followup_deleted'] : []),
      ...documents.map((doc) => `${doc.key}_${doc.change === 'deleted_with_record' ? 'deleted' : doc.change}`),
    ],
    documents: stored.map((doc, index) => ({
      documentId: doc._id, field: doc.field, label: doc.label, change: documents[index].change, size: documents[index].data.length,
    })),
    record: action === 'deleted' ? plainRecord(record || before) : undefined,
  });
};

// Records one follow-up event (and archives anything removed). Never throws and
// never delays the caller's response: a failed write is reported in the server log only.
const logSalesActivity = ({ action, before = null, after = null, user = null, source = 'sales_portal', valuesOnly = false, record = null }) => {
  buildEntry({ action, before, after, user, source, valuesOnly })
    .then(async (entry) => {
      if (!entry) return;
      const log = await SalesActivityLog.create(entry);
      if (!valuesOnly) await archiveRemovals({ entry, logId: log._id, before, after, action, record });
    })
    .catch((error) => console.warn('Sales activity log write failed:', error.message));
};

// Records many created follow-ups at once (imports).
const logSalesActivityMany = ({ sales = [], user = null, source = 'import' }) => {
  Promise.all(sales.map((sale) => buildEntry({ action: 'created', after: snapshotSale(sale), user, source })))
    .then((entries) => entries.filter(Boolean))
    .then((entries) => (entries.length ? SalesActivityLog.insertMany(entries, { ordered: false }) : null))
    .catch((error) => console.warn('Sales activity log write failed:', error.message));
};

// A payment slip uploaded, replaced or removed on a student registration counts as
// the linked sale's slip, so it is logged on every sale linked to that registration.
const logRegistrationSlipChange = ({ registrationId, beforeSlip, afterSlip, user, reason = '' }) => {
  if (!registrationId) return;
  const had = hasDocument(beforeSlip);
  const has = hasDocument(afterSlip);
  if (had === has && (!had || beforeSlip === afterSlip)) return; // nothing changed
  const SalesCustomer = require('../models/SalesCustomer');
  SalesCustomer.find({ studentRegistrationId: registrationId }).select(SNAPSHOT_SELECT).lean()
    .then((sales) => sales.forEach((sale) => {
      const before = { ...snapshotSale(sale), paymentScreenshot: had ? beforeSlip : '' };
      const after = { ...snapshotSale(sale), paymentScreenshot: has ? afterSlip : '' };
      const label = reason ? `Payment slip (${reason})` : 'Payment slip (student registration)';
      buildEntry({ action: 'updated', before, after, user, source: 'student_registration' })
        .then(async (entry) => {
          if (!entry) return;
          entry.changes = entry.changes.map((change) => (change.field === 'paymentScreenshot' ? { ...change, label } : change));
          const log = await SalesActivityLog.create(entry);
          await archiveRemovals({ entry, logId: log._id, before, after, action: 'updated', labels: { paymentScreenshot: label } });
        })
        .catch((error) => console.warn('Sales activity log write failed:', error.message));
    }))
    .catch((error) => console.warn('Sales activity log write failed:', error.message));
};

module.exports = {
  snapshotSale,
  diffSales,
  removedDocuments,
  plainRecord,
  logSalesActivity,
  logSalesActivityMany,
  logRegistrationSlipChange,
  SNAPSHOT_SELECT,
};
