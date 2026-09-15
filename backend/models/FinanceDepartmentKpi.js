const mongoose = require('mongoose');

const kpiItemSchema = new mongoose.Schema({
  kpi: { type: String, required: true, trim: true },
  target: { type: Number, default: 0 },
  actual: { type: Number, default: 0 },
  achievement: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['On Track', 'Behind', 'At Risk', 'Completed', 'Not Reported', 'Pending'],
    default: 'Not Reported',
  },
  notes: { type: String, default: '', trim: true },
}, { _id: false });

const financeDepartmentKpiSchema = new mongoose.Schema({
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
  financials: [kpiItemSchema],
  detailedCategories: [kpiItemSchema],
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
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Not Reported'],
    default: 'Not Reported',
  },
}, {
  timestamps: true,
});

financeDepartmentKpiSchema.index({ periodType: 1, periodKey: 1 }, { unique: true });

module.exports = mongoose.model('FinanceDepartmentKpi', financeDepartmentKpiSchema);
