const mongoose = require('mongoose');

const SellerSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  contactPerson: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  industry: {
    type: String,
    required: true,
  },
  products: [{
    type: String,
  }],
  certifications: [{
    type: String,
  }],
  // Simple package type field like in customer follow-up page
  packageType: {
    type: String,
    required: false,
  },
  // Add packages field for tracking purchased packages
  packages: [{
    packageName: String,
    packageType: String,
    purchaseDate: Date,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Cancelled'],
      default: 'Active'
    }
  }],
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Seller', SellerSchema);