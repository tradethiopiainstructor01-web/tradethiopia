const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
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
    type: String, // Format: "YYYY-MM"
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  // Base Components
  basicSalary: {
    type: Number,
    required: true,
    default: 0
  },
  age: {
    type: Number
  },
  ageAdjustment: {
    type: Number,
    default: 0
  },
  // Attendance Adjustments
  overtimeHours: {
    type: Number,
    default: 0
  },
  overtimeRate: {
    type: Number,
    default: 0
  },
  overtimePay: {
    type: Number,
    default: 0
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  lateRate: {
    type: Number,
    default: 0
  },
  lateDeduction: {
    type: Number,
    default: 0
  },
  absenceDays: {
    type: Number,
    default: 0
  },
  dailyRate: {
    type: Number,
    default: 0
  },
  absenceDeduction: {
    type: Number,
    default: 0
  },
  // Sales Commissions
  numberOfSales: {
    type: Number,
    default: 0
  },
  salesCommission: {
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
  // Final Calculation
  finalSalary: {
    type: Number,
    required: true,
    default: 0
  },
  // Status and Metadata
  status: {
    type: String,
    enum: ['draft', 'hr_submitted', 'finance_reviewed', 'approved', 'locked'],
    default: 'draft'
  },
  hrSubmittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  financeReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hrSubmittedAt: {
    type: Date
  },
  financeReviewedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  lockedAt: {
    type: Date
  },
  // Audit Log
  auditLog: [
    {
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
      fieldName: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      role: {
        type: String,
        enum: ['HR', 'Finance', 'Admin']
      }
    }
  ]
}, {
  timestamps: true
});

// Index for faster queries
payrollSchema.index({ userId: 1, month: 1, year: 1 });
payrollSchema.index({ department: 1 });
payrollSchema.index({ status: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);