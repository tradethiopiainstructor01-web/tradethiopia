const mongoose = require('mongoose');

const payrollHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  payrollData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  commissionData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  finalizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalizedByName: {
    type: String
  },
  finalizedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

payrollHistorySchema.index({ userId: 1, month: 1, year: 1 });
payrollHistorySchema.index({ finalizedAt: -1 });

module.exports = mongoose.model('PayrollHistory', payrollHistorySchema);
