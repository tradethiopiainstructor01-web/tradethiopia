const InventoryMovement = require('../models/InventoryMovement');

exports.getMovementsByItem = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await InventoryMovement.find({ item: id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('Error fetching movements:', err);
    res.status(500).json({ message: 'Failed to fetch movements' });
  }
};

// optional endpoint to create movement manually (not used by inventory controller currently)
exports.createMovement = async (req, res) => {
  try {
    const { item, type, amount, before, after } = req.body;
    const m = new InventoryMovement({ item, type, amount, before, after, performedBy: req.user && req.user._id });
    await m.save();
    res.status(201).json(m);
  } catch (err) {
    console.error('Error creating movement:', err);
    res.status(500).json({ message: 'Failed to create movement' });
  }
};
