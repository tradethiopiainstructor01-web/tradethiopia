const mongoose = require('mongoose');

// One changed field of a sales follow-up. Document images are never stored here,
// only whether they were added, replaced or removed.
const changeSchema = new mongoose.Schema({
  field: { type: String, required: true },
  label: { type: String, default: '' },
  kind: { type: String, enum: ['value', 'document'], default: 'value' },
  from: { type: String, default: '' },
  to: { type: String, default: '' },
}, { _id: false });

// Read-only history of sales follow-up activity (created, edited, deleted) for the
// sales manager's Activity Log. Entries can only be added: every update or delete
// is refused at the model level, so the history cannot be altered or erased.
const salesActivityLogSchema = new mongoose.Schema({
  action: { type: String, enum: ['created', 'updated', 'deleted'], required: true },
  // Short tags for filtering and totals, e.g. payment_slip_added, status_changed, completed.
  changeTypes: { type: [String], default: [] },
  saleId: { type: mongoose.Schema.Types.ObjectId },
  customerName: { type: String, default: '' },
  phone: { type: String, default: '' },
  courseName: { type: String, default: '' },
  // Sales agent who owns the follow-up.
  agentId: { type: String, default: '' },
  agentName: { type: String, default: '' },
  // Person who made the change.
  actorId: { type: mongoose.Schema.Types.ObjectId },
  actorName: { type: String, default: '' },
  actorRole: { type: String, default: '' },
  source: { type: String, default: 'sales_portal' },
  changes: { type: [changeSchema], default: [] },
}, { timestamps: { createdAt: true, updatedAt: false } });

salesActivityLogSchema.index({ createdAt: -1 });
salesActivityLogSchema.index({ agentId: 1, createdAt: -1 });
salesActivityLogSchema.index({ action: 1, createdAt: -1 });
salesActivityLogSchema.index({ changeTypes: 1, createdAt: -1 });
salesActivityLogSchema.index({ saleId: 1, createdAt: -1 });

const refuse = (what) => function refuseChange(next) {
  next(new Error(`Sales activity log entries are read-only and cannot be ${what}`));
};
salesActivityLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace'], refuse('changed'));
salesActivityLogSchema.pre(['deleteMany', 'findOneAndDelete'], refuse('deleted'));
salesActivityLogSchema.pre('deleteOne', { document: true, query: true }, refuse('deleted'));
salesActivityLogSchema.pre('save', function refuseResave(next) {
  if (!this.isNew) return next(new Error('Sales activity log entries are read-only and cannot be changed'));
  return next();
});

module.exports = mongoose.model('SalesActivityLog', salesActivityLogSchema);
