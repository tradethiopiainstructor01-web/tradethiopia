const mongoose = require('mongoose');

const OrderLineSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  requestedQty: { type: Number, required: true, default: 0 },
  allocatedQty: { type: Number, required: true, default: 0 },
  allocations: [
    {
      source: { type: String, enum: ['stock', 'buffer'], required: true },
      amount: { type: Number, required: true }
    }
  ]
});

const OrderSchema = new mongoose.Schema({
  followup: { type: mongoose.Schema.Types.ObjectId, ref: 'Followup' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'partial', 'fulfilled', 'cancelled'], default: 'pending' },
  lines: [OrderLineSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

OrderSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Order', OrderSchema);
