const mongoose = require('mongoose');

const DemandLineSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  requestedQty: { type: Number, required: true },
  unfulfilledQty: { type: Number, required: true }
});

const DemandSchema = new mongoose.Schema({
  followup: { type: mongoose.Schema.Types.ObjectId, ref: 'Followup' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lines: [DemandLineSchema],
  note: { type: String },
  status: { type: String, enum: ['open','resolved','cancelled'], default: 'open' },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Demand', DemandSchema);
