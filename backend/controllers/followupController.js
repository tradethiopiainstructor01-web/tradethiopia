const User = require("../models/user.model.js");
const Followup = require("../models/Followup.js");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

// @desc    Get report for customer service users
// @route   GET /api/followups/report
// @access  Public
const getCustomerReport = async (req, res) => {
  try {
    // Get all followups, not just recent ones
    const followups = await Followup.find().lean();

    // Get all users (creators)
    const users = await User.find().lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    // Supervisor view: get all customer service users and show their points and rating from user model
    const creatorPerformance = users
      .filter(u => u.role === "customerservice")
      .map(u => ({
        username: u.username,
        points: typeof u.points === "number" ? u.points : 0,
        rating: typeof u.rating === "number" ? u.rating : 0,
      }))
      .sort((a, b) => b.points - a.points);

    // Process all followups to create the report
    const report = followups.map(fu => {
      let creator = null;
      // createdBy may be user _id or username, so check both
      const creatorId = fu.createdBy ? fu.createdBy.toString() : null;
      // Try to find by _id
      if (creatorId && userMap[creatorId]) {
        const u = userMap[creatorId];
        if (u.role === "customerservice") {
          creator = {
            username: u.username,
            points: typeof u.points === "number" ? u.points : 0,
            rating: typeof u.rating === "number" ? u.rating : 0,
          };
        }
      } else if (creatorId) {
        // Try to find by username (if createdBy is username)
        const u = users.find(u => u.username === creatorId && u.role === "customerservice");
        if (u) {
          creator = {
            username: u.username,
            points: typeof u.points === "number" ? u.points : 0,
            rating: typeof u.rating === "number" ? u.rating : 0,
          };
        }
      }
      
      // Calculate daily progress based on lastCalled date
      let dailyProgress = 0;
      if (fu.lastCalled) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        if (fu.lastCalled >= oneWeekAgo) {
          dailyProgress = Math.floor(Math.random() * 10 + 1);
        }
      }
      
      return {
        clientName: fu.clientName,
        notes: fu.notes && fu.notes.length > 0 ? fu.notes : [],
        lastCalled: fu.lastCalled ? fu.lastCalled : null,
        creator,
        dailyProgress: dailyProgress,
        performanceRating: creator && creator.rating ? creator.rating : 0
      };
    });

    res.json({ report, creatorPerformance });
  } catch (error) {
    res.status(500).json({ message: "Error generating report", error: error.message });
  }
};

