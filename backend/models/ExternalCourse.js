const mongoose = require('mongoose');

const externalCourseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  overview: { type: String, default: '' },
  price: { type: Number, default: 0 },
  category: { type: String, default: 'External' },
  level: { type: String, default: 'Beginner' },
  duration: { type: String, default: '' },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true, collection: 'externalcourses' });

module.exports = mongoose.model('ExternalCourse', externalCourseSchema);
