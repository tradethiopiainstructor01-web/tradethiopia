const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceTable', required: true },
  id: { type: String, required: true },
  values: [String],
  fingerprint: { type: String, required: true },
  // File order within one import; imports themselves are ordered by createdAt.
  position: { type: Number, default: 0 },
  // Phone/email/name identity of the contact; unique per table so a contact is saved once.
  contactKeys: { type: [String], default: undefined },
  // Indexes are built by the controller's ensureRowIndexes() after rows that repeat each other
  // (saved while the unique indexes were missing) are removed; an automatic build would fail on them.
}, { timestamps: true, autoIndex: false });

schema.index({ table: 1, fingerprint: 1 }, { unique: true });
schema.index({ table: 1, id: 1 }, { unique: true });
// Partial: rows saved before contact keys existed are skipped until their table is cleaned.
schema.index({ table: 1, contactKeys: 1 }, { unique: true, partialFilterExpression: { contactKeys: { $exists: true } } });
schema.index({ table: 1, createdAt: 1, position: 1, _id: 1 });
module.exports = mongoose.model('EcommerceTableRow', schema);
