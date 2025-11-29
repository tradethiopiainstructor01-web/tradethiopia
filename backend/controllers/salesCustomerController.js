const SalesCustomer = require('../models/SalesCustomer');
const User = require('../models/user.model');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get all customers for logged in agent
// @route   GET /api/sales-customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  const { followupStatus } = req.query;

  // Default: limit to the requesting agent only for sales role.
  const filter = {};
  const role = (req.user?.role || '').toLowerCase();
  if (role === 'sales') {
    filter.agentId = req.user.id;
  }

  if (followupStatus) {
    // Case-insensitive match to handle variations like "completed" vs "Completed"
    filter.followupStatus = new RegExp(`^${followupStatus}$`, "i");
  }
  // Fetch customers
  const customers = await SalesCustomer.find(filter).lean();

  // Attach agent names where available
  const agentIds = [...new Set(customers.map((c) => c.agentId).filter(Boolean))];

  // Safely convert string ids to ObjectIds, skipping invalid ones
  const objectIds = agentIds
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const agents = objectIds.length
    ? await User.find({ _id: { $in: objectIds } })
        .select('username fullName email')
        .lean()
    : [];
  const agentMap = agents.reduce((acc, user) => {
    const display = user.username || user.fullName || user.email || 'Unknown agent';
    acc[user._id.toString()] = {
      display,
      username: user.username || '',
    };
    return acc;
  }, {});

  const enriched = customers.map((c) => {
    const agentInfo = agentMap[c.agentId];
    return {
      ...c,
      agentName: agentInfo?.display || (mongoose.isValidObjectId(c.agentId) ? c.agentId : 'Unknown agent'),
      agentUsername: agentInfo?.username || '',
    };
  });

  res.json(enriched);
});

// @desc    Get customer by ID
// @route   GET /api/sales-customers/:id
// @access  Private
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await SalesCustomer.findById(req.params.id);

  if (customer && customer.agentId.toString() === req.user.id.toString()) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

// @desc    Create new customer
// @route   POST /api/sales-customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
  const {
    customerName,
    contactTitle,
    phone,
    callStatus,
    followupStatus,
    schedulePreference,
    email,
    note,
    supervisorComment
  } = req.body;

  const customer = new SalesCustomer({
    agentId: req.user.id,
    customerName,
    contactTitle,
    phone,
    callStatus,
    followupStatus,
    schedulePreference,
    email,
    note,
    supervisorComment
  });

  const createdCustomer = await customer.save();
  res.status(201).json(createdCustomer);
});

// @desc    Update customer
// @route   PUT /api/sales-customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  const {
    customerName,
    contactTitle,
    phone,
    callStatus,
    followupStatus,
    schedulePreference,
    email,
    note,
    supervisorComment
  } = req.body;

  const customer = await SalesCustomer.findById(req.params.id);

  if (customer && customer.agentId.toString() === req.user.id.toString()) {
    customer.customerName = customerName || customer.customerName;
    customer.contactTitle = contactTitle || customer.contactTitle;
    customer.phone = phone || customer.phone;
    customer.callStatus = callStatus || customer.callStatus;
    customer.followupStatus = followupStatus || customer.followupStatus;
    customer.schedulePreference = schedulePreference || customer.schedulePreference;
    customer.email = email || customer.email;
    customer.note = note || customer.note;
    customer.supervisorComment = supervisorComment || customer.supervisorComment;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

// @desc    Delete customer
// @route   DELETE /api/sales-customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await SalesCustomer.findById(req.params.id);

  if (customer && customer.agentId.toString() === req.user.id.toString()) {
    await customer.remove();
    res.json({ message: 'Customer removed' });
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

// @desc    Get sales stats for logged in agent
// @route   GET /api/sales-customers/stats
// @access  Private
const getSalesStats = asyncHandler(async (req, res) => {
  try {
    // Total customers for this agent
    const total = await SalesCustomer.countDocuments({ agentId: req.user.id });
    
    // New customers (created in the last 30 days)
    const newCount = await SalesCustomer.countDocuments({
      agentId: req.user.id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    // Active customers (called in the last 30 days)
    const activeCount = await SalesCustomer.countDocuments({
      agentId: req.user.id,
      lastCalled: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    // Completed deals (followupStatus = 'Completed')
    const completedDeals = await SalesCustomer.countDocuments({
      agentId: req.user.id,
      followupStatus: 'Completed'
    });
    
    // Called customers (callStatus = 'Called')
    const calledCustomers = await SalesCustomer.countDocuments({
      agentId: req.user.id,
      callStatus: 'Called'
    });
    
    res.json({
      total,
      new: newCount,
      active: activeCount,
      completedDeals,
      calledCustomers
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching sales stats", 
      error: error.message 
    });
  }
});

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getSalesStats
};
