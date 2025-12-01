const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  stockItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesCustomer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String
  },
  createdBy: {
    type: String,
    required: true
  },
  confirmedBy: {
    type: String
  },
  confirmedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((total, item) => total + item.totalPrice, 0);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);