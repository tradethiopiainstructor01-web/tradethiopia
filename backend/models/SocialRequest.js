const mongoose = require('mongoose');

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const SocialRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    platform: { type: String, trim: true },
    department: { type: String, required: true, trim: true, default: 'social' },
    requestType: { type: String, default: "General", trim: true },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    status: { type: String, enum: ["open", "in-review", "resolved"], default: "open" },
    details: { type: String, trim: true },
    dueDate: { type: Date },
    requestedBy: { type: String, trim: true },
    requestedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    weekNumber: { type: Number },
    month: { type: String },
    year: { type: Number },
  },
  { timestamps: true }
);

SocialRequestSchema.pre("save", function (next) {
  if (!this.weekNumber || !this.year || !this.month) {
    const referenceDate = this.dueDate || this.createdAt || new Date();
    const week = getWeekNumber(referenceDate);
    this.weekNumber = this.weekNumber || week;
    this.year = this.year || new Date(referenceDate).getFullYear();
    this.month = this.month || referenceDate.toLocaleString("en-US", { month: "short" });
  }
  next();
});

module.exports = mongoose.model("SocialRequest", SocialRequestSchema);
