const Order = require('../models/Order');
const Stock = require('../models/Stock');
const SalesCustomer = require('../models/SalesCustomer');
const asyncHandler = require('express-async-handler');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('customerId', 'customerName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching orders", 
      error: error.message 
    });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'customerName');
    
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching order", 
      error: error.message 
    });
  }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { customerId, customerName, items, notes } = req.body;

  try {
    // Validate customer exists
    const customer = await SalesCustomer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate stock items and calculate totals
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const stockItem = await Stock.findById(item.stockItemId);
      if (!stockItem) {
        return res.status(404).json({ message: `Stock item with ID ${item.stockItemId} not found` });
      }
      
      // Check if sufficient quantity is available
      if (stockItem.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for ${stockItem.name}. Available: ${stockItem.quantity}, Requested: ${item.quantity}` 
        });
      }
      
      const orderItem = {
        stockItemId: stockItem._id,
        name: stockItem.name,
        sku: stockItem.sku,
        quantity: item.quantity,
        unitPrice: stockItem.price,
        totalPrice: stockItem.price * item.quantity
      };
      
      orderItems.push(orderItem);
      totalAmount += orderItem.totalPrice;
    }

    const order = new Order({
      customerId,
      customerName,
      items: orderItems,
      totalAmount,
      notes,
      createdBy: req.user.id // Assuming user ID is available in req.user
    });

    const createdOrder = await order.save();
    
    // Populate the customer details before sending response
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('customerId', 'customerName');
    
    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ 
      message: "Error creating order", 
      error: error.message 
    });
  }
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = asyncHandler(async (req, res) => {
  const { status, notes, confirmedBy } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      // Only allow updating status, notes, and confirmation details
      if (status) order.status = status;
      if (notes !== undefined) order.notes = notes;
      if (confirmedBy) {
        order.confirmedBy = confirmedBy;
        order.confirmedAt = Date.now();
      }

      const updatedOrder = await order.save();
      
      // Populate the customer details before sending response
      const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('customerId', 'customerName');
      
      res.json(populatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating order", 
      error: error.message 
    });
  }
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      await order.remove();
      res.json({ message: 'Order removed' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error deleting order", 
      error: error.message 
    });
  }
});

// @desc    Get orders by customer ID
// @route   GET /api/orders/customer/:customerId
// @access  Private
const getOrdersByCustomerId = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId })
      .populate('customerId', 'customerName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching customer orders", 
      error: error.message 
    });
  }
});

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
const getOrderStats = asyncHandler(async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'Confirmed' });
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
    
    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    
    res.json({
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching order stats", 
      error: error.message 
    });
  }
});

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByCustomerId,
  getOrderStats
};