const OrderCustomer = require('../models/OrderCustomer');
const asyncHandler = require('express-async-handler');

// @desc    Get all order customers
// @route   GET /api/order-customers
// @access  Private
const getOrderCustomers = asyncHandler(async (req, res) => {
  try {
    const orderCustomers = await OrderCustomer.find({}).sort({ createdAt: -1 });
    res.json(orderCustomers);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching order customers", 
      error: error.message 
    });
  }
});

// @desc    Get order customer by ID
// @route   GET /api/order-customers/:id
// @access  Private
const getOrderCustomerById = asyncHandler(async (req, res) => {
  try {
    const orderCustomer = await OrderCustomer.findById(req.params.id);
    
    if (orderCustomer) {
      res.json(orderCustomer);
    } else {
      res.status(404).json({ message: 'Order customer not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching order customer", 
      error: error.message 
    });
  }
});

// @desc    Create new order customer
// @route   POST /api/order-customers
// @access  Private
const createOrderCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address, company, taxId, notes } = req.body;

  try {
    // Only include fields that are provided
    const customerData = { name };
    if (email) customerData.email = email;
    if (phone) customerData.phone = phone;
    if (address) customerData.address = address;
    if (company) customerData.company = company;
    if (taxId) customerData.taxId = taxId;
    if (notes) customerData.notes = notes;

    const orderCustomer = new OrderCustomer(customerData);

    const createdOrderCustomer = await orderCustomer.save();
    res.status(201).json(createdOrderCustomer);
  } catch (error) {
    res.status(500).json({ 
      message: "Error creating order customer", 
      error: error.message 
    });
  }
});

// @desc    Update order customer
// @route   PUT /api/order-customers/:id
// @access  Private
const updateOrderCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address, company, taxId, notes } = req.body;

  try {
    const orderCustomer = await OrderCustomer.findById(req.params.id);

    if (orderCustomer) {
      // Only update fields that are provided
      if (name !== undefined) orderCustomer.name = name;
      if (email !== undefined) orderCustomer.email = email;
      if (phone !== undefined) orderCustomer.phone = phone;
      if (address !== undefined) orderCustomer.address = address;
      if (company !== undefined) orderCustomer.company = company;
      if (taxId !== undefined) orderCustomer.taxId = taxId;
      if (notes !== undefined) orderCustomer.notes = notes;

      const updatedOrderCustomer = await orderCustomer.save();
      res.json(updatedOrderCustomer);
    } else {
      res.status(404).json({ message: 'Order customer not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating order customer", 
      error: error.message 
    });
  }
});

// @desc    Delete order customer
// @route   DELETE /api/order-customers/:id
// @access  Private
const deleteOrderCustomer = asyncHandler(async (req, res) => {
  try {
    const orderCustomer = await OrderCustomer.findById(req.params.id);

    if (orderCustomer) {
      await orderCustomer.remove();
      res.json({ message: 'Order customer removed' });
    } else {
      res.status(404).json({ message: 'Order customer not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error deleting order customer", 
      error: error.message 
    });
  }
});

module.exports = {
  getOrderCustomers,
  getOrderCustomerById,
  createOrderCustomer,
  updateOrderCustomer,
  deleteOrderCustomer
};