const mongoose = require('mongoose');

const awardSchema = new mongoose.Schema({
  month: { type: String, required: true }, // YYYY-MM
  department: { type: String, required: false },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  awardType: { type: String, enum: ['Department Winner', 'Overall Winner'], required: true },
  publishedAt: { type: Date, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Award', awardSchema);
