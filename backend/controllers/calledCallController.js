const CalledCall = require('../models/CalledCall');

const PRIVILEGED_ROLES = new Set([
  'admin',
  'salesmanager',
  'sales_manager',
  'coo',
  'customerservice',
  'customersuccessmanager',
  'customer_success_manager',
]);

const normalizeRole = (role = '') =>
  role.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const hasGlobalAccess = (user) => PRIVILEGED_ROLES.has(normalizeRole(user?.role));

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get all called calls with optional filters, search, and pagination
exports.getCalledCalls = async (req, res) => {
  try {
    const {
      search,
      callStatus,
      callResult,
      priority,
      purpose,
      dateFrom,
      dateTo,
      agentId,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Role-based visibility
    if (!hasGlobalAccess(req.user)) {
      query.createdBy = req.user._id;
    } else if (agentId) {
      query.createdBy = agentId;
    }

    // Status / Call Result filter
    const statusVal = callResult || callStatus;
    if (statusVal && statusVal !== 'All') {
      query.$or = [{ callResult: statusVal }, { callStatus: statusVal }];
    }

    // Priority filter
    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    // Purpose filter
    if (purpose && purpose !== 'All') {
      query.purpose = purpose;
    }

    // Date range filters
    const dateQuery = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!Number.isNaN(from.getTime())) {
        from.setHours(0, 0, 0, 0);
        dateQuery.$gte = from;
      }
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }
    }
    if (Object.keys(dateQuery).length > 0) {
      query.callDate = dateQuery;
    }

    // Search filter across text fields
    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { customerName: regex },
        { clientName: regex },
        { companyName: regex },
        { phoneNumber: regex },
        { email: regex },
        { city: regex },
        { productInterest: regex },
        { notes: regex },
        { customPurpose: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Fetch records and count
    const [records, totalCount] = await Promise.all([
      CalledCall.find(query)
        .populate('createdBy', 'firstName lastName username email role')
        .sort({ callDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CalledCall.countDocuments(query),
    ]);

    // Build stats for currently accessible scope
    const baseStatsQuery = hasGlobalAccess(req.user) && !agentId ? {} : { createdBy: agentId || req.user._id };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalCalls,
      todayCalls,
      interestedCount,
      callbackCount,
      dealClosedCount,
      noAnswerCount,
      hotCount,
      amountAggregation,
    ] = await Promise.all([
      CalledCall.countDocuments(baseStatsQuery),
      CalledCall.countDocuments({ ...baseStatsQuery, callDate: { $gte: startOfToday } }),
      CalledCall.countDocuments({
        ...baseStatsQuery,
        $or: [{ callResult: 'Interested' }, { callStatus: 'Interested' }],
      }),
      CalledCall.countDocuments({
        ...baseStatsQuery,
        $or: [{ callResult: 'Callback Requested' }, { callStatus: 'Callback Requested' }],
      }),
      CalledCall.countDocuments({
        ...baseStatsQuery,
        $or: [{ callResult: 'Deal Closed' }, { callStatus: 'Deal Closed' }],
      }),
      CalledCall.countDocuments({
        ...baseStatsQuery,
        $or: [
          { callResult: { $in: ['No Answer', 'Busy', 'Not Interested'] } },
          { callStatus: { $in: ['No Answer', 'Busy', 'Not Interested'] } },
        ],
      }),
      CalledCall.countDocuments({ ...baseStatsQuery, priority: 'Hot' }),
      CalledCall.aggregate([
        { $match: baseStatsQuery },
        { $group: { _id: null, totalSalesAmount: { $sum: '$salesAmount' } } },
      ]),
    ]);

    const totalSalesAmount = amountAggregation[0]?.totalSalesAmount || 0;

    return res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
      stats: {
        totalCalls,
        todayCalls,
        interestedCount,
        callbackCount,
        dealClosedCount,
        noAnswerCount,
        hotCount,
        totalSalesAmount,
      },
    });
  } catch (error) {
    console.error('Error fetching called calls:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch called calls',
      error: error.message,
    });
  }
};

// Create a new called call entry
exports.createCalledCall = async (req, res) => {
  try {
    const {
      customerName,
      clientName,
      companyName,
      phoneNumber,
      email,
      city,
      purpose,
      customPurpose,
      productInterest,
      callResult,
      callStatus,
      followUpDate,
      salesAmount,
      priority,
      callDuration,
      callDate,
      nextActionDate,
      notes,
    } = req.body;

    const resolvedName = (customerName || clientName || '').trim();
    if (!resolvedName) {
      return res.status(400).json({ success: false, message: 'Customer Name is required' });
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const agentNameParts = [req.user.firstName, req.user.lastName].filter(Boolean);
    const salesAgentName = agentNameParts.length > 0 ? agentNameParts.join(' ') : (req.user.username || 'Sales Agent');

    const resolvedResult = callResult || callStatus || 'Interested';
    const resolvedFollowUp = followUpDate || nextActionDate || null;
    const resolvedAmount = typeof salesAmount === 'number' ? salesAmount : (parseFloat(salesAmount) || 0);

    const newCall = new CalledCall({
      customerName: resolvedName,
      clientName: resolvedName,
      companyName: companyName ? companyName.trim() : '',
      phoneNumber: phoneNumber.trim(),
      email: email ? email.trim() : '',
      city: city ? city.trim() : '',
      purpose: purpose || 'Cold Outreach',
      customPurpose: customPurpose ? customPurpose.trim() : '',
      productInterest: productInterest ? productInterest.trim() : '',
      callResult: resolvedResult,
      callStatus: resolvedResult,
      followUpDate: resolvedFollowUp ? new Date(resolvedFollowUp) : null,
      nextActionDate: resolvedFollowUp ? new Date(resolvedFollowUp) : null,
      salesAmount: resolvedAmount,
      priority: priority || 'Warm',
      callDuration: callDuration ? callDuration.trim() : '',
      callDate: callDate ? new Date(callDate) : new Date(),
      notes: notes ? notes.trim() : '',
      createdBy: req.user._id,
      salesAgentName,
    });

    const savedCall = await newCall.save();
    await savedCall.populate('createdBy', 'firstName lastName username email role');

    return res.status(201).json({
      success: true,
      message: 'Called call recorded successfully',
      data: savedCall,
    });
  } catch (error) {
    console.error('Error creating called call:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to record called call',
    });
  }
};

