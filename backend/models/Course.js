const mongoose = require('mongoose');

const courseSlideSchema = new mongoose.Schema({
  slideNumber: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, default: '' },
  materialUrl: { type: String, default: '' },
  imageFileId: { type: String, default: '' },
  imageUrl: { type: String, default: '' }
}, { _id: true, timestamps: true });

const courseQuizQuestionSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  question: { type: String, required: true, trim: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: Number, default: 0 },
  explanation: { type: String, default: '' }
}, { _id: true, timestamps: true });

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  overview: { type: String, default: '' },
  price: { type: Number, default: 0 },
  passPercentage: { type: Number, default: 75 },
  category: { type: String, default: 'General' },
  level: { type: String, default: 'Beginner' },
  duration: { type: String, default: '' },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  draftSavedAt: { type: Date, default: null },
  publishedAt: { type: Date, default: null },
  slides: { type: [courseSlideSchema], default: [] },
  quizQuestions: { type: [courseQuizQuestionSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
