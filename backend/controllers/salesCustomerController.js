const SalesCustomer = require('../models/SalesCustomer');
const asyncHandler = require('express-async-handler');

// @desc    Get all customers for logged in agent
// @route   GET /api/sales-customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  const customers = await SalesCustomer.find({ agentId: req.user.id });
  res.json(customers);
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
    supervisorComment,
    courseName,
    courseId,
    coursePrice,
    commission
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
    supervisorComment,
    courseName: courseName || contactTitle, // align course name with contact title if missing
    courseId,
    coursePrice,
    commission
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
    supervisorComment,
    courseName,
    courseId,
    coursePrice,
    commission
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
    customer.courseName = courseName || customer.courseName || contactTitle || customer.contactTitle;
    customer.courseId = courseId || customer.courseId;
    customer.coursePrice = coursePrice || customer.coursePrice;
    customer.commission = commission || customer.commission;

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
