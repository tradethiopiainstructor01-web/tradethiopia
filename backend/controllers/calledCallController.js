const CalledCall = require('../models/CalledCall');
const BulkSmsRecipient = require('../models/BulkSmsRecipient');

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
    const andClauses = [];

    // Role-based visibility
    if (!hasGlobalAccess(req.user)) {
      query.createdBy = req.user._id;
    } else if (agentId) {
      query.createdBy = agentId;
    }

    // Status / Call Result filter
    const statusVal = callResult || callStatus;
    if (statusVal && statusVal !== 'All') {
      andClauses.push({ $or: [{ callResult: statusVal }, { callStatus: statusVal }] });
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
      andClauses.push({
        $or: [
          { customerName: regex },
          { clientName: regex },
          { companyName: regex },
          { phoneNumber: regex },
          { email: regex },
          { city: regex },
          { productInterest: regex },
          { notes: regex },
          { customPurpose: regex },
        ],
      });
    }

    if (andClauses.length > 0) query.$and = andClauses;

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
  if (Array.isArray(req.body)) {
    return exports.bulkCreateCalledCalls(req, res);
  }
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

    const resolvedResult = callResult || callStatus || 'Not Interested';
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

// Bulk import called calls from excel / csv
exports.bulkCreateCalledCalls = async (req, res) => {
  try {
    const rawItems = Array.isArray(req.body) ? req.body : req.body.items || [];
    if (!rawItems.length) {
      return res.status(400).json({ success: false, message: 'No records provided for import' });
    }

    const agentNameParts = [req.user.firstName, req.user.lastName].filter(Boolean);
    const salesAgentName = agentNameParts.length > 0 ? agentNameParts.join(' ') : (req.user.username || 'Sales Agent');

    const docsToInsert = [];
    const errors = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const rawPhone = item.phoneNumber || item.phone || item.mobile || item['Phone Number'] || item.Phone || '';
      const phoneStr = String(rawPhone).trim();

      if (!phoneStr) {
        errors.push({ row: i + 1, message: 'Missing phone number' });
        continue;
      }

      const name = (item.customerName || item.clientName || item.name || item['Customer Name'] || item.Customer || '').trim() || `Prospect ${phoneStr}`;
      const callResult = item.callResult || item.callStatus || item['Call Result'] || item.Status || 'Not Interested';
      const rawDate = item.callDate || item.date || item['Call Date'] || item.Date;
      const callDate = rawDate ? new Date(rawDate) : new Date();

      docsToInsert.push({
        customerName: name,
        clientName: name,
        companyName: (item.companyName || item.company || item['Company Name'] || item.Company || '').trim(),
        phoneNumber: phoneStr,
        email: (item.email || item.Email || '').trim().toLowerCase(),
        city: (item.city || item.City || '').trim(),
        purpose: item.purpose || 'Cold Outreach',
        customPurpose: (item.customPurpose || '').trim(),
        productInterest: (item.productInterest || '').trim(),
        callResult,
        callStatus: callResult,
        priority: item.priority || 'Warm',
        callDate: Number.isNaN(callDate.getTime()) ? new Date() : callDate,
        notes: (item.notes || item.note || item.Notes || item.Remarks || '').trim(),
        createdBy: req.user._id,
        salesAgentName,
      });
    }

    if (!docsToInsert.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid records to import. Every record requires a phone number.',
        errors,
      });
    }

    const inserted = await CalledCall.insertMany(docsToInsert, { ordered: false });

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} call record(s)`,
      count: inserted.length,
      data: inserted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in bulkCreateCalledCalls:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import call records',
      error: error.message,
    });
  }
};

// @desc    Send a bulk SMS to a list of phone numbers (phone numbers only)
// @route   POST /api/called-calls/bulk-sms
// @access  Private
exports.sendBulkSms = async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body || {};
    const body = typeof message === 'string' ? message.trim() : '';

    if (!body) {
      return res.status(400).json({ success: false, message: 'SMS message is required' });
    }

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one phone number is required' });
    }

    const phones = [...new Set(
      phoneNumbers
        .map((p) => String(p || '').trim())
        .filter((p) => /^\+?\d{7,15}$/.test(p))
    )];

    if (phones.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid phone numbers provided' });
    }

    if (phones.length > 1000) {
      return res.status(400).json({ success: false, message: 'A maximum of 1000 phone numbers can be sent at once' });
    }

    const providerConfigured = Boolean(process.env.SMS_API_URL);
    const results = [];

    for (const to of phones) {
      if (!providerConfigured) {
        results.push({ to, status: 'logged' });
        continue;
      }
      try {
        const smsResponse = await fetch(process.env.SMS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.SMS_API_TOKEN ? { Authorization: `Bearer ${process.env.SMS_API_TOKEN}` } : {}),
          },
          body: JSON.stringify({
            to,
            from: process.env.SMS_FROM || 'TradeEthiopia',
            message: body,
          }),
        });
        const payload = await smsResponse.json().catch(() => ({}));
        if (!smsResponse.ok) {
          results.push({ to, status: 'failed', error: payload.message || `Provider error (${smsResponse.status})` });
        } else {
          results.push({ to, status: payload.status || 'sent', messageId: payload.messageId || payload.id || null });
        }
      } catch (err) {
        results.push({ to, status: 'failed', error: err.message });
      }
    }

    const failed = results.filter((r) => r.status === 'failed').length;

    return res.json({
      success: true,
      providerConfigured,
      total: phones.length,
      sent: phones.length - failed,
      failed,
      results,
    });
  } catch (error) {
    console.error('Error in sendBulkSms:', error);
    return res.status(500).json({ success: false, message: 'Failed to send bulk SMS', error: error.message });
  }
};

// @desc    Get the current user's saved Bulk SMS recipients
// @route   GET /api/called-calls/bulk-sms/recipients
// @access  Private
exports.getBulkSmsRecipients = async (req, res) => {
  try {
    const recipients = await BulkSmsRecipient.find({ createdBy: req.user._id })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ success: true, count: recipients.length, data: recipients });
  } catch (error) {
    console.error('Error in getBulkSmsRecipients:', error);
    return res.status(500).json({ success: false, message: 'Failed to load saved Bulk SMS recipients' });
  }
};

// @desc    Save imported, pasted, or manually entered Bulk SMS recipients
// @route   POST /api/called-calls/bulk-sms/recipients
// @access  Private
exports.saveBulkSmsRecipients = async (req, res) => {
  try {
    const { phoneNumbers, source = 'manual' } = req.body || {};
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one phone number is required' });
    }

    const phones = [...new Set(phoneNumbers.map((value) => String(value || '').trim()).filter((value) => /^\+?\d{7,15}$/.test(value)))];
    if (!phones.length) {
      return res.status(400).json({ success: false, message: 'No valid phone numbers provided' });
    }
    if (phones.length > 1000) {
      return res.status(400).json({ success: false, message: 'A maximum of 1000 phone numbers can be saved at once' });
    }

    await BulkSmsRecipient.bulkWrite(
      phones.map((phoneNumber) => ({
        updateOne: {
          filter: { createdBy: req.user._id, phoneNumber },
          update: {
            $set: { source: String(source || 'manual').slice(0, 200) },
            $setOnInsert: { createdBy: req.user._id, phoneNumber },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    const recipients = await BulkSmsRecipient.find({ createdBy: req.user._id, phoneNumber: { $in: phones } }).lean();
    return res.status(201).json({ success: true, count: recipients.length, data: recipients });
  } catch (error) {
    console.error('Error in saveBulkSmsRecipients:', error);
    return res.status(500).json({ success: false, message: 'Failed to save Bulk SMS recipients', error: error.message });
  }
};

// @desc    Delete one saved Bulk SMS recipient
// @route   DELETE /api/called-calls/bulk-sms/recipients/:id
// @access  Private
exports.deleteBulkSmsRecipient = async (req, res) => {
  try {
    const deleted = await BulkSmsRecipient.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Bulk SMS recipient not found' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete Bulk SMS recipient' });
  }
};

// @desc    Clear the current user's saved Bulk SMS recipients
// @route   DELETE /api/called-calls/bulk-sms/recipients
// @access  Private
exports.clearBulkSmsRecipients = async (req, res) => {
  try {
    const result = await BulkSmsRecipient.deleteMany({ createdBy: req.user._id });
    return res.json({ success: true, count: result.deletedCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to clear Bulk SMS recipients' });
  }
};
