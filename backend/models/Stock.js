const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Cost price for profit calculation
  cost: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // Buffer stock for items on their way being imported
  bufferStock: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  // Reserved items from buffer stock
  reservedBuffer: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  supplier: {
    type: String,
    required: false,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
stockSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Stock', stockSchema);