const mongoose = require('mongoose');

const costSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['training', 'rental', 'utility', 'other'],
    lowercase: true,
    trim: true
  },
  subCategory: { type: String, trim: true, default: '' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'ETB', trim: true },
  department: { type: String, default: 'General', trim: true },
  departmentCode: { type: String, default: '', trim: true },
  description: { type: String, default: '' },
  incurredOn: { type: Date, default: Date.now },
  receiptUrl: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'approved'
  },
  calculatedFields: {
    tax: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cost', costSchema);
