const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: String, enum: ['cold-call', 'bulk-sms'], required: true },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceFolder', default: null },
  key: { type: String, required: true },
  name: { type: String, required: true },
  columns: [String],
  widths: [Number],
  // Presentation-only removal: original columns and row values remain intact.
  archivedColumns: { type: [Number], default: [] },
  rows: [{ _id: false, id: String, values: [String], fingerprint: String }],
  revision: { type: Number, default: 0 },
  // Existing embedded rows are migrated on first access; new rows have their own documents.
  dataVersion: { type: Number, default: 1 }, // 2: rows in their own collection; 3: contact duplicates removed
  dedupeStartedAt: Date,
}, { timestamps: true });

schema.index({ owner: 1, channel: 1, key: 1 }, { unique: true });
module.exports = mongoose.model('EcommerceTable', schema);
