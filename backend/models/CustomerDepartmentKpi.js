const mongoose = require('mongoose');
const metric = new mongoose.Schema({
  key: String, section: String, kpi: String,
  target: { type: Number, min: 0, required: true },
  actual: { type: Number, min: 0, required: true }, notes: String,
}, { _id: false });
const schema = new mongoose.Schema({
  periodType: { type: String, enum: ['weekly', 'monthly', 'quarterly'], required: true },
  periodKey: { type: String, required: true },
  metrics: [metric],
  submittedAt: Date,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedByName: String,
}, { timestamps: true });
schema.index({ periodType: 1, periodKey: 1 }, { unique: true });
module.exports = mongoose.model('CustomerDepartmentKpi', schema);
