const InventoryItem = require('../models/InventoryItem');
const InventoryMovement = require('../models/InventoryMovement');

exports.getAllInventory = async (req, res) => {
  try {
    const items = await InventoryItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ message: 'Failed to fetch inventory' });
  }
};

exports.createInventoryItem = async (req, res) => {
  try {
    const { name, sku, description, price, quantity, bufferStock } = req.body;
    const item = new InventoryItem({ name, sku, description, price, quantity, bufferStock, createdBy: req.user && req.user._id });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error('Error creating inventory item:', err);
    res.status(500).json({ message: 'Failed to create inventory item' });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const item = await InventoryItem.findByIdAndUpdate(id, updates, { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error('Error updating inventory item:', err);
    res.status(500).json({ message: 'Failed to update inventory item' });
  }
};

// Deduct stock when a delivery is made (reduce `quantity` by amount)
exports.deliverStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const qty = Number(amount) || 0;
    if (qty <= 0) return res.status(400).json({ message: 'Invalid amount' });
    const item = await InventoryItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.quantity < qty) return res.status(400).json({ message: 'Insufficient stock' });
    const before = { quantity: item.quantity, bufferStock: item.bufferStock };
    item.quantity = item.quantity - qty;
    await item.save();
    const after = { quantity: item.quantity, bufferStock: item.bufferStock };
    // record movement
    try { await InventoryMovement.create({ item: item._id, type: 'deliver', amount: qty, before, after, performedBy: req.user && req.user._id }); } catch (e) { console.error('Failed to record movement', e); }
    res.json(item);
  } catch (err) {
    console.error('Error delivering stock:', err);
    res.status(500).json({ message: 'Failed to deliver stock' });
  }
};

// Increase bufferStock (e.g., reserved/incoming stock)
exports.addBufferStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const qty = Number(amount) || 0;
    if (qty <= 0) return res.status(400).json({ message: 'Invalid amount' });
    const item = await InventoryItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const before = { bufferStock: item.bufferStock ?? 0 };
    item.bufferStock = (item.bufferStock || 0) + qty;
    await item.save();
    const after = { bufferStock: item.bufferStock };
    try { await InventoryMovement.create({ item: item._id, type: 'add-buffer', amount: qty, before, after, performedBy: req.user && req.user._id }); } catch (e) { console.error('Failed to record movement', e); }
    res.json(item);
  } catch (err) {
    console.error('Error adding buffer stock:', err);
    res.status(500).json({ message: 'Failed to add buffer stock' });
  }
};

// Transfer stock from bufferStock into usable quantity
exports.transferBufferToStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const qty = Number(amount) || 0;
    if (qty <= 0) return res.status(400).json({ message: 'Invalid amount' });
    const item = await InventoryItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if ((item.bufferStock || 0) < qty) return res.status(400).json({ message: 'Insufficient buffer stock' });
    const before = { bufferStock: item.bufferStock ?? 0, quantity: item.quantity ?? 0 };
    item.bufferStock = item.bufferStock - qty;
    item.quantity = (item.quantity || 0) + qty;
    await item.save();
    const after = { bufferStock: item.bufferStock, quantity: item.quantity };
    try { await InventoryMovement.create({ item: item._id, type: 'transfer', amount: qty, before, after, performedBy: req.user && req.user._id }); } catch (e) { console.error('Failed to record movement', e); }
    res.json(item);
  } catch (err) {
    console.error('Error transferring buffer to stock:', err);
    res.status(500).json({ message: 'Failed to transfer buffer to stock' });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await InventoryItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    res.status(500).json({ message: 'Failed to delete inventory item' });
  }
};
