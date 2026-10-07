const mongoose = require('mongoose');

// Read-only archive of what sales staff removed: payment slips and other documents
// removed or replaced on a follow-up, and whole follow-ups that were deleted, with
// a copy of the removed data so the sales manager can still see it. Entries can
// only be added; every update or delete is refused at the model level.

const archivedDocumentRefSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  field: { type: String, required: true },
  label: { type: String, default: '' },
  change: { type: String, enum: ['removed', 'replaced', 'deleted_with_record'], required: true },
  size: { type: Number, default: 0 },
}, { _id: false });

const salesRemovalArchiveSchema = new mongoose.Schema({
  kind: { type: String, enum: ['document_removed', 'followup_deleted'], required: true },
  activityLogId: { type: mongoose.Schema.Types.ObjectId },
  saleId: { type: mongoose.Schema.Types.ObjectId },
  customerName: { type: String, default: '' },
  phone: { type: String, default: '' },
  courseName: { type: String, default: '' },
  agentId: { type: String, default: '' },
  agentName: { type: String, default: '' },
  actorId: { type: mongoose.Schema.Types.ObjectId },
  actorName: { type: String, default: '' },
  actorRole: { type: String, default: '' },
  source: { type: String, default: 'sales_portal' },
  // Tags for filtering: payment_slip_removed, payment_slip_replaced, id_front_removed, ...
  removedTypes: { type: [String], default: [] },
  documents: { type: [archivedDocumentRefSchema], default: [] },
  // For deleted follow-ups: every field of the record as it was (images excluded,
  // they are in `documents`).
  record: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

salesRemovalArchiveSchema.index({ createdAt: -1 });
salesRemovalArchiveSchema.index({ kind: 1, createdAt: -1 });
salesRemovalArchiveSchema.index({ agentId: 1, createdAt: -1 });
salesRemovalArchiveSchema.index({ removedTypes: 1, createdAt: -1 });

// One removed image (data URL or file link), stored on its own so large images
// never push an archive entry past MongoDB's document size limit.
const salesRemovedDocumentSchema = new mongoose.Schema({
  archiveId: { type: mongoose.Schema.Types.ObjectId, index: true },
  field: { type: String, required: true },
  label: { type: String, default: '' },
  data: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const makeReadOnly = (schema, name) => {
  const refuse = (what) => function refuseChange(next) {
    next(new Error(`${name} entries are read-only and cannot be ${what}`));
  };
  schema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace'], refuse('changed'));
  schema.pre(['deleteMany', 'findOneAndDelete'], refuse('deleted'));
  schema.pre('deleteOne', { document: true, query: true }, refuse('deleted'));
  schema.pre('save', function refuseResave(next) {
    if (!this.isNew) return next(new Error(`${name} entries are read-only and cannot be changed`));
    return next();
  });
};
makeReadOnly(salesRemovalArchiveSchema, 'Sales removal archive');
makeReadOnly(salesRemovedDocumentSchema, 'Sales removed document');

const SalesRemovalArchive = mongoose.model('SalesRemovalArchive', salesRemovalArchiveSchema);
const SalesRemovedDocument = mongoose.model('SalesRemovedDocument', salesRemovedDocumentSchema);

module.exports = { SalesRemovalArchive, SalesRemovedDocument };