// Get a single called call by ID
exports.getCalledCallById = async (req, res) => {
  try {
    const call = await CalledCall.findById(req.params.id).populate(
      'createdBy',
      'firstName lastName username email role'
    );

    if (!call) {
      return res.status(404).json({ success: false, message: 'Called call record not found' });
    }

    if (!hasGlobalAccess(req.user) && String(call.createdBy?._id || call.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this record' });
    }

    return res.status(200).json({ success: true, data: call });
  } catch (error) {
    console.error('Error fetching called call by id:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch called call', error: error.message });
  }
};

// Update an existing called call
exports.updateCalledCall = async (req, res) => {
  try {
    const call = await CalledCall.findById(req.params.id);

    if (!call) {
      return res.status(404).json({ success: false, message: 'Called call record not found' });
    }

    const isOwner = String(call.createdBy) === String(req.user._id);
    if (!isOwner && !hasGlobalAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this record' });
    }

    const fieldsToUpdate = [
      'customerName',
      'clientName',
      'companyName',
      'phoneNumber',
      'email',
      'city',
      'purpose',
      'customPurpose',
      'productInterest',
      'callResult',
      'callStatus',
      'followUpDate',
      'nextActionDate',
      'salesAmount',
      'priority',
      'callDuration',
      'callDate',
      'notes',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'callDate' || field === 'followUpDate' || field === 'nextActionDate') {
          call[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else if (field === 'salesAmount') {
          call[field] = typeof req.body[field] === 'number' ? req.body[field] : (parseFloat(req.body[field]) || 0);
        } else {
          call[field] = req.body[field];
        }
      }
    });

    // Ensure synced fields
    if (req.body.customerName && !req.body.clientName) call.clientName = req.body.customerName;
    if (req.body.clientName && !req.body.customerName) call.customerName = req.body.clientName;
    if (req.body.callResult && !req.body.callStatus) call.callStatus = req.body.callResult;
    if (req.body.callStatus && !req.body.callResult) call.callResult = req.body.callStatus;
    if (req.body.followUpDate && !req.body.nextActionDate) call.nextActionDate = req.body.followUpDate;
    if (req.body.nextActionDate && !req.body.followUpDate) call.followUpDate = req.body.nextActionDate;

    const updated = await call.save();
    await updated.populate('createdBy', 'firstName lastName username email role');

    return res.status(200).json({
      success: true,
      message: 'Called call updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating called call:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update called call',
    });
  }
};

// Delete a called call entry
exports.deleteCalledCall = async (req, res) => {
  try {
    const call = await CalledCall.findById(req.params.id);

    if (!call) {
      return res.status(404).json({ success: false, message: 'Called call record not found' });
    }

    const isOwner = String(call.createdBy) === String(req.user._id);
    if (!isOwner && !hasGlobalAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this record' });
    }

    await CalledCall.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Called call deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    console.error('Error deleting called call:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete called call',
      error: error.message,
    });
  }
};

// Quick stats summary
exports.getCalledCallStats = async (req, res) => {
  try {
    const { agentId } = req.query;
    const query = hasGlobalAccess(req.user) && !agentId ? {} : { createdBy: agentId || req.user._id };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalCalls,
      todayCalls,
      interestedCount,
      callbackCount,
      dealClosedCount,
      noAnswerCount,
      hotCount,
      amountAggregation,
    ] = await Promise.all([
      CalledCall.countDocuments(query),
      CalledCall.countDocuments({ ...query, callDate: { $gte: startOfToday } }),
      CalledCall.countDocuments({ ...query, $or: [{ callResult: 'Interested' }, { callStatus: 'Interested' }] }),
      CalledCall.countDocuments({ ...query, $or: [{ callResult: 'Callback Requested' }, { callStatus: 'Callback Requested' }] }),
      CalledCall.countDocuments({ ...query, $or: [{ callResult: 'Deal Closed' }, { callStatus: 'Deal Closed' }] }),
      CalledCall.countDocuments({
        ...query,
        $or: [
          { callResult: { $in: ['No Answer', 'Busy', 'Not Interested'] } },
          { callStatus: { $in: ['No Answer', 'Busy', 'Not Interested'] } },
        ],
      }),
      CalledCall.countDocuments({ ...query, priority: 'Hot' }),
      CalledCall.aggregate([
        { $match: query },
        { $group: { _id: null, totalSalesAmount: { $sum: '$salesAmount' } } },
      ]),
    ]);

    const totalSalesAmount = amountAggregation[0]?.totalSalesAmount || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalCalls,
        todayCalls,
        interestedCount,
        callbackCount,
        dealClosedCount,
        noAnswerCount,
        hotCount,
        totalSalesAmount,
      },
    });
  } catch (error) {
    console.error('Error fetching called call stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch called call stats',
      error: error.message,
    });
  }
};
