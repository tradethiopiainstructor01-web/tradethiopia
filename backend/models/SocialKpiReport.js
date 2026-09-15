const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  periodType: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], required: true },
  periodKey: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  metrics: [{ _id: false, id: String, label: String, section: String, target: Number, actual: Number, achievement: Number }],
  seoTarget: String,
  seoActual: String,
  summaryNotes: String,
  evidencePhotos: [{ type: String }],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedByName: String,
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });
schema.index({ startDate: 1, endDate: 1 }, { unique: true });
schema.index({ periodType: 1, periodKey: 1 }, { unique: true, partialFilterExpression: { periodType: { $type: 'string' }, periodKey: { $type: 'string' } } });
module.exports = mongoose.model('SocialKpiReport', schema);