// @desc    Add a new follow-up
// @route   POST /api/followups
// @access  Public
const createFollowup = async (req, res) => {
  const {
    clientName,
    companyName,
    phoneNumber,
    email,
    packageType,
    service,
    serviceProvided,
    serviceNotProvided,
    deadline,
    createdBy,
    followupStatus,
    schedulePreference,
    supervisorComment,
  } = req.body;

  try {
    const followup = new Followup({
      clientName,
      companyName,
      phoneNumber,
      email,
      packageType,
      service,
      serviceProvided,
      serviceNotProvided,
      deadline,
      followupStatus,
      schedulePreference,
      supervisorComment,
      createdBy,
    });

    const savedFollowup = await followup.save();
    res.status(201).json(savedFollowup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all follow-ups
// @route   GET /api/followups
// @access  Public
const getFollowups = async (req, res) => {
  try {
    const followups = await Followup.find();
    res.status(200).json(followups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a follow-up by ID
// @route   GET /api/followups/:id
// @access  Public
const getFollowupById = async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    res.status(200).json(followup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a follow-up
// @route   PUT /api/followups/:id
// @access  Public
const updateFollowup = async (req, res) => {
  try {
    const followup = await Followup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!followup) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    res.status(200).json(followup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a follow-up
// @route   DELETE /api/followups/:id
// @access  Public
const deleteFollowup = async (req, res) => {
  try {
    const followup = await Followup.findByIdAndDelete(req.params.id);
    if (!followup) {
      return res.status(404).json({ message: "Follow-up not found" });
    }
    res.status(200).json({ message: "Follow-up deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send bulk email to follow-ups
// @route   POST /api/followups/bulk-email
// @access  Public (protect in middleware if required)
const sendBulkEmail = async (req, res) => {
  const { ids = [], subject, body, sender = "System", senderEmail } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "No follow-up ids provided" });
  }
  if (!subject || !body) {
    return res.status(400).json({ message: "Subject and body are required" });
  }

  const transportConfig = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  if (!transportConfig.host || !transportConfig.auth.user || !transportConfig.auth.pass) {
    return res.status(500).json({ message: "SMTP configuration missing" });
  }

  const transporter = nodemailer.createTransport(transportConfig);

  try {
    const followups = await Followup.find({ _id: { $in: ids } });
    const results = [];

    for (const f of followups) {
      if (!f.email || f.email === "none") {
        results.push({ id: f._id, status: "skipped", reason: "No email" });
        continue;
      }
      try {
        await transporter.sendMail({
          from: senderEmail
            ? `${senderEmail} via Followup <${transportConfig.auth.user}>`
            : transportConfig.auth.user,
          replyTo: senderEmail || transportConfig.auth.user,
          to: f.email,
          subject,
          text: body.replaceAll("{{clientName}}", f.clientName || ""),
        });
        f.messages.push({ sender, body: `[BULK EMAIL] ${subject}\n\n${body}` });
        await f.save();
        results.push({ id: f._id, status: "sent" });
      } catch (err) {
        results.push({ id: f._id, status: "failed", reason: err.message });
      }
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error("Bulk email failed", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for a follow-up
// @route   GET /api/followups/:id/messages
const getMessages = async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id).select("messages clientName email");
    if (!followup) return res.status(404).json({ message: "Follow-up not found" });
    res.status(200).json(followup.messages || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a message to a follow-up (agent note to customer)
// @route   POST /api/followups/:id/messages
const addMessage = async (req, res) => {
  const { body, sender = "Agent" } = req.body || {};
  if (!body) return res.status(400).json({ message: "Message body is required" });
  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) return res.status(404).json({ message: "Follow-up not found" });
    followup.messages.push({ sender, body });
    await followup.save();
    res.status(201).json(followup.messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Increment contact attempt counters
// @route   PATCH /api/followups/:id/attempts
// @access  Public
const incrementAttempts = async (req, res) => {
  const { type } = req.body; // call | message | email
  const allowed = {
    call: "call_count",
    message: "message_count",
    email: "email_count",
  };
  const field = allowed[type];
  if (!field) {
    return res.status(400).json({ message: "Invalid attempt type" });
  }
  try {
    const updated = await Followup.findByIdAndUpdate(
      req.params.id,
      { $inc: { [field]: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Follow-up not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add communication log
// @route   POST /api/followups/:id/communications
// @access  Public
const addCommunicationLog = async (req, res) => {
  const { channel, note } = req.body;
  const validChannels = ["Phone call", "WhatsApp", "Telegram", "Email", "In-person visit"];
  if (!validChannels.includes(channel)) {
    return res.status(400).json({ message: "Invalid channel" });
  }
  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) return res.status(404).json({ message: "Follow-up not found" });

    followup.communications.push({ channel, note });
    const saved = await followup.save();
    res.status(200).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update priority
// @route   PATCH /api/followups/:id/priority
// @access  Public
const updatePriority = async (req, res) => {
  const { priority } = req.body;
  const valid = ["High", "Medium", "Low"];
  if (!valid.includes(priority)) {
    return res.status(400).json({ message: "Invalid priority" });
  }
  try {
    const updated = await Followup.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Follow-up not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a note to a follow-up
// @route   POST /api/followups/:id/notes
// @access  Public
const addNote = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "Note text is required." });
  }

  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) {
      return res.status(404).json({ message: "Follow-up not found." });
    }

    followup.notes.push({ text });
    const updatedFollowup = await followup.save();

    // Award points and rating to creator
    if (followup.createdBy) {
      const creator = await User.findById(followup.createdBy);
      if (creator) {
        creator.points = (creator.points || 0) + 1;
        creator.rating = (creator.rating || 0) + 1;
        await creator.save();
      }
    }

    res.status(200).json(updatedFollowup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update the last called date
// @route   PATCH /api/followups/:id/lastCalled
// @access
// Update lastCalled for a specific follow-up
const updateLastCalled = async (req, res) => {
  try {
    const { id } = req.params;
    const currentTime = new Date();
    const updatedFollowup = await Followup.findByIdAndUpdate(
      id,
      { $set: { lastCalled: currentTime } },
      { new: true, runValidators: true }
    );

    if (!updatedFollowup) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.status(200).json(updatedFollowup);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update lastCalled", error: error.message });
  }
};

const getCustomerStats = async (req, res) => {
  try {
    // Total customers
    const total = await Followup.countDocuments();
    console.log(`Total customers: ${total}`);

    // New customers: Followups created in the last 30 days
    const newCount = await Followup.countDocuments({
      createdAt: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    });
    console.log(`New customers in last 365 days: ${newCount}`);

    // Active customers: Followups with a recent "last called" date (within the last 30 days)
    const activeCount = await Followup.countDocuments({
      lastCalled: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) },
    });
    console.log(`Active customers in last 365 days: ${activeCount}`);

    res.json({
      total,
      new: newCount,
      active: activeCount,
    });
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    res
      .status(500)
      .json({ message: "Error fetching customer stats", error: error.message });
  }
};

// Update Service Provided and Service Not Provided
// In your updateServices controller
const updateServices = async (req, res) => {
  const { id } = req.params;
  const { serviceProvided, serviceNotProvided } = req.body; // Get the services from the request body

  // Log the request body to check if the data is being sent correctly
  console.log("Request body:", req.body);

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Update the followup with the new services
    const updatedFollowup = await Followup.findByIdAndUpdate(
      id,
      { serviceProvided, serviceNotProvided },
      { new: true }
    );

    if (!updatedFollowup) {
      return res.status(404).json({ message: "Followup not found" });
    }

    // Award points and rating to creator
    if (updatedFollowup.createdBy) {
      const creator = await User.findById(updatedFollowup.createdBy);
      if (creator) {
        creator.points = (creator.points || 0) + 1;
        creator.rating = (creator.rating || 0) + 1;
        await creator.save();
      }
    }

    // Return the updated followup
    return res.json(updatedFollowup);
  } catch (error) {
    console.error("Error updating services:", error);
    return res
      .status(500)
      .json({ message: "Error updating services", error: error.message });
  }
};

// @desc    Edit customer information
// @route   PATCH /api/followups/:id/edit
// @access  Public
const editCustomer = async (req, res) => {
  const { id } = req.params;
  const {
    clientName,
    companyName,
    phoneNumber,
    email,
    packageType,
    deadline,
    serviceProvided,
    serviceNotProvided
  } = req.body;
  // allow updating schedulePreference and followupStatus via edit endpoint
  const { schedulePreference, followupStatus } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Format deadline to ensure proper date handling
    const formattedDeadline = deadline ? new Date(deadline) : undefined;

    const updatedData = {
      clientName,
      companyName,
      phoneNumber,
      email,
      packageType,
      ...(formattedDeadline && { deadline: formattedDeadline }),
      serviceProvided,
      serviceNotProvided
      , schedulePreference, followupStatus
    };

    // Remove undefined fields
    Object.keys(updatedData).forEach(
      key => updatedData[key] === undefined && delete updatedData[key]
    );

    const updatedFollowup = await Followup.findByIdAndUpdate(
      id,
      updatedData,
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!updatedFollowup) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(updatedFollowup);
  } catch (error) {
    console.error("Error editing customer:", error);
    res.status(500).json({ 
      message: "Error editing customer",
      error: error.message 
    });
  }
};

// @desc    Import B2B customers (buyers and sellers) to follow-up system
// @route   POST /api/followups/import-b2b
// @access  Public
const importB2BCustomers = async (req, res) => {
  try {
    const { customerType, customerId, agentId: incomingAgentId } = req.body;
    
    // Dynamically import the models since they're not available in this scope
    const buyerModel = require('../models/Buyer');
    const sellerModel = require('../models/Seller');
    
    let customerData;
    
    if (customerType === 'buyer') {
      customerData = await buyerModel.findById(customerId);
      if (!customerData) {
        return res.status(404).json({ message: "Buyer not found" });
      }
    } else if (customerType === 'seller') {
      customerData = await sellerModel.findById(customerId);
      if (!customerData) {
        return res.status(404).json({ message: "Seller not found" });
      }
    } else {
      return res.status(400).json({ message: "Invalid customer type. Must be 'buyer' or 'seller'" });
    }
    
    // Check if customer already exists in follow-up system
    const existingFollowup = await Followup.findOne({ 
      email: customerData.email 
    });
    
    if (existingFollowup) {
      return res.status(400).json({ 
        message: "Customer already exists in follow-up system",
        followupId: existingFollowup._id
      });
    }
    
    const resolvedAgentId = incomingAgentId || customerData.agentId;

    if (!resolvedAgentId) {
      return res.status(400).json({ message: "agentId is required to import this customer" });
    }

    // Create follow-up record from B2B customer data
    const followupData = {
      clientName: customerData.contactPerson,
      companyName: customerData.companyName,
      phoneNumber: customerData.phoneNumber,
      email: customerData.email,
      packageType: customerData.packageType || "Not specified",
      service: `${customerType === 'buyer' ? 'Buying' : 'Selling'} ${customerData.industry} products`,
      serviceProvided: "Initial contact made",
      serviceNotProvided: "Ongoing relationship management",
      deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
      createdBy: req.body.createdBy || null,
      agentId: resolvedAgentId,
    };
    
    const followup = new Followup(followupData);
    const savedFollowup = await followup.save();
    
    res.status(201).json({
      message: "B2B customer imported successfully",
      followup: savedFollowup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all B2B customers that are not yet in follow-up system
// @route   GET /api/followups/b2b-pending
// @access  Public
const getPendingB2BCustomers = async (req, res) => {
  try {
    // Import required models
    const buyerModel = require('../models/Buyer');
    const sellerModel = require('../models/Seller');
    
    // Get all follow-up customers' emails
    const followupCustomers = await Followup.find({}, 'email');
    const followupEmails = followupCustomers.map(customer => customer.email);
    
    // Get buyers and sellers not in follow-up system
    const buyers = await buyerModel.find({ 
      email: { $nin: followupEmails } 
    });
    
    const sellers = await sellerModel.find({ 
      email: { $nin: followupEmails } 
    });
    
    // Format the data for the frontend
    const pendingCustomers = [
      ...buyers.map(buyer => ({
        _id: buyer._id,
        clientName: buyer.contactPerson,
        companyName: buyer.companyName,
        email: buyer.email,
        phoneNumber: buyer.phoneNumber,
        type: 'buyer',
        industry: buyer.industry,
        country: buyer.country,
        packageType: buyer.packageType || "Not specified"
      })),
      ...sellers.map(seller => ({
        _id: seller._id,
        clientName: seller.contactPerson,
        companyName: seller.companyName,
        email: seller.email,
        phoneNumber: seller.phoneNumber,
        type: 'seller',
        industry: seller.industry,
        country: seller.country,
        packageType: seller.packageType || "Not specified"
      }))
    ];
    
    res.status(200).json(pendingCustomers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomerReport,
  createFollowup,
  getCustomerStats,
  getFollowups,
  getFollowupById,
  updateFollowup,
  deleteFollowup,
  sendBulkEmail,
  getMessages,
  addMessage,
  addNote,
  incrementAttempts,
  addCommunicationLog,
  updatePriority,
  updateLastCalled,
  updateServices,
  editCustomer,
  importB2BCustomers,
  getPendingB2BCustomers
};
