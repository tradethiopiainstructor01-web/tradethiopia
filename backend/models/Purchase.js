const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    default: 'pieces'
  },
  declarationValue: {
    type: Number,
    default: 0
  },
  totalDeclarationValue: {
    type: Number,
    default: 0
  },
  weightedAverage: {
    type: Number,
    default: 0
  },
  customValue: {
    type: Number,
    default: 0
  },
  otherCost: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  unitCost: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  stockItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  }
});

const purchaseSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  supplierContact: {
    type: String,
    default: ''
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  currency: {
    type: String,
    default: 'ETB'
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'received', 'cancelled'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  notes: {
    type: String,
    default: ''
  },
  totals: {
    totalItems: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalDeclarationValue: { type: Number, default: 0 },
    totalCustomValue: { type: Number, default: 0 },
    totalOtherCost: { type: Number, default: 0 },
    totalProfitMargin: { type: Number, default: 0 },
    totalSellingPrice: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 }
  },
  items: {
    type: [purchaseItemSchema],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Purchase', purchaseSchema);
