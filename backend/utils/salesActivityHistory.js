const mongoose = require('mongoose');
const SalesActivityLog = require('../models/SalesActivityLog');

// The sales activity log only records activity from the day it was switched on.
// This rebuilds what can still be traced for earlier activity, once:
//   - created:   every sale's creation time and creator
//   - completed: the "Sales follow-up completed" notification sent to the agent
//   - last edit: the sale's last update time, with its current status and slip
// Individual earlier edits and deleted follow-ups were never stored, so they
// cannot be rebuilt. Rebuilt entries carry source "history".

const HISTORY_SOURCE = 'history';
const COMPLETED_NOTICE = /^(.*): Sales follow-up completed\b/;
const EDIT_GAP_MS = 60 * 1000; // an update within a minute of creation is part of creating it

const text = (value) => (value === undefined || value === null ? '' : String(value));
const time = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

// Pure: turns sales, completion notices and user names into log entries dated
// before `cutoff` (when live logging started). Exported for tests.
const buildHistoryEntries = ({ sales, notices, users, cutoff }) => {
  const nameOf = (id) => users.get(text(id))?.name || '';
  const roleOf = (id) => users.get(text(id))?.role || '';
  const before = (date) => date && (!cutoff || date < cutoff);
  const base = (sale) => ({
    saleId: sale._id,
    customerName: text(sale.customerName),
    phone: text(sale.phone),
    courseName: text(sale.courseName || sale.contactTitle),
    agentId: text(sale.agentId),
    agentName: nameOf(sale.agentId),
    source: HISTORY_SOURCE,
  });
  const actor = (id) => (id && mongoose.Types.ObjectId.isValid(text(id))
    ? { actorId: id, actorName: nameOf(id), actorRole: roleOf(id) }
    : { actorName: '', actorRole: '' });

  // Completion notices go to the agent: match them to that agent's sale by customer name.
  const salesByAgentAndName = new Map();
  sales.forEach((sale) => {
    const key = `${text(sale.agentId)}|${text(sale.customerName).trim().toLowerCase()}`;
    if (!salesByAgentAndName.has(key)) salesByAgentAndName.set(key, sale);
  });

  const entries = [];
  sales.forEach((sale) => {
    const createdAt = time(sale.createdAt);
    if (before(createdAt)) {
      entries.push({
        ...base(sale),
        ...actor(sale.createdBy || sale.agentId),
        action: 'created',
        changeTypes: ['created', HISTORY_SOURCE],
        changes: [
          ['customerName', 'Customer name'],
          ['phone', 'Phone'],
          ['courseName', 'Course'],
          ['coursePrice', 'Course price'],
        ].filter(([field]) => text(sale[field]) && text(sale[field]) !== '0')
          .map(([field, label]) => ({ field, label, kind: 'value', from: '', to: text(sale[field]) })),
        createdAt,
      });
    }

    const updatedAt = time(sale.updatedAt);
    if (before(updatedAt) && createdAt && updatedAt - createdAt > EDIT_GAP_MS) {
      const changes = [{ field: 'followupStatus', label: 'Status at last edit', kind: 'value', from: '', to: text(sale.followupStatus) }];
      if (sale.hasSlip) changes.push({ field: 'paymentScreenshot', label: 'Payment slip', kind: 'document', from: '', to: 'On file' });
      entries.push({
        ...base(sale),
        ...actor(sale.agentId),
        action: 'updated',
        changeTypes: ['details_edited', HISTORY_SOURCE],
        changes,
        createdAt: updatedAt,
      });
    }
  });

  notices.forEach((notice) => {
    const match = COMPLETED_NOTICE.exec(text(notice.text));
    const at = time(notice.createdAt);
    if (!match || !before(at)) return;
    const sale = salesByAgentAndName.get(`${text(notice.user)}|${match[1].trim().toLowerCase()}`);
    if (!sale) return;
    entries.push({
      ...base(sale),
      ...actor(notice.user),
      action: 'updated',
      changeTypes: ['status_changed', 'completed', HISTORY_SOURCE],
      changes: [{ field: 'followupStatus', label: 'Follow-up status', kind: 'value', from: '', to: 'Completed' }],
      createdAt: at,
    });
  });

  return entries;
};

