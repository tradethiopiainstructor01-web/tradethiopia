const mongoose = require('mongoose');
const SalesCustomer = require('../models/SalesCustomer');
const User = require('../models/user.model');
const Notification = require('../models/Notification');
const StudentRegistration = require('../models/StudentRegistration');
const TrainingFollowup = require('../models/TrainingFollowup');
const asyncHandler = require('express-async-handler');
const { calculateCommission } = require('../utils/commission');
const nodemailer = require('nodemailer');
const { createListCache } = require('../utils/listCache');

const normalizeRoleValue = (value) => (value || '').toString().trim().toLowerCase();
const PRIVILEGED_ROLES = new Set([
  'admin',
  'customerservice',
  'customer service',
  'customersuccessmanager',
  'customer success manager',
  'customer_success_manager',
  'coo',
  'salesmanager',
  'sales_manager',
  'sales manager',
  'finance',
  'reception'
]);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Old follow-up syncs stored generated SVG "receipt" placeholders as payment
// slips; only uploaded images, PDFs and links count as real slips.
const PLACEHOLDER_SLIP_PREFIX = 'data:image/svg+xml';
const REAL_SLIP_QUERY = { $nin: ['', null], $not: /^data:image\/svg\+xml/ };

// Lightweight lists send this marker in place of each stored document image.
// Saving the marker back means "unchanged", so a list row can never wipe a document.
const DOCUMENT_FIELDS = ['passportPhoto', 'nationalIdFrontImage', 'nationalIdBackImage', 'paymentScreenshot'];
const STORED_DOCUMENT = '__stored_document__';
const isDocumentChange = (value) => value !== undefined && value !== STORED_DOCUMENT;

// Flags which documents a sale has (and whether its linked student registration
// holds a real payment slip), then drops the base64 images (~95% of the bytes).
const summaryStages = () => [
  { $addFields: {
    _documents: Object.fromEntries(DOCUMENT_FIELDS.map((field) => [
      field, { $ne: [{ $trim: { input: { $ifNull: [`$${field}`, ''] } } }, ''] },
    ])),
    _ownSlip: isRealSlipExpression('$paymentScreenshot'),
  } },
  { $project: Object.fromEntries(DOCUMENT_FIELDS.map((field) => [field, 0])) },
  // localField/foreignField uses the _id index; an $expr match scans (~40x slower).
  { $lookup: {
    from: StudentRegistration.collection.name,
    localField: 'studentRegistrationId',
    foreignField: '_id',
    pipeline: [{ $project: { _id: 0, slip: isRealSlipExpression('$paymentScreenshot') } }],
    as: '_registration',
  } },
  { $addFields: { _registrationSlip: { $in: [true, '$_registration.slip'] } } },
  { $project: { _registration: 0 } },
];

// In-memory copy of every sale's summary row (see utils/listCache). Summary lists
// using only these parameters (agents' own lists, status lists and the finance
// follow-up page with search, date range, pages and totals) are answered from
// memory in milliseconds.
const CACHEABLE_LIST_PARAMS = new Set([
  'fields', 'followupStatus', 'search', 'dateFrom', 'dateTo', 'page', 'limit', 'includeSummary',
]);
const SEARCH_FIELDS = ['customerName', 'phone', 'email', 'productInterest', 'contactTitle', 'courseName'];
const salesListCache = createListCache({
  name: 'Sales follow-up list',
  load: () => SalesCustomer.aggregate(summaryStages()),
  loadMany: (ids) => SalesCustomer.aggregate([
    { $match: { _id: { $in: ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id)) } } },
    ...summaryStages(),
  ]),
  events: SalesCustomer.listEvents,
  snapshotName: 'sales-customers',
});
const warmSalesCustomerCache = () => salesListCache.warm();

// Sales rows carry their registration's slip flag, so re-read the sales linked to
// a student registration whenever that registration changes.
StudentRegistration.listEvents?.on('change', (registrationId) => {
  const rows = salesListCache.peek();
  if (!rows) return;
  const linked = [...rows.values()]
    .filter((row) => row.studentRegistrationId && String(row.studentRegistrationId) === registrationId)
    .map((row) => row._id);
  if (linked.length) salesListCache.refresh(linked);
});

const AGENT_NAME_TTL_MS = 60 * 1000;
const agentNameCache = new Map(); // id -> { name, aliases, at }
const loadAgents = async (ids) => {
  const now = Date.now();
  const missing = ids.filter((id) => !(now - (agentNameCache.get(id)?.at || 0) < AGENT_NAME_TTL_MS)
    && mongoose.Types.ObjectId.isValid(id));
  if (missing.length) {
    const users = await User.find({ _id: { $in: missing } }).select('username name fullName').lean();
    const found = new Map(users.map((u) => [u._id.toString(), u]));
    missing.forEach((id) => {
      const user = found.get(id);
      agentNameCache.set(id, {
        name: user ? user.username || user.name || user.fullName || '' : '',
        aliases: user ? [user.username, user.name, user.fullName].filter(Boolean) : [],
        at: now,
      });
    });
  }
};
const getAgentNames = async (ids) => {
  await loadAgents(ids);
  return Object.fromEntries(ids.map((id) => [id, agentNameCache.get(id)?.name || '']));
};
// Agents whose username, name or full name matches, for in-memory search.
const getMatchingAgentIds = async (ids, regex) => {
  await loadAgents(ids);
  return new Set(ids.filter((id) => agentNameCache.get(id)?.aliases.some((alias) => regex.test(alias))));
};
const isRealSlip = (value) => typeof value === 'string' && value.trim() !== '' && !value.startsWith(PLACEHOLDER_SLIP_PREFIX);
const isRealSlipExpression = (field) => ({
  $and: [
    { $ne: [{ $ifNull: [field, ''] }, ''] },
    { $ne: [{ $substrCP: [{ $ifNull: [field, ''] }, 0, PLACEHOLDER_SLIP_PREFIX.length] }, PLACEHOLDER_SLIP_PREFIX] },
  ],
});

