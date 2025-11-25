const mongoose = require('mongoose');

const SavedMatchSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
  },
  buyerName: {
    type: String,
    required: true,
  },
  sellerName: {
    type: String,
    required: true,
  },
  matchingProducts: [{
    type: String,
  }],
  matchingCriteria: [{
    type: String,
  }],
  matchReasons: [{
    type: String,
  }],
  score: {
    type: Number,
    required: true,
  },
  industryMatch: {
    type: Boolean,
    default: false,
  },
  countryMatch: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    default: '',
  },
  savedBy: {
    type: String, // Could be user ID or email
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Active', 'Archived', 'Deleted'],
    default: 'Active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SavedMatch', SavedMatchSchema);