// Pure: one "Payment slip added" entry for every sale whose slip is on file (on the
// sale or its student registration), dated by the best evidence available:
//   1. its completion (the completion form requires the slip), from the completion
//      notice or completedAt
//   2. its creation, when the sale was never edited afterwards
//   3. otherwise its last edit, marked approximate
// Exported for tests.
const buildSlipHistoryEntries = ({ sales, notices, users, cutoff }) => {
  const nameOf = (id) => users.get(text(id))?.name || '';
  const roleOf = (id) => users.get(text(id))?.role || '';
  const completionTime = new Map(); // `${agent}|${customer}` -> earliest completion notice
  notices.forEach((notice) => {
    const match = COMPLETED_NOTICE.exec(text(notice.text));
    const at = time(notice.createdAt);
    if (!match || !at) return;
    const key = `${text(notice.user)}|${match[1].trim().toLowerCase()}`;
    if (!completionTime.has(key) || at < completionTime.get(key)) completionTime.set(key, at);
  });

  const entries = [];
  sales.forEach((sale) => {
    if (!sale.hasSlip && !sale.hasRegistrationSlip) return;
    const createdAt = time(sale.createdAt);
    const updatedAt = time(sale.updatedAt);
    const completedAt = completionTime.get(`${text(sale.agentId)}|${text(sale.customerName).trim().toLowerCase()}`)
      || time(sale.completedAt);
    let at = null;
    let when = '';
    let actorId = sale.agentId;
    if (completedAt) {
      at = completedAt;
      when = 'With completion';
    } else if (createdAt && (!updatedAt || updatedAt - createdAt <= EDIT_GAP_MS)) {
      at = createdAt;
      when = 'When the follow-up was created';
      actorId = sale.createdBy || sale.agentId;
    } else if (updatedAt) {
      at = updatedAt;
      when = 'Approximate (last edit time)';
    }
    if (!at || (cutoff && at >= cutoff)) return;
    entries.push({
      action: 'updated',
      changeTypes: ['payment_slip_added', HISTORY_SOURCE],
      saleId: sale._id,
      customerName: text(sale.customerName),
      phone: text(sale.phone),
      courseName: text(sale.courseName || sale.contactTitle),
      agentId: text(sale.agentId),
      agentName: nameOf(sale.agentId),
      ...(actorId && mongoose.Types.ObjectId.isValid(text(actorId))
        ? { actorId, actorName: nameOf(actorId), actorRole: roleOf(actorId) }
        : { actorName: '', actorRole: '' }),
      source: HISTORY_SOURCE,
      changes: [
        {
          field: 'paymentScreenshot',
          label: sale.hasSlip ? 'Payment slip' : 'Payment slip (student registration)',
          kind: 'document',
          from: 'None',
          to: 'Uploaded',
        },
        { field: 'slipUploadTime', label: 'Upload time', kind: 'value', from: '', to: when },
      ],
      createdAt: at,
    });
  });
  return entries;
};

// Whether a stored image is a real upload (not empty, not a generated placeholder).
const isRealImage = (field) => ({ $and: [
  { $ne: [{ $ifNull: [field, ''] }, ''] },
  { $ne: [{ $substrCP: [{ $ifNull: [field, ''] }, 0, 18] }, 'data:image/svg+xml'] },
] });

const loadSources = async () => {
  const SalesCustomer = require('../models/SalesCustomer');
  const StudentRegistration = require('../models/StudentRegistration');
  const Notification = require('../models/Notification');
  const User = require('../models/user.model');
  const [sales, notices, userRows] = await Promise.all([
    SalesCustomer.aggregate([
      { $project: {
        customerName: 1, phone: 1, courseName: 1, contactTitle: 1, coursePrice: 1, followupStatus: 1,
        agentId: 1, createdBy: 1, createdAt: 1, updatedAt: 1, completedAt: 1, studentRegistrationId: 1,
        // Only whether a real slip is on file; the image itself is not read into the log.
        hasSlip: isRealImage('$paymentScreenshot'),
      } },
      { $lookup: {
        from: StudentRegistration.collection.name,
        localField: 'studentRegistrationId',
        foreignField: '_id',
        pipeline: [{ $project: { _id: 0, slip: isRealImage('$paymentScreenshot') } }],
        as: 'registration',
      } },
      { $addFields: { hasRegistrationSlip: { $in: [true, '$registration.slip'] } } },
      { $project: { registration: 0 } },
    ]).allowDiskUse(true),
    Notification.find({ text: /: Sales follow-up completed/ }).select('user text createdAt').lean(),
    User.find({}).select('fullName username name email role').lean(),
  ]);
  const users = new Map(userRows.map((user) => [String(user._id), {
    name: user.fullName || user.username || user.name || user.email || '',
    role: user.role || '',
  }]));
  return { sales, notices, users };
};

// Each rebuild phase runs once: its marker entries mean it already happened.
const PHASES = [
  { name: 'activity', marker: { source: HISTORY_SOURCE, action: 'created' }, build: buildHistoryEntries },
  { name: 'payment slips', marker: { source: HISTORY_SOURCE, changeTypes: 'payment_slip_added' }, build: buildSlipHistoryEntries },
];

let running = null;

// Adds the rebuilt history once per phase. Safe to call on every start and every
// request: finished phases are skipped. Never throws.
const backfillSalesActivityHistory = () => {
  running ??= (async () => {
    const pending = [];
    for (const phase of PHASES) {
      if (!(await SalesActivityLog.exists(phase.marker))) pending.push(phase);
    }
    if (!pending.length) return { skipped: true };

    // Live logging began with the first non-history entry; history stays before it.
    const firstLive = await SalesActivityLog.findOne({ source: { $ne: HISTORY_SOURCE } }).sort({ createdAt: 1 }).select('createdAt').lean();
    const cutoff = firstLive?.createdAt || new Date();
    const sources = await loadSources();

    const result = {};
    for (const phase of pending) {
      const entries = phase.build({ ...sources, cutoff });
      for (let i = 0; i < entries.length; i += 1000) {
        await SalesActivityLog.insertMany(entries.slice(i, i + 1000), { ordered: false });
      }
      result[phase.name] = entries.length;
      console.log(`Sales activity history rebuilt (${phase.name}): ${entries.length} entries`);
    }
    return result;
  })().catch((error) => {
    running = null;
    console.warn('Sales activity history rebuild failed:', error.message);
    return { error: error.message };
  });
  return running;
};

module.exports = { buildHistoryEntries, buildSlipHistoryEntries, backfillSalesActivityHistory, HISTORY_SOURCE };
