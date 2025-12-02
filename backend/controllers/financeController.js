const InventoryItem = require('../models/InventoryItem');

exports.getMetrics = async (req, res) => {
  try {
    // Compute stock value: sum(price * quantity)
    const items = await InventoryItem.find({});
    const stockValue = items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 0)), 0);
    const totalProducts = items.length;
    const totalStockItems = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

    // For now, revenue and outstanding invoices are placeholders until a payments/invoices model exists
    const totalRevenue = 0;
    const outstandingInvoices = 0;

    res.json({
      totalRevenue,
      outstandingInvoices,
      stockValue,
      totalProducts,
      totalStockItems
    });
  } catch (err) {
    console.error('Error fetching finance metrics:', err);
    res.status(500).json({ message: 'Failed to fetch finance metrics' });
  }
};
