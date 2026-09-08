const mongoose = require('mongoose');

const PackageSaleSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  contactPerson: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  packageName: {
    type: String,
    default: ''
  },
  packageType: {
    type: String,
    default: ''
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Expired', 'Cancelled'],
    default: 'Active'
  },
  callStatus: {
    type: String,
    enum: ['Not Called', 'Called', 'Busy', 'No Answer', 'Callback', '2x Called'],
    default: 'Not Called'
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  agentName: {
    type: String,
    default: ''
  },
  customerType: {
    type: String,
    default: 'PackageSales'
  },
  notes: {
    type: String,
    default: ''
  },
  market: {
    type: String,
    enum: ['Local', 'International'],
    default: 'Local'
  },
  packagePrice: {
    type: Number,
    default: 0
  },
  packageValue: {
    type: Number,
    default: 0
  },
  commissionRate: {
    type: Number,
    default: 0.075
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  firstCommissionAmount: {
    type: Number,
    default: 0
  },
  secondCommissionAmount: {
    type: Number,
    default: 0
  },
  firstCommissionPaid: {
    type: Boolean,
    default: false
  },
  secondCommissionPaid: {
    type: Boolean,
    default: false
  },
  firstCommissionPaidAt: {
    type: Date
  },
  secondCommissionPaidAt: {
    type: Date
  },
  payrollMonth: {
    type: String,
    default: ''
  },
  dealHistory: [
    {
      stage: { type: String, default: 'deal_created' },
      title: { type: String, default: 'Deal Created' },
      description: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now },
      updatedBy: { type: String, default: '' }
    }
  ]
}, {
  timestamps: true
});

PackageSaleSchema.add({
  firstCommissionApproved: {
    type: Boolean,
    default: false
  },
  secondCommissionApproved: {
    type: Boolean,
    default: false
  },
  commissionApproved: {
    type: Boolean,
    default: false
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('PackageSale', PackageSaleSchema);