const generateStudentRegistrationId = async () => {
  const prefix = 'CS-STU-';
  const latestStudent = await StudentRegistration.findOne({
    studentId: new RegExp(`^${escapeRegex(prefix)}\\d+$`),
  })
    .sort({ studentId: -1 })
    .select('studentId')
    .lean();

  const latestNumber = Number.parseInt((latestStudent?.studentId || '').replace(prefix, ''), 10) || 0;
  let nextNumber = latestNumber + 1;
  let nextId = `${prefix}${String(nextNumber).padStart(4, '0')}`;

  while (await StudentRegistration.exists({ studentId: nextId })) {
    nextNumber += 1;
    nextId = `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  return nextId;
};

const normalizeTimeSlot = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized === 'afternoon') return 'Afternoon';
  if (normalized === 'night') return 'Night';
  if (normalized === 'weekend') return 'Weekend';
  if (normalized === 'vip') return 'VIP';
  return 'Morning';
};

const normalizePaymentOption = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  if (normalized.includes('half') || normalized === 'partial') return 'Half Payment';
  return 'Full Payment';
};

const syncSalesCustomerToStudentRegistration = async (salesCustomer, authUser) => {
  if (!salesCustomer) return null;
  const isCompleted = (salesCustomer.followupStatus || '').toLowerCase() === 'completed';
  if (!isCompleted && !salesCustomer.studentRegistrationId) {
    return null;
  }

  try {
    const customerName = (salesCustomer.customerName || '').trim();
    if (!customerName) return null;

    const email = (salesCustomer.email || '').trim().toLowerCase();
    const phone = (salesCustomer.phone || '').trim();
    const courseDept = salesCustomer.courseName || salesCustomer.productInterest || salesCustomer.contactTitle || 'General';

    const existingStudent = await require('../services/salesRegistrationMatch').findSalesRegistration(salesCustomer);

    // Resolve agent identity
    let agentName = '';
    let agentEmail = '';
    const agentUserId = salesCustomer.agentId || salesCustomer.createdBy || authUser?._id || authUser?.id;
    if (agentUserId) {
      try {
        const u = await User.findById(agentUserId).select('fullName name username email').lean();
        if (u) {
          agentName = u.fullName || u.name || u.username || '';
          agentEmail = u.email || '';
        }
      } catch (_) {}
    }
    if (!agentName && authUser) {
      agentName = authUser.fullName || authUser.name || authUser.username || 'Sales Followup Team';
      agentEmail = authUser.email || '';
    }
    if (!agentName) {
      agentName = 'Sales Followup Team';
    }

    const payload = {
      fullName: customerName,
      email: email || undefined,
      phone: phone || '',
      learningDepartment: courseDept,
      program: salesCustomer.courseName || courseDept,
      preferredTimeSlot: normalizeTimeSlot(salesCustomer.schedulePreference),
      enrollmentDate: salesCustomer.date || salesCustomer.createdAt || new Date(),
      paymentOption: normalizePaymentOption(salesCustomer.paymentOption),
      paymentStatus: isCompleted ? 'Paid' : 'Waiting',
      paymentBank: salesCustomer.paymentBank || '',
      fsNumber: salesCustomer.fsNumber || '',
      passportPhoto: salesCustomer.passportPhoto || '',
      nationalIdFrontImage: salesCustomer.nationalIdFrontImage || '',
      nationalIdImage: salesCustomer.nationalIdFrontImage || '',
      nationalIdBackImage: salesCustomer.nationalIdBackImage || '',
      paymentScreenshot: salesCustomer.paymentScreenshot || '',
      salesCallStatus: salesCustomer.callStatus || 'Called',
      salesFollowupStatus: salesCustomer.followupStatus || 'Completed',
      salesSchedulePreference: salesCustomer.schedulePreference || 'Regular',
      salesPackageScope: salesCustomer.packageScope || 'Local',
      salesFollowupDate: salesCustomer.date || new Date(),
      salesFollowupNote: salesCustomer.note || '',
      notes: salesCustomer.note || '',
      status: 'Active',
      classCompleted: false,
      classCompletionStatus: 'Not Completed',
      cocPaymentStatus: 'Unpaid',
      registeredBy: agentName,
      registeredByEmail: agentEmail,
      createdBy: salesCustomer.createdBy || (authUser?._id ? authUser._id : undefined),
      agentId: salesCustomer.agentId ? salesCustomer.agentId.toString() : (authUser?.id ? authUser.id.toString() : undefined),
    };

    let targetStudent = null;
    if (existingStudent) {
      if (customerName) existingStudent.fullName = customerName;
      if (phone) existingStudent.phone = phone;
      if (email) existingStudent.email = email;
      if (payload.passportPhoto) existingStudent.passportPhoto = payload.passportPhoto;
      if (payload.nationalIdFrontImage) {
        existingStudent.nationalIdFrontImage = payload.nationalIdFrontImage;
        existingStudent.nationalIdImage = payload.nationalIdFrontImage;
      }
      if (payload.nationalIdBackImage) existingStudent.nationalIdBackImage = payload.nationalIdBackImage;
      if (payload.paymentScreenshot) existingStudent.paymentScreenshot = payload.paymentScreenshot;
      if (payload.paymentOption) existingStudent.paymentOption = payload.paymentOption;
      if (payload.paymentBank) existingStudent.paymentBank = payload.paymentBank;
      if (payload.fsNumber) existingStudent.fsNumber = payload.fsNumber;
      if (isCompleted) existingStudent.paymentStatus = 'Paid';
      if (payload.preferredTimeSlot) existingStudent.preferredTimeSlot = payload.preferredTimeSlot;
      if (payload.learningDepartment) {
        existingStudent.learningDepartment = payload.learningDepartment;
        existingStudent.program = payload.program;
      }
      if (agentName && (!existingStudent.registeredBy || existingStudent.registeredBy === 'Customer Success' || existingStudent.registeredBy === 'Sales Followup Team')) {
        existingStudent.registeredBy = agentName;
        existingStudent.registeredByEmail = agentEmail;
      }
      existingStudent.salesCallStatus = payload.salesCallStatus;
      existingStudent.salesFollowupStatus = payload.salesFollowupStatus;
      existingStudent.salesSchedulePreference = payload.salesSchedulePreference;
      existingStudent.salesPackageScope = payload.salesPackageScope;
      existingStudent.salesFollowupDate = payload.salesFollowupDate;
      if (payload.salesFollowupNote) existingStudent.salesFollowupNote = payload.salesFollowupNote;

      targetStudent = await existingStudent.save();
    } else {
      payload.studentId = await generateStudentRegistrationId();
      targetStudent = await StudentRegistration.create(payload);
    }

    if (targetStudent && (!salesCustomer.studentRegistrationId || salesCustomer.studentRegistrationId.toString() !== targetStudent._id.toString())) {
      await SalesCustomer.findByIdAndUpdate(salesCustomer._id, {
        $set: { studentRegistrationId: targetStudent._id }
      });
      salesCustomer.studentRegistrationId = targetStudent._id;
    }

    // Also sync to TrainingFollowup so it appears in TESBINN Users and Training reports
    try {
      const tfPayload = {
        customerName,
        email,
        phoneNumber: phone,
        trainingType: courseDept,
        scheduleShift: payload.preferredTimeSlot,
        startDate: payload.enrollmentDate,
        progress: 'Completed',
        idInfo: targetStudent.studentId,
        agentName: agentName,
        salesAgent: agentName,
        paymentAmount: salesCustomer.coursePrice || 0,
        totalAmount: salesCustomer.coursePrice || 0,
        paymentOption: (salesCustomer.paymentOption || '').toLowerCase().includes('half') ? 'partial' : 'full',
        materialStatus: 'Not Delivered',
        packageStatus: 'Active',
      };
      await TrainingFollowup.findOneAndUpdate(
        { idInfo: targetStudent.studentId },
        { $set: tfPayload },
        { upsert: true, new: true }
      );
    } catch (tfErr) {
      console.warn('Error updating TrainingFollowup from Sales sync:', tfErr.message);
    }

    return targetStudent;
  } catch (err) {
    console.error('Error syncing SalesCustomer to StudentRegistration:', err);
    return null;
  }
};

const findUsersByRoles = async (roles) => {
  if (!roles || !roles.length) return [];
  const filters = roles.map((role) => ({ role: { $regex: `^${escapeRegex(role)}$`, $options: 'i' } }));
  return await User.find({ $or: filters }).select('_id username role');
};

const createNotifications = async ({ userIds = [], roles = [], text, type = 'general' }) => {
  if (!text || (!userIds.length && !roles.length)) return;
  const targetIds = new Set(userIds.map((id) => id?.toString?.()).filter(Boolean));
  if (roles.length) {
    const users = await findUsersByRoles(roles);
    users.forEach((user) => {
      if (user && user._id) {
        targetIds.add(user._id.toString());
      }
    });
  }
  if (!targetIds.size) return;
  const docs = Array.from(targetIds).map((userId) => ({
    user: userId,
    text,
    type
  }));
  await Notification.insertMany(docs);
};

const canAccessCustomer = (customer, user) => {
  const normalizedUserRole = normalizeRoleValue(user?.role);
  if (PRIVILEGED_ROLES.has(normalizedUserRole)) return true;
  return customer?.agentId && customer.agentId.toString() === user.id.toString();
};

const notifyCompletionDocuments = async (customer, user) => {
  try {
    await createNotifications({
      userIds: [customer.agentId || user._id || user.id],
      text: `${customer.customerName}: Sales follow-up completed. Please make sure the bank slip, ID front, and ID back are submitted.`,
    });
  } catch (error) {
    console.warn('Could not save completion document reminder:', error.message);
  }
};

// @desc    Get all customers for logged in agent
// @route   GET /api/sales-customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  const normalizedUserRole = normalizeRoleValue(req.user?.role);
  const filter = {};
  const paginationRequested = req.query.page !== undefined || req.query.limit !== undefined;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 15));
  const skip = (page - 1) * limit;

  const canViewAll = PRIVILEGED_ROLES.has(normalizedUserRole);
  if (!canViewAll) {
    filter.agentId = req.user.id;
  }
  
  // Name filter (searches both customerName and agentName)
  if (req.query.name) {
    const nameRegex = new RegExp(req.query.name, 'i');
    const agentId = await getAgentIdByName(req.query.name);
    
    if (agentId) {
      filter.$or = [
        { customerName: nameRegex },
        { agentId: agentId }
      ];
    } else {
      filter.customerName = nameRegex;
    }
  }
  
  // Phone number filter (supports partial search)
  if (req.query.phone) {
    // Normalize phone number for consistent search
    const normalizedPhone = normalizePhoneNumberForSearch(req.query.phone);
    filter.phone = { $regex: new RegExp(normalizedPhone, 'i') };
  }
  
  // Agent filter
  if (req.query.agent) {
    filter.agentId = req.query.agent;
  }

  if (req.query.productInterest) {
    const escaped = escapeRegex(req.query.productInterest);
    filter.productInterest = { $regex: new RegExp(escaped, 'i') };
  }

  if (req.query.packageScope) {
    filter.packageScope = {
      $regex: new RegExp(`^${escapeRegex(req.query.packageScope)}$`, 'i')
    };
  }

  if (req.query.pipelineStatus || req.query.workflowStatus) {
    const statusQuery = req.query.pipelineStatus || req.query.workflowStatus;
    filter.pipelineStatus = { $regex: new RegExp(`^${escapeRegex(statusQuery)}$`, 'i') };
  }

  if (req.query.source) {
    filter.source = { $regex: new RegExp(`^${escapeRegex(req.query.source)}$`, 'i') };
  }
  
  // Customer ID filter
  if (req.query.customerId) {
    filter._id = req.query.customerId;
  }
  
  // Date range filters
  if (req.query.dateFrom || req.query.dateTo) {
    filter.date = {};
    if (req.query.dateFrom) {
      filter.date.$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      const endDate = new Date(req.query.dateTo);
      if (/^\d{4}-\d{2}-\d{2}$/.test(req.query.dateTo)) {
        endDate.setUTCHours(23, 59, 59, 999);
      }
      filter.date.$lte = endDate;
    }
  }
  
  // Optional followupStatus filter (case insensitive exact match)
  if (req.query.followupStatus) {
    filter.followupStatus = {
      $regex: new RegExp(`^${escapeRegex(req.query.followupStatus)}$`, 'i')
    };
  }

  const summaryMode = req.query.fields === 'summary';
  const fromCache = summaryMode && Object.keys(req.query).every((key) => CACHEABLE_LIST_PARAMS.has(key));
  const searchText = req.query.search?.trim() || '';

  // Search is intentionally handled on the server so pagination never searches
  // just the current 15-row page.
  if (searchText && !fromCache) {
    const searchRegex = new RegExp(escapeRegex(searchText), 'i');
    const matchingAgents = await User.find({
      $or: [
        { username: searchRegex },
        { name: searchRegex },
        { fullName: searchRegex }
      ]
    }).select('_id').lean();
    const matchingAgentIds = matchingAgents.map((user) => user._id.toString());
    const searchConditions = [
      { customerName: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { productInterest: searchRegex },
      { contactTitle: searchRegex },
      { courseName: searchRegex }
    ];
    if (matchingAgentIds.length) searchConditions.push({ agentId: { $in: matchingAgentIds } });

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }

  const sortOrder = { createdAt: -1, _id: -1 };
  // Applies the same filters as the database query to the in-memory rows.
  const readCachedCustomers = async () => {
    const rows = [...(await salesListCache.get()).values()];
    const status = (req.query.followupStatus || '').toString().toLowerCase();
    const { $gte: from, $lte: to } = filter.date || {};
    const fromTime = from ? from.getTime() : null;
    const toTime = to ? to.getTime() : null;
    let matchesSearch = () => true;
    if (searchText) {
      const searchRegex = new RegExp(escapeRegex(searchText), 'i');
      const agentIds = [...new Set(rows.map((c) => c.agentId).filter(Boolean).map(String))];
      const matchingAgents = await getMatchingAgentIds(agentIds, searchRegex);
      matchesSearch = (c) => matchingAgents.has(String(c.agentId))
        || SEARCH_FIELDS.some((field) => typeof c[field] === 'string' && searchRegex.test(c[field]));
    }
    const matchesDate = (c) => {
      if (fromTime === null && toTime === null) return true;
      if (!c.date) return false;
      const time = new Date(c.date).getTime();
      return (fromTime === null || time >= fromTime) && (toTime === null || time <= toTime);
    };
    const createdTime = (c) => new Date(c.createdAt || 0).getTime() || 0;
    return rows
      .filter((c) => canViewAll || String(c.agentId) === String(req.user.id))
      .filter((c) => !status || (c.followupStatus || '').toLowerCase() === status)
      .filter(matchesDate)
      .filter(matchesSearch)
      .sort((a, b) => (createdTime(b) - createdTime(a)) || String(b._id).localeCompare(String(a._id)));
  };

  let customers;
  let total = 0;
  let cachedSummary;
  if (fromCache) {
    const matched = await readCachedCustomers();
    total = matched.length;
    customers = paginationRequested ? matched.slice(skip, skip + limit) : matched;
    if (req.query.includeSummary === 'true') {
      cachedSummary = matched.reduce((totals, c) => ({
        total: totals.total + 1,
        totalCoursePrice: totals.totalCoursePrice + (typeof c.coursePrice === 'number' ? c.coursePrice : 0),
        withSlip: totals.withSlip + (c._ownSlip || c._registrationSlip ? 1 : 0),
        completed: totals.completed + ((c.followupStatus || '').toLowerCase() === 'completed' ? 1 : 0),
      }), { total: 0, totalCoursePrice: 0, withSlip: 0, completed: 0 });
      // Plain float addition drifts (…07000002); prices are in cents at most.
      cachedSummary.totalCoursePrice = Math.round(cachedSummary.totalCoursePrice * 100) / 100;
    }
  } else {
    const customerQuery = summaryMode
      ? SalesCustomer.aggregate([
        { $match: SalesCustomer.find(filter).cast(SalesCustomer) },
        { $sort: sortOrder },
        ...(paginationRequested ? [{ $skip: skip }, { $limit: limit }] : []),
        ...summaryStages(),
      ])
      : SalesCustomer.find(filter).sort(sortOrder).lean();
    if (!summaryMode && paginationRequested) customerQuery.skip(skip).limit(limit);

    [customers, total] = await Promise.all([
      customerQuery,
      paginationRequested ? SalesCustomer.countDocuments(filter) : Promise.resolve(0)
    ]);
  }

  // Agent display names change rarely; cache them briefly instead of a query per request.
  const agentIds = [...new Set(customers.map((c) => c.agentId).filter(Boolean).map(String))];
  const userMap = await getAgentNames(agentIds);
  const getSlipSource = (c) => {
    if (c._ownSlip) return 'sales';
    if (c._registrationSlip) return 'registration';
    return null;
  };

  const withAgentName = customers.map(({ _documents, _ownSlip, _registrationSlip, ...c }) => {
    const slipSource = summaryMode ? getSlipSource({ _ownSlip, _registrationSlip }) : undefined;
    return {
      ...c,
      agentName: userMap[c.agentId?.toString()] || c.agentId || 'Unknown',
      ...(summaryMode ? {
        // Documents are replaced by a marker; the full record loads them on demand.
        ...Object.fromEntries(DOCUMENT_FIELDS.map((field) => [field, _documents?.[field] ? STORED_DOCUMENT : ''])),
        hasPaymentScreenshot: Boolean(slipSource),
        paymentSlipSource: slipSource,
      } : {}),
    };
  });

  if (!paginationRequested) {
    res.json(withAgentName);
    return;
  }

  // Totals across every page of the current filter, for dashboard stat cards.
  let summary = cachedSummary;
  if (req.query.includeSummary === 'true' && !summary) {
    const [totals] = await SalesCustomer.aggregate([
      { $match: SalesCustomer.find(filter).cast(SalesCustomer) },
      { $project: {
        coursePrice: 1,
        followupStatus: 1,
        studentRegistrationId: 1,
        ownSlip: isRealSlipExpression('$paymentScreenshot'),
      } },
      // localField/foreignField uses the _id index; an $expr match scans (~40x slower).
      { $lookup: {
        from: StudentRegistration.collection.name,
        localField: 'studentRegistrationId',
        foreignField: '_id',
        pipeline: [{ $project: { _id: 0, slip: isRealSlipExpression('$paymentScreenshot') } }],
        as: 'registration',
      } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        totalCoursePrice: { $sum: { $ifNull: ['$coursePrice', 0] } },
        withSlip: { $sum: { $cond: [{ $or: ['$ownSlip', { $in: [true, '$registration.slip'] }] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: [{ $toLower: { $ifNull: ['$followupStatus', ''] } }, 'completed'] }, 1, 0] } },
      } },
    ]);
    summary = {
      total: totals?.total || 0,
      totalCoursePrice: Math.round((totals?.totalCoursePrice || 0) * 100) / 100,
      withSlip: totals?.withSlip || 0,
      completed: totals?.completed || 0,
    };
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.json({
    ...(summary ? { summary } : {}),
    data: withAgentName,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages
    }
  });
});

// Helper function to normalize phone numbers for search
const normalizePhoneNumberForSearch = (phone) => {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // For search, we want to match various formats
  // Return the digits only for regex matching
  return normalized.replace(/^\+?251|^0?/, '');
};

// Helper function to get agent ID by name
const getAgentIdByName = async (name) => {
  try {
    const user = await User.findOne({
      $or: [
        { username: new RegExp(name, 'i') },
        { name: new RegExp(name, 'i') },
        { fullName: new RegExp(name, 'i') }
      ]
    }).select('_id');
    
    return user ? user._id : null;
  } catch (error) {
    return null;
  }
};

// @desc    Get customer by ID
// @route   GET /api/sales-customers/:id
// @access  Private
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await SalesCustomer.findById(req.params.id).lean();
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const normalizedUserRole = normalizeRoleValue(req.user.role);
  const ownsRecord = customer.agentId && customer.agentId.toString() === req.user.id.toString();
  const isPrivileged = PRIVILEGED_ROLES.has(normalizedUserRole);
  if (!ownsRecord && !isPrivileged) {
    res.status(403);
    throw new Error('You do not have permission to view this customer');
  }

  let agentName = customer.agentId;
  if (customer.agentId) {
    const u = await User.findById(customer.agentId).select('username name fullName');
    agentName = u ? (u.username || u.name || u.fullName || customer.agentId) : customer.agentId;
  }
  res.json({ ...customer, agentName });
});

// @desc    Get a customer's payment slip (the sale's own, else its student registration's)
// @route   GET /api/sales-customers/:id/payment-slip
// @access  Private
const getCustomerPaymentSlip = asyncHandler(async (req, res) => {
  const customer = await SalesCustomer.findById(req.params.id)
    .select('agentId paymentScreenshot studentRegistrationId')
    .lean();
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const ownsRecord = customer.agentId && customer.agentId.toString() === req.user.id.toString();
  if (!ownsRecord && !PRIVILEGED_ROLES.has(normalizeRoleValue(req.user.role))) {
    res.status(403);
    throw new Error('You do not have permission to view this payment slip');
  }

  if (isRealSlip(customer.paymentScreenshot)) {
    res.json({ src: customer.paymentScreenshot, source: 'sales' });
    return;
  }
  if (customer.studentRegistrationId) {
    const registration = await StudentRegistration.findById(customer.studentRegistrationId)
      .select('+paymentScreenshot')
      .lean();
    if (isRealSlip(registration?.paymentScreenshot)) {
      res.json({ src: registration.paymentScreenshot, source: 'registration' });
      return;
    }
  }
  res.json({ src: '', source: null });
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
    productInterest,
    source,
    pipelineStatus,
    packageScope,
    passportPhoto,
    nationalIdFrontImage,
    nationalIdBackImage,
    paymentScreenshot,
    paymentOption,
    paymentBank,
    fsNumber
  } = req.body;
  const resolvedCallStatus = callStatus || 'Not Called';
  const resolvedFollowupStatus = followupStatus || 'Pending';

  const normalizedRole = normalizeRoleValue(req.user.role);
  const isReception = normalizedRole === 'reception';
  const assignedAgentId = isReception ? null : req.user.id;
  const assignedBy = isReception ? undefined : req.user._id;
  const assignedAt = isReception ? undefined : new Date();
  const normalizedPrice = Number(coursePrice) || 0;
  const resolvedPipelineStatus = isReception ? 'Pending Assignment' : (pipelineStatus || 'Assigned');
  const resolvedSource = isReception ? 'Reception' : (source || 'Sales');

  const customer = new SalesCustomer({
    agentId: assignedAgentId,
    createdBy: req.user._id,
    source: resolvedSource,
    productInterest: productInterest || contactTitle || courseName || '',
    pipelineStatus: resolvedPipelineStatus,
    assignedBy,
    assignedAt,
    customerName,
    contactTitle,
    phone,
    callStatus: resolvedCallStatus,
    followupStatus: resolvedFollowupStatus,
    packageScope: packageScope || '',
    schedulePreference,
    email,
    note,
    supervisorComment,
    passportPhoto: passportPhoto || '',
    nationalIdFrontImage: nationalIdFrontImage || '',
    nationalIdBackImage: nationalIdBackImage || '',
    paymentScreenshot: paymentScreenshot || '',
    paymentOption: paymentOption || 'Full Payment',
    paymentBank: paymentBank || '',
    fsNumber: fsNumber || '',
    courseName: courseName || contactTitle,
    courseId,
    coursePrice: normalizedPrice,
    commission: calculateCommission(normalizedPrice)
  });

  const createdCustomer = await customer.save();

  if (createdCustomer.followupStatus === 'Completed') {
    await notifyCompletionDocuments(createdCustomer, req.user);
    try {
      await syncSalesCustomerToStudentRegistration(createdCustomer, req.user);
    } catch (syncErr) {
      console.error('Error auto-syncing created customer to StudentRegistration:', syncErr.message);
    }
  }

  if (isReception) {
    await createNotifications({
      roles: ['salesmanager'],
      text: `🆕 New customer added by Reception: ${customer.customerName}. Assign a sales agent.`,
      type: 'task'
    });
  }

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
    packageScope,
    passportPhoto,
    nationalIdFrontImage,
    nationalIdBackImage,
    paymentScreenshot,
    paymentOption,
    paymentBank,
    fsNumber
  } = req.body;

  const customer = await SalesCustomer.findById(req.params.id);

  const normalizedRole = normalizeRoleValue(req.user?.role);
  if (normalizedRole === 'reception') {
    res.status(403);
    throw new Error('Reception cannot modify sales data');
  }

  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  if (!canAccessCustomer(customer, req.user)) {
    res.status(403);
    throw new Error('Not authorized to modify this customer');
  }

  if (!customer.createdBy) {
    customer.createdBy = req.user._id;
  }
  const wasCompleted = customer.followupStatus === 'Completed';
  if (customerName !== undefined) customer.customerName = customerName;
  if (contactTitle !== undefined) customer.contactTitle = contactTitle;
  if (phone !== undefined) customer.phone = phone;
  if (callStatus !== undefined) customer.callStatus = callStatus;
  if (followupStatus !== undefined) customer.followupStatus = followupStatus;
  if (schedulePreference !== undefined) customer.schedulePreference = schedulePreference;
  if (email !== undefined) customer.email = email;
  if (note !== undefined) customer.note = note;
  if (supervisorComment !== undefined) customer.supervisorComment = supervisorComment;
  if (courseName !== undefined) customer.courseName = courseName;
  if (courseId !== undefined) customer.courseId = courseId;
  if (isDocumentChange(passportPhoto)) customer.passportPhoto = passportPhoto;
  if (isDocumentChange(nationalIdFrontImage)) customer.nationalIdFrontImage = nationalIdFrontImage;
  if (isDocumentChange(nationalIdBackImage)) customer.nationalIdBackImage = nationalIdBackImage;
  if (isDocumentChange(paymentScreenshot)) customer.paymentScreenshot = paymentScreenshot;
  if (paymentOption !== undefined) customer.paymentOption = paymentOption;
  if (paymentBank !== undefined) customer.paymentBank = paymentBank;
  if (fsNumber !== undefined) customer.fsNumber = fsNumber;
  if (coursePrice !== undefined && coursePrice !== null) {
    customer.coursePrice = Number(coursePrice) || 0;
    customer.commission = calculateCommission(customer.coursePrice);
  }
  if (packageScope !== undefined) customer.packageScope = packageScope;

  const updatedCustomer = await customer.save();

  if (!wasCompleted && updatedCustomer.followupStatus === 'Completed') {
    await notifyCompletionDocuments(updatedCustomer, req.user);
  }

  if (updatedCustomer.followupStatus === 'Completed' || updatedCustomer.studentRegistrationId) {
    try {
      await syncSalesCustomerToStudentRegistration(updatedCustomer, req.user);
    } catch (syncErr) {
      console.error('Error auto-syncing updated customer to StudentRegistration:', syncErr.message);
    }
  }

  res.json(updatedCustomer);
});

// @desc    Send email to a sales customer from inside the portal
// @route   POST /api/sales-customers/:id/email
// @access  Private
const sendCustomerEmail = asyncHandler(async (req, res) => {
  const { subject, body } = req.body || {};
  const customer = await SalesCustomer.findById(req.params.id);

  if (!customer || !canAccessCustomer(customer, req.user)) {
    res.status(404);
    throw new Error('Customer not found');
  }

  if (!customer.email) {
    res.status(400);
    throw new Error('Customer does not have an email address');
  }

  if (!subject || !subject.trim() || !body || !body.trim()) {
    res.status(400);
    throw new Error('Subject and message are required');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER || 'user@example.com',
      pass: process.env.SMTP_PASS || 'password'
    }
  });

  const senderName = req.user.fullName || req.user.username || req.user.name || 'Trade Ethiopia Sales';
  const senderEmail = req.user.email || process.env.SMTP_USER || 'no-reply@example.com';
  const sentAt = new Date();
  const info = await transporter.sendMail({
    from: `"${senderName}" <${process.env.SMTP_FROM || senderEmail}>`,
    replyTo: senderEmail,
    to: customer.email,
    subject: subject.trim(),
    text: body.trim()
  });

  const emailLog = `Email sent on ${sentAt.toISOString()} by ${senderName}: ${subject.trim()}`;
  customer.note = customer.note ? `${customer.note}\n\n${emailLog}` : emailLog;
  await customer.save();

  res.json({
    success: true,
    message: 'Email sent',
    messageId: info.messageId,
    sentAt,
    to: customer.email,
    subject: subject.trim()
  });
});

// @desc    Send or log SMS to a sales customer from inside the portal
// @route   POST /api/sales-customers/:id/sms
// @access  Private
const sendCustomerSms = asyncHandler(async (req, res) => {
  const { body } = req.body || {};
  const customer = await SalesCustomer.findById(req.params.id);

  if (!customer || !canAccessCustomer(customer, req.user)) {
    res.status(404);
    throw new Error('Customer not found');
  }

  if (!customer.phone) {
    res.status(400);
    throw new Error('Customer does not have a phone number');
  }

  if (!body || !body.trim()) {
    res.status(400);
    throw new Error('SMS message is required');
  }

  const sentAt = new Date();
  const senderName = req.user.fullName || req.user.username || req.user.name || 'Trade Ethiopia Sales';
  let deliveryStatus = 'logged';
  let providerMessageId = null;

  if (process.env.SMS_API_URL) {
    const smsResponse = await fetch(process.env.SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.SMS_API_TOKEN ? { Authorization: `Bearer ${process.env.SMS_API_TOKEN}` } : {})
      },
      body: JSON.stringify({
        to: customer.phone,
        from: process.env.SMS_FROM || 'TradeEthiopia',
        message: body.trim(),
        customerId: customer._id.toString()
      })
    });

    const payload = await smsResponse.json().catch(() => ({}));
    if (!smsResponse.ok) {
      res.status(502);
      throw new Error(payload.message || 'SMS provider failed to send message');
    }

    deliveryStatus = payload.status || 'sent';
    providerMessageId = payload.messageId || payload.id || null;
  }

  const smsLog = `SMS ${deliveryStatus} on ${sentAt.toISOString()} by ${senderName}: ${body.trim()}`;
  customer.note = customer.note ? `${customer.note}\n\n${smsLog}` : smsLog;
  await customer.save();

  res.json({
    success: true,
    message: process.env.SMS_API_URL ? 'SMS sent' : 'SMS logged',
    providerConfigured: Boolean(process.env.SMS_API_URL),
    deliveryStatus,
    messageId: providerMessageId,
    sentAt,
    to: customer.phone,
    body: body.trim()
  });
});

// @desc    Assign customer to agent (Sales Manager only)
// @route   PUT /api/sales-customers/:id/assign
// @access  Private (Sales Manager)
const assignCustomer = asyncHandler(async (req, res) => {
  const normalizedRole = normalizeRoleValue(req.user.role);
  const managerRoles = ['salesmanager', 'sales_manager', 'sales manager'];
  if (!managerRoles.includes(normalizedRole)) {
    res.status(403);
    throw new Error('Only sales managers can assign customers');
  }

  const { assignedAgentId } = req.body;
  if (!assignedAgentId) {
    res.status(400);
    throw new Error('assignedAgentId is required');
  }

  if (assignedAgentId === req.user.id) {
    res.status(403);
    throw new Error('Sales Manager cannot assign customer to themselves');
  }

  const agentUser = await User.findById(assignedAgentId);
  if (!agentUser || normalizeRoleValue(agentUser.role) !== 'sales') {
    res.status(403);
    throw new Error('Assigned user must be a sales agent');
  }

  const customer = await SalesCustomer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  if (!customer.createdBy) {
    customer.createdBy = req.user._id;
  }

  customer.agentId = assignedAgentId;
  customer.assignedBy = req.user._id;
  customer.assignedAt = new Date();
  customer.pipelineStatus = 'Assigned';
  const updatedCustomer = await customer.save();

  await createNotifications({
    userIds: [assignedAgentId],
    text: `🆕 You were assigned ${updatedCustomer.customerName} by Sales Manager ${req.user.username || req.user._id}`,
    type: 'task'
  });

  res.json(updatedCustomer);
});

// @desc    Delete customer
// @route   DELETE /api/sales-customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await SalesCustomer.findById(req.params.id);

  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  if (!canAccessCustomer(customer, req.user)) {
    res.status(403);
    throw new Error('Not authorized to delete this customer');
  }

  await SalesCustomer.findByIdAndDelete(req.params.id);
  res.json({ message: 'Customer removed', id: req.params.id });
});

// @desc    Get sales stats for logged in agent
// @route   GET /api/sales-customers/stats
// @access  Private
const getSalesStats = asyncHandler(async (req, res) => {
  try {
    const agentId = req.user.id.toString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [summary = {}] = await SalesCustomer.aggregate([
      { $match: { agentId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          newCount: { $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] } },
          activeCount: { $sum: { $cond: [{ $gte: ['$lastCalled', thirtyDaysAgo] }, 1, 0] } },
          completedDeals: { $sum: { $cond: [{ $eq: ['$followupStatus', 'Completed'] }, 1, 0] } },
          calledCustomers: { $sum: { $cond: [{ $eq: ['$callStatus', 'Called'] }, 1, 0] } },
          totalCommission: {
            $sum: {
              $cond: [
                { $eq: ['$followupStatus', 'Completed'] },
                { $ifNull: ['$commission.netCommission', 0] },
                0
              ]
            }
          }
        }
      }
    ]);
    
    res.json({
      total: summary.total || 0,
      new: summary.newCount || 0,
      active: summary.activeCount || 0,
      completedDeals: summary.completedDeals || 0,
      calledCustomers: summary.calledCustomers || 0,
      totalCommission: summary.totalCommission || 0
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching sales stats", 
      error: error.message 
    });
  }
});

// A document counts as submitted only if it is a real upload: not blank and not
// one of the generated SVG placeholder receipts from old follow-up syncs.
const isRealDocumentExpression = (field) => ({
  $and: [
    { $ne: [{ $trim: { input: { $ifNull: [field, ''] } } }, ''] },
    { $ne: [{ $substrCP: [{ $ifNull: [field, ''] }, 0, PLACEHOLDER_SLIP_PREFIX.length] }, PLACEHOLDER_SLIP_PREFIX] },
  ],
});

const getDocumentReminders = asyncHandler(async (req, res) => {
  const userId = String(req.user._id || req.user.id);
  const rows = await SalesCustomer.aggregate([
    { $match: { agentId: userId, followupStatus: 'Completed' } },
    // Reduce each sale to flags first so the base64 images are not carried along.
    { $project: {
      customerName: 1,
      studentRegistrationId: 1,
      hasSlip: isRealDocumentExpression('$paymentScreenshot'),
      hasIdFront: isRealDocumentExpression('$nationalIdFrontImage'),
      hasIdBack: isRealDocumentExpression('$nationalIdBackImage'),
    } },
    // A bank slip uploaded on the linked student registration also counts
    // (the same rule the finance follow-up page uses).
    { $lookup: {
      from: StudentRegistration.collection.name,
      localField: 'studentRegistrationId',
      foreignField: '_id',
      pipeline: [{ $project: { _id: 0, slip: isRealSlipExpression('$paymentScreenshot') } }],
      as: 'registration',
    } },
    { $project: {
      customerName: 1,
      missingDocuments: { $filter: {
        input: [
          { $cond: [{ $or: ['$hasSlip', { $in: [true, '$registration.slip'] }] }, null, 'Bank slip'] },
          { $cond: ['$hasIdFront', null, 'ID front'] },
          { $cond: ['$hasIdBack', null, 'ID back'] },
        ],
        as: 'label', cond: { $ne: ['$$label', null] },
      } },
    } },
    { $match: { 'missingDocuments.0': { $exists: true } } },
    { $sort: { _id: -1 } },
    { $facet: { items: [{ $limit: 5 }], total: [{ $count: 'count' }] } },
  ]);
  res.json({ items: rows[0]?.items || [], total: rows[0]?.total[0]?.count || 0 });
});

module.exports = {
  getDocumentReminders,
  warmSalesCustomerCache,
  getCustomers,
  getCustomerById,
  getCustomerPaymentSlip,
  createCustomer,
  updateCustomer,
  sendCustomerEmail,
  sendCustomerSms,
  assignCustomer,
  deleteCustomer,
  getSalesStats,
  syncSalesCustomerToStudentRegistration
};
