const mongoose = require('mongoose');

const InventoryMovementSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  type: { type: String, enum: ['deliver','add-buffer','transfer','reserve_stock','reserve_buffer'], required: true },
  amount: { type: Number, required: true },
  before: { type: Object },
  after: { type: Object },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InventoryMovement', InventoryMovementSchema);
