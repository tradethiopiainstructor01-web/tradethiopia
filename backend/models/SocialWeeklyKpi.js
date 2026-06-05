const mongoose = require('mongoose');

const SocialWeeklyKpiSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true },
    weekStart: { type: String, required: true },
    weekEnd: { type: String, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    videos: { type: Number, default: 0 },
    graphics: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SocialWeeklyKpiSchema.index({ platform: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('SocialWeeklyKpi', SocialWeeklyKpiSchema);
