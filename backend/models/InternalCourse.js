const mongoose = require('mongoose');

const internalCourseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  overview: { type: String, default: '' },
  price: { type: Number, default: 0 },
  category: { type: String, default: 'Internal' },
  level: { type: String, default: 'Beginner' },
  duration: { type: String, default: '' },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true, collection: 'internalcourses' });

module.exports = mongoose.model('InternalCourse', internalCourseSchema);
