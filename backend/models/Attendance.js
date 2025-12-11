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
  month: {
    type: String, // Format: "YYYY-MM"
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  // Attendance Details
  overtimeHours: {
    type: Number,
    default: 0
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  absence: {
    type: Boolean,
    default: false
  },
  // Status and Metadata
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['HR', 'Admin'],
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
attendanceSchema.index({ userId: 1, month: 1, year: 1 });
attendanceSchema.index({ department: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);