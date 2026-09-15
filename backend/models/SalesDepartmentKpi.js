const mongoose = require('mongoose');

const kpiItemSchema = new mongoose.Schema({
  kpi: { type: String, required: true, trim: true },
  target: { type: Number, default: 0 },
  actual: { type: Number, default: 0 },
  achievement: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['On Track', 'Behind', 'At Risk', 'Completed', 'Not Reported', 'Pending'],
    default: 'Pending',
  },
  notes: { type: String, default: '', trim: true },
}, { _id: false });

const salesDepartmentKpiSchema = new mongoose.Schema({
  periodType: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly'],
    required: true,
    index: true,
  },
  periodKey: {
    type: String, // e.g. '2026-W37', '2026-09', '2026-Q3'
    required: true,
    index: true,
  },
  year: {
    type: Number,
    required: true,
  },
  periodLabel: {
    type: String,
    default: '',
  },
  measurements: [kpiItemSchema],
  services: [kpiItemSchema],
  products: [kpiItemSchema],
  summaryNotes: {
    type: String,
    default: '',
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  submittedByName: {
    type: String,
    default: '',
  },
  submittedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

salesDepartmentKpiSchema.index({ periodType: 1, periodKey: 1 }, { unique: true });

module.exports = mongoose.model('SalesDepartmentKpi', salesDepartmentKpiSchema);
