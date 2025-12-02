const InventoryItem = require('../models/InventoryItem');
const Order = require('../models/Order');
const InventoryMovement = require('../models/InventoryMovement');
const Demand = require('../models/Demand');
const Followup = require('../models/Followup');

// Reserve stock for a followup: allocate from on-hand quantity first, then bufferStock.
// Route: POST /api/followups/:id/reserve
const reserveForFollowup = async (req, res) => {
  const { id } = req.params; // followup id
  const items = req.body.items || [];
  const userId = req.user && req.user._id;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items provided' });
  }

  try {
    const followup = await Followup.findById(id);
    if (!followup) return res.status(404).json({ message: 'Followup not found' });

    const orderLines = [];
    const demandLines = [];

    for (const it of items) {
      const itemId = it.id || it._id || it.inventoryId;
      const requested = Number(it.qty) || 0;
      if (!itemId || requested <= 0) continue;

      const inv = await InventoryItem.findById(itemId);
      if (!inv) {
        // item does not exist, mark as unfulfilled
        demandLines.push({ item: itemId, requestedQty: requested, unfulfilledQty: requested });
        orderLines.push({ item: itemId, requestedQty: requested, allocatedQty: 0, allocations: [] });
        continue;
      }

      let remaining = requested;
      const allocations = [];

      const availableStock = Math.max((inv.quantity || 0) - (inv.reservedQuantity || 0), 0);
      const takeFromStock = Math.min(availableStock, remaining);
      if (takeFromStock > 0) {
        // increase reservedQuantity (reserve from on-hand)
        inv.reservedQuantity = (inv.reservedQuantity || 0) + takeFromStock;
        allocations.push({ source: 'stock', amount: takeFromStock });
        remaining -= takeFromStock;
        // record movement as reservation
        try { await InventoryMovement.create({ item: inv._id, type: 'reserve_stock', amount: takeFromStock, before: { quantity: inv.quantity, reservedQuantity: inv.reservedQuantity - takeFromStock }, after: { quantity: inv.quantity, reservedQuantity: inv.reservedQuantity }, performedBy: userId }); } catch (e) { console.error('movement record failed', e); }
      }

      if (remaining > 0) {
        // try bufferStock
        const takeFromBuffer = Math.min(inv.bufferStock || 0, remaining);
        if (takeFromBuffer > 0) {
          // move from bufferStock into reservedBuffer (and reduce bufferStock)
          inv.bufferStock = (inv.bufferStock || 0) - takeFromBuffer;
          inv.reservedBuffer = (inv.reservedBuffer || 0) + takeFromBuffer;
          allocations.push({ source: 'buffer', amount: takeFromBuffer });
          remaining -= takeFromBuffer;
          try { await InventoryMovement.create({ item: inv._id, type: 'reserve_buffer', amount: takeFromBuffer, before: { bufferStock: inv.bufferStock + takeFromBuffer, reservedBuffer: inv.reservedBuffer - takeFromBuffer }, after: { bufferStock: inv.bufferStock, reservedBuffer: inv.reservedBuffer }, performedBy: userId }); } catch (e) { console.error('movement record failed', e); }
        }
      }

      const allocated = requested - remaining;
      if (remaining > 0) {
        // unfulfilled portion
        demandLines.push({ item: inv._id, requestedQty: requested, unfulfilledQty: remaining });
      }

      // save inventory changes
      await inv.save();

      orderLines.push({ item: inv._id, requestedQty: requested, allocatedQty: allocated, allocations });
    }

    // create Order
    const orderStatus = demandLines.length === 0 ? 'fulfilled' : (orderLines.some(l => l.allocatedQty > 0) ? 'partial' : 'pending');
    const order = new Order({ followup: followup._id, createdBy: userId, status: orderStatus, lines: orderLines });
    const savedOrder = await order.save();

    // create Demand if needed
    let savedDemand = null;
    if (demandLines.length > 0) {
      const demand = new Demand({ followup: followup._id, createdBy: userId, lines: demandLines, note: req.body.note || '' });
      savedDemand = await demand.save();
    }

    return res.status(201).json({ order: savedOrder, demand: savedDemand });
  } catch (err) {
    console.error('Error reserving items:', err);
    return res.status(500).json({ message: 'Failed to reserve items', error: err.message });
  }
};

