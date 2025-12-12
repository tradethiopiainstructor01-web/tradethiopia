const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  // Overtime fields for Ethiopian labor law compliance
  daytimeOvertimeHours: {
    type: Number,
    default: 0
  },
  nightOvertimeHours: {
    type: Number,
    default: 0
  },
  restDayOvertimeHours: {
    type: Number,
    default: 0
  },
  holidayOvertimeHours: {
    type: Number,
    default: 0
  },
  // Late and absence tracking
  lateDays: {
    type: Number,
    default: 0
  },
  absenceDays: {
    type: Number,
    default: 0
  },
  // Allowances
  hrAllowances: {
    type: Number,
    default: 0
  },
  financeAllowances: {
    type: Number,
    default: 0
  },
  // Deductions
  financeDeductions: {
    type: Number,
    default: 0
  },
  // Status and metadata
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ department: 1 });
attendanceSchema.index({ status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);