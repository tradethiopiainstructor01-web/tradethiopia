const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String },
  description: { type: String },
  price: { type: Number, required: true, default: 0 },
  quantity: { type: Number, required: true, default: 0 },
  // bufferStock: reserved / incoming stock that isn't available for sale yet
  bufferStock: { type: Number, required: true, default: 0 },
  // reservedQuantity: how many units are reserved for orders (not yet fulfilled)
  reservedQuantity: { type: Number, required: true, default: 0 },
  // reservedBuffer: how many units from buffer have been reserved
  reservedBuffer: { type: Number, required: true, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

InventoryItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);