// Simulate reservation without persisting changes — useful for previews
const simulateReserveForFollowup = async (req, res) => {
  const { id } = req.params; // followup id
  const items = req.body.items || [];

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items provided' });
  }

  try {
    const results = [];
    for (const it of items) {
      const itemId = it.id || it._id || it.inventoryId;
      const requested = Number(it.qty) || 0;
      if (!itemId || requested <= 0) continue;

      const inv = await InventoryItem.findById(itemId);
      if (!inv) {
        results.push({ item: itemId, requestedQty: requested, allocatedQty: 0, allocations: [], unfulfilled: requested });
        continue;
      }

      let remaining = requested;
      const allocations = [];
      const availableStock = Math.max((inv.quantity || 0) - (inv.reservedQuantity || 0), 0);
      const takeFromStock = Math.min(availableStock, remaining);
      if (takeFromStock > 0) {
        allocations.push({ source: 'stock', amount: takeFromStock });
        remaining -= takeFromStock;
      }
      if (remaining > 0) {
        const takeFromBuffer = Math.min(inv.bufferStock || 0, remaining);
        if (takeFromBuffer > 0) {
          allocations.push({ source: 'buffer', amount: takeFromBuffer });
          remaining -= takeFromBuffer;
        }
      }

      const allocated = requested - remaining;
      results.push({ item: inv._id, requestedQty: requested, allocatedQty: allocated, allocations, unfulfilled: remaining });
    }

    return res.json({ preview: results });
  } catch (err) {
    console.error('Error simulating reservation:', err);
    return res.status(500).json({ message: 'Failed to simulate reservation', error: err.message });
  }
};

// Fulfill an existing order: convert reservations into deliveries
const fulfillOrder = async (req, res) => {
  const { followupId, orderId } = req.params;
  const userId = req.user && req.user._id;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const results = [];
    for (const line of order.lines) {
      const inv = await InventoryItem.findById(line.item);
      if (!inv) {
        results.push({ line, status: 'item_missing' });
        continue;
      }

      // apply allocations
      for (const alloc of line.allocations || []) {
        const amount = alloc.amount || 0;
        const before = { quantity: inv.quantity, reservedQuantity: inv.reservedQuantity, bufferStock: inv.bufferStock, reservedBuffer: inv.reservedBuffer };
        if (alloc.source === 'stock') {
          inv.quantity = Math.max((inv.quantity || 0) - amount, 0);
          inv.reservedQuantity = Math.max((inv.reservedQuantity || 0) - amount, 0);
          try { await InventoryMovement.create({ item: inv._id, type: 'deliver', amount, before, after: { quantity: inv.quantity, reservedQuantity: inv.reservedQuantity }, performedBy: userId }); } catch (e) { console.error('movement record failed', e); }
        } else if (alloc.source === 'buffer') {
          // buffer was already decremented at reservation time and reservedBuffer incremented.
          inv.reservedBuffer = Math.max((inv.reservedBuffer || 0) - amount, 0);
          try { await InventoryMovement.create({ item: inv._id, type: 'deliver', amount, before, after: { bufferStock: inv.bufferStock, reservedBuffer: inv.reservedBuffer }, performedBy: userId }); } catch (e) { console.error('movement record failed', e); }
        }
        await inv.save();
      }

      results.push({ line, status: 'fulfilled' });
    }

    // update order status
    order.status = 'fulfilled';
    await order.save();

    // link to followup if provided
    if (followupId) {
      const followup = await Followup.findById(followupId);
      if (followup) {
        followup.orderProcessed = true;
        await followup.save();
      }
    }

    return res.json({ order, results });
  } catch (err) {
    console.error('Error fulfilling order:', err);
    return res.status(500).json({ message: 'Failed to fulfill order', error: err.message });
  }
};

// List orders (simple listing with populated lines)
const listOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('followup').populate('createdBy').populate('lines.item');
    res.json(orders);
  } catch (err) {
    console.error('Error listing orders:', err);
    res.status(500).json({ message: 'Failed to list orders', error: err.message });
  }
};

module.exports = {
  reserveForFollowup,
  simulateReserveForFollowup,
  fulfillOrder,
  listOrders
};
