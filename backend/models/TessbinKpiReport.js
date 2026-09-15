const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  timeframe: { type: String, enum: ['weekly', 'monthly', 'quarterly'], required: true },
  periodStart: { type: String, required: true },
  periodEnd: { type: String, required: true },
  status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  metrics: [{
    _id: false,
    key: { type: String, enum: ['coc', 'online', 'students', 'evaluations'], required: true },
    target: { type: Number, min: 1, default: null },
    actual: { type: Number, min: 0, default: null },
  }],
  notes: { type: String, maxlength: 3000, default: '' },
  revision: { type: Number, default: 0 },
  submittedAt: { type: Date, default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

schema.index({ timeframe: 1, periodStart: 1 }, { unique: true });
module.exports = mongoose.model('TessbinKpiReport', schema);
