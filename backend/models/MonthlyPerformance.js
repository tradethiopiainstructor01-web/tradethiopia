const mongoose = require('mongoose');

const monthlyPerformanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  month: { type: String, required: true }, // YYYY-MM
  target: { type: Number, default: 0 },
  actual: { type: Number, default: 0 },
  taskTarget: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  contentTarget: { type: Number, default: 0 },
  actualAchievements: { type: Number, default: 0 },
  salesTarget: { type: Number, default: 0 },
  actualSales: { type: Number, default: 0 },
  targetServiceTime: { type: Number, default: 0 },
  actualServiceTime: { type: Number, default: 0 },
  score: { type: Number, default: null },
  calculatedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('MonthlyPerformance', monthlyPerformanceSchema);
