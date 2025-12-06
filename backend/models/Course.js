const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  category: { type: String, default: 'General' },
  level: { type: String, default: 'Beginner' },
  duration: { type: String, default: '' },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
