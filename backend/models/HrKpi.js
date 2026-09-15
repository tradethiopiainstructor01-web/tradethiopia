const mongoose = require('mongoose');

const hrKpiMetricSchema = new mongoose.Schema({
  target: { type: Number, default: 0 },
  actual: { type: Number, default: 0 },
  status: { type: String, enum: ['On Track', 'Behind Target', 'Exceeded', 'Completed', 'Pending', 'Not Reported'], default: 'Not Reported' },
  notes: { type: String, default: '' },
}, { _id: false });

const hrKpiSchema = new mongoose.Schema({
  periodType: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly'],
    required: true,
    index: true,
  },
  periodKey: {
    type: String, // e.g., '2026-W34', '2026-08', '2026-Q3'
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

  // The 10 explicit HR KPI Metrics (Uninputted targets default strictly to 0)
  postVacancies: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0, status: 'Not Reported' }) },
  screenCvs: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0, status: 'Not Reported' }) },
  conductInterviews: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0, status: 'Not Reported' }) },
  facilitateInternalTrainings: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0, status: 'Not Reported' }) },
  attendancePunctuality: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0, status: 'Not Reported' }) },
  checkingJobEnisra: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0, status: 'Not Reported' }) },
  newHires: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0, status: 'Not Reported' }) },
  resignations: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0, status: 'Not Reported' }) },
  candidatesPool: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0, status: 'Not Reported' }) },
  staffTrainingParticipants: { type: hrKpiMetricSchema, default: () => ({ target: 0, actual: 0, status: 'Not Reported' }) },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

hrKpiSchema.index({ periodType: 1, periodKey: 1 }, { unique: true });

module.exports = mongoose.model('HrKpi', hrKpiSchema);
