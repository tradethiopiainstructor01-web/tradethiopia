const SalesCustomer = require('../models/SalesCustomer');
const PackageSale = require('../models/PackageSale');
const User = require('../models/user.model');
const asyncHandler = require('express-async-handler');
const { calculateCommission, resolveSaleCommission } = require('../utils/commission');
const mongoose = require('mongoose');
const { snapshotSale, logSalesActivity, logSalesActivityMany, SNAPSHOT_SELECT } = require('../utils/salesActivity');
const SalesActivityLog = require('../models/SalesActivityLog');
const { backfillSalesActivityHistory } = require('../utils/salesActivityHistory');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeRoleValue = (value) => (value || '').toString().trim().toLowerCase().replace(/[\s_-]/g, '');
const isAllowedManagerRole = (role) => {
  const normalized = normalizeRoleValue(role);
  if (!normalized) return false;
  return (
    [
      'salesmanager',
      'hr',
      'finance',
      'admin',
      'superadmin',
      'coo',
      'coo2',
      '2coo',
      'ceo',
      'customerservice',
      'customersuccessmanager',
      'operationsdirector',
      'executivedirector'
    ].includes(normalized) ||
    normalized.includes('coo') ||
    normalized.includes('admin') ||
    normalized.includes('ceo') ||
    normalized.includes('manager')
  );
};

const resolveAgentId = async (agentValue) => {
  if (!agentValue) return null;
  const value = String(agentValue).trim();
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return value;
  }

  const regex = new RegExp(`^${escapeRegex(value)}$`, 'i');
  const user = await User.findOne({
    role: { $regex: /^sales$/i },
    $or: [
      { username: regex },
      { fullName: regex },
      { name: regex },
      { email: regex }
    ]
  }).select('_id');

  return user?._id?.toString() || null;
};

// @desc    Get all sales for sales manager (all agents)
// @route   GET /api/sales-manager/all-sales
// @access  Private (Sales Manager only)
const getAllSales = asyncHandler(async (req, res) => {
  try {
    console.log('=== GET ALL SALES REQUEST ===');
    console.log('User:', req.user);
    console.log('Query parameters:', req.query);
    
    // Sales leadership and admin roles can access this report.
    if (!isAllowedManagerRole(req.user?.role)) {
      console.log('Access denied - User role:', req.user.role);
      res.status(403);
      throw new Error('Access denied. Sales Manager, COO, CEO, Admin, HR, or Finance only.');
    }

    // Pagination (defaults)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    // Build filter object. By default show ALL sales unless a specific status is requested.
    let filter = {};

    // If frontend requested a specific status, apply it (e.g., ?status=Completed)
    if (req.query.status) {
      // Accept comma-separated statuses as well
      const statuses = String(req.query.status).split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        filter.followupStatus = statuses[0];
      } else if (statuses.length > 1) {
        filter.followupStatus = { $in: statuses };
      }
    }

    // Date filtering
    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) {
        filter.date.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filter.date.$lte = new Date(req.query.dateTo);
      }
    }

    // Agent filtering
    if (req.query.agentId) {
      const resolvedAgentId = await resolveAgentId(req.query.agentId);
      filter.agentId = resolvedAgentId || String(req.query.agentId).trim();
    }

    // Search the complete backend dataset, not only the current frontend page.
    const search = String(req.query.search || '').trim();
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      const matchingAgents = await User.find({
        role: { $regex: /^sales$/i },
        $or: [
          { username: searchRegex },
          { fullName: searchRegex },
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id').lean();
      filter.$or = [
        { customerName: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { contactTitle: searchRegex },
        { courseName: searchRegex },
        { productInterest: searchRegex },
        { note: searchRegex },
        { supervisorComment: searchRegex },
        { agentId: { $in: matchingAgents.map((agent) => String(agent._id)) } }
      ];
    }
    console.log('Applied filter:', filter);

    // Build filter for PackageSale
    let packageFilter = {};
    if (filter.agentId) {
      if (mongoose.Types.ObjectId.isValid(filter.agentId)) {
        packageFilter.$or = [
          { agentId: new mongoose.Types.ObjectId(filter.agentId) },
          { agentId: String(filter.agentId) }
        ];
      } else {
        packageFilter.agentId = filter.agentId;
      }
    }

    if (req.query.dateFrom || req.query.dateTo) {
      packageFilter.purchaseDate = {};
      if (req.query.dateFrom) {
        packageFilter.purchaseDate.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        packageFilter.purchaseDate.$lte = new Date(req.query.dateTo);
      }
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      packageFilter.$or = [
        { customerName: searchRegex },
        { phoneNumber: searchRegex },
        { email: searchRegex },
        { packageName: searchRegex },
        { notes: searchRegex }
      ];
    }

    if (req.query.status) {
      const statuses = String(req.query.status).split(',').map(s => s.trim()).filter(Boolean);
      const pkgStatuses = statuses.filter(s => ['Active', 'Pending', 'Expired', 'Cancelled'].includes(s));
      if (pkgStatuses.length > 0) {
        packageFilter.status = pkgStatuses.length === 1 ? pkgStatuses[0] : { $in: pkgStatuses };
      }
    }

    // Get paginated sales with lean objects for speed
    const [sales, totalCount, packageSales] = await Promise.all([
      SalesCustomer.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .select('customerName contactTitle phone callStatus followupStatus packageScope date schedulePreference email note supervisorComment courseName courseId coursePrice productInterest source pipelineStatus agentId assignedAt commission commissionApproved approvedAt createdAt updatedAt passportPhoto nationalIdFrontImage nationalIdBackImage paymentScreenshot paymentOption paymentBank fsNumber studentRegistrationId')
        .lean(),
      SalesCustomer.countDocuments(filter),
      PackageSale.find(packageFilter)
        .sort({ purchaseDate: -1 })
        .limit(limit)
        .lean()
    ]);

    // Format package sales into standard sales format
    const formattedPackageSales = (packageSales || []).map((pkg) => {
      const pkgPrice = Number(pkg.packagePrice || pkg.packageValue) || 0;
      const grossComm = Number(pkg.totalCommission) || Math.round(pkgPrice * 0.075);
      const netComm = grossComm;

      return {
        _id: pkg._id,
        customerName: pkg.customerName,
        contactTitle: pkg.contactPerson || '',
        phone: pkg.phoneNumber || '',
        callStatus: pkg.callStatus || 'Called',
        followupStatus: pkg.status || 'Active',
        packageScope: pkg.packageName || `${pkg.market || 'Local'} Package ${pkg.packageType || ''}`,
        date: pkg.purchaseDate || pkg.createdAt,
        schedulePreference: '',
        email: pkg.email || '',
        note: pkg.notes || '',
        supervisorComment: '',
        courseName: pkg.packageName || `${pkg.market || 'Local'} Package ${pkg.packageType || ''}`,
        courseId: pkg._id,
        coursePrice: pkgPrice,
        productInterest: `${pkg.market || 'Local'} Package ${pkg.packageType || ''}`,
        source: 'PackageSales',
        pipelineStatus: pkg.status || 'Active',
        agentId: pkg.agentId ? String(pkg.agentId) : null,
        assignedAt: pkg.purchaseDate,
        commission: {
          grossCommission: grossComm,
          commissionTax: 0,
          netCommission: netComm
        },
        commissionApproved: Boolean(pkg.secondCommissionPaid || pkg.firstCommissionPaid || pkg.firstCommissionApproved),
        approvedAt: pkg.secondCommissionPaidAt || pkg.firstCommissionPaidAt || null,
        market: pkg.market || 'Local',
        packageType: pkg.packageType,
        dealHistory: pkg.dealHistory || [],
        isPackageSale: true,
        createdAt: pkg.createdAt || pkg.purchaseDate,
        updatedAt: pkg.updatedAt || pkg.purchaseDate
      };
    });

    const combinedSales = [...sales, ...formattedPackageSales].sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );
    const combinedTotal = totalCount + (packageSales?.length || 0);

    console.log(`Found ${sales.length} course sales + ${formattedPackageSales.length} package sales (total ${combinedTotal})`);

    // If no sales found, return empty array with meta
    if (combinedSales.length === 0) {
      console.log('No sales found with current filter');
      return res.json({
        data: [],
        page,
        limit,
        total: combinedTotal,
        totalPages: Math.ceil(combinedTotal / limit)
      });
    }

    // Populate agent information manually since agentId is stored as String/ObjectId
    const agentIds = [...new Set(combinedSales.map(sale => sale.agentId ? String(sale.agentId) : null))];
    
    // Filter out any falsy agent IDs
    const validAgentIds = agentIds.filter(Boolean);
    if (validAgentIds.length === 0) {
      return res.json({
        data: combinedSales.map((sale) => ({
          ...sale,
          commission: sale.isPackageSale
            ? sale.commission
            : calculateCommission(Number(sale.coursePrice) || 0),
          agentId: null
        })),
        page,
        limit,
        total: combinedTotal,
        totalPages: Math.max(1, Math.ceil(combinedTotal / limit))
      });
    }
    
    const agents = await User.find({ _id: { $in: validAgentIds } }, 'username fullName email');
    
    const agentMap = agents.reduce((map, agent) => {
      map[agent._id.toString()] = agent;
      return map;
    }, {});

    // Attach agent information to sales
    const salesWithAgents = combinedSales.map(sale => {
      const saleAgentKey = sale.agentId ? String(sale.agentId) : null;
      const commissionData = sale.isPackageSale
        ? sale.commission
        : calculateCommission(Number(sale.coursePrice) || 0);

      return {
        ...sale,
        commission: {
          ...(sale.commission || {}),
          grossCommission: commissionData.grossCommission,
          commissionTax: commissionData.commissionTax,
          netCommission: commissionData.netCommission
        },
        agentId: (saleAgentKey && agentMap[saleAgentKey]) || null
      };
    });

    res.json({
      data: salesWithAgents,
      page,
      limit,
      total: combinedTotal,
      totalPages: Math.max(1, Math.ceil(combinedTotal / limit))
    });
  } catch (error) {
    console.error('Error in getAllSales:', error);
    res.status(500).json({ 
      message: "Error fetching all sales", 
      error: error.message 
    });
  }
});

// @desc    Update supervisor comment for a sale
// @route   PUT /api/sales-manager/sales/:id/supervisor-comment
// @access  Private (Sales Manager, HR, Finance, Admin)
const updateSupervisorComment = asyncHandler(async (req, res) => {
  try {
    // Only sales managers, HR, Finance, and Admin can access this
    if (!isAllowedManagerRole(req.user?.role)) {
      res.status(403);
      throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
    }

    const { supervisorComment } = req.body;
    const saleId = req.params.id;

    // Update the supervisor comment
    const before = mongoose.Types.ObjectId.isValid(saleId)
      ? await SalesCustomer.findById(saleId).select(SNAPSHOT_SELECT).lean()
      : null;
    const updatedSale = await SalesCustomer.findByIdAndUpdate(
      saleId,
      { supervisorComment },
      { new: true }
    );

    if (!updatedSale) {
      res.status(404);
      throw new Error('Sale not found');
    }

    logSalesActivity({
      action: 'updated',
      before: snapshotSale(before),
      after: snapshotSale(updatedSale),
      user: req.user,
      source: 'sales_manager',
      valuesOnly: true,
    });
    res.json(updatedSale);
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating supervisor comment", 
      error: error.message 
    });
  }
});

// @desc    Get all sales agents with performance data
// @route   GET /api/sales-manager/agents
// @access  Private (Sales Manager, HR, Finance, Admin)
const getAllAgents = asyncHandler(async (req, res) => {
  try {
    // Only sales managers, HR, Finance, and Admin can access this
    if (!isAllowedManagerRole(req.user?.role)) {
      res.status(403);
      throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
    }

    // Get all sales agents with basic info
    const agents = await User.find(
      { role: { $regex: /^sales$/i } },
      'username fullName email phone status role'
    ).sort({ fullName: 1, username: 1 });

    // Enhance agents with performance data
    const agentsWithPerformance = await Promise.all(agents.map(async (agent) => {
      // Calculate completed deals for this agent
      const completedDeals = await SalesCustomer.countDocuments({
        agentId: agent._id,
        followupStatus: 'Completed'
      });

      // Calculate total commission for this agent
      const salesWithCommission = await SalesCustomer.find({
        agentId: agent._id,
        followupStatus: 'Completed',
        'commission.netCommission': { $exists: true }
      });

      const totalCommission = salesWithCommission.reduce((sum, sale) => {
        return sum + (sale.commission?.netCommission || 0);
      }, 0);

      return {
        _id: agent._id,
        username: agent.username,
        fullName: agent.fullName,
        email: agent.email,
        phone: agent.phone,
        status: agent.status,
        role: agent.role,
        completedDeals,
        totalCommission
      };
    }));

    res.json(agentsWithPerformance);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching agents", 
      error: error.message 
    });
  }
});

// @desc    Get team performance stats for sales manager
// @route   GET /api/sales-manager/team-performance
// @access  Private (Sales Manager, HR, Finance, Admin)
const getTeamPerformance = asyncHandler(async (req, res) => {
  try {
    // Only sales managers, HR, Finance, and Admin can access this
    if (!isAllowedManagerRole(req.user?.role)) {
      res.status(403);
      throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
    }

    // Build date filter based on time range
    const dateFilter = {};
    const now = new Date();
    
    switch(req.query.timeRange) {
      case 'daily':
        dateFilter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
        break;
      case 'week':
        dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
        break;
      case 'quarter':
        // Calculate start of quarter
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        dateFilter.createdAt = { $gte: new Date(now.getFullYear(), quarterStartMonth, 1) };
        break;
      case 'year':
        dateFilter.createdAt = { $gte: new Date(now.getFullYear(), 0, 1) };
        break;
      default:
        // No date filter for 'all' or unspecified
        break;
    }

    // Get all sales agents
    const agents = await User.find({ role: 'sales' });

    // Calculate performance metrics for each agent
    const agentPerformance = await Promise.all(agents.map(async (agent) => {
      // Apply date filter to agent calculations as well
      const agentFilter = {
        agentId: agent._id,
        followupStatus: 'Completed'
      };
      
      // Add date filter if specified
      if (Object.keys(dateFilter).length > 0) {
        agentFilter.createdAt = dateFilter.createdAt;
      }
      
      const completedDeals = await SalesCustomer.countDocuments(agentFilter);

      // Get all completed sales for this agent with date filter
      const sales = await SalesCustomer.find(agentFilter);

      let totalGrossCommission = 0;
      let totalNetCommission = 0;
      let totalSales = 0;
      
      sales.forEach((sale) => {
        const commissionData = resolveSaleCommission(sale);
        totalGrossCommission += commissionData.grossCommission;
        totalNetCommission += commissionData.netCommission;
        totalSales += sale.coursePrice || 0;
      });

      return {
        _id: agent._id,
        fullName: agent.fullName || agent.username,
        username: agent.username,
        email: agent.email,
        completedDeals,
        totalGrossCommission: Math.round(totalGrossCommission),
        totalNetCommission: Math.round(totalNetCommission),
        totalSales: Math.round(totalSales)
      };
    }));

    // Get all completed sales with date filter
    const allCompletedSales = await SalesCustomer.find({
      followupStatus: 'Completed',
      ...dateFilter
    });

    // Calculate sales trend data (monthly)
    const salesTrend = {};
    const months = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      months.push(monthKey);
      salesTrend[monthKey] = { sales: 0, revenue: 0 };
    }
    
    // Count sales and revenue by month
    allCompletedSales.forEach(sale => {
      const saleDate = sale.createdAt || sale.date || new Date();
      const d = new Date(saleDate);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      
      if (salesTrend[monthKey]) {
        salesTrend[monthKey].sales += 1;
        // Use simulated net commission for revenue calculation
        const commissionData = resolveSaleCommission(sale);
        salesTrend[monthKey].revenue += commissionData.netCommission;
      }
    });
    
    // Convert to array format
    const salesTrendArray = months.map(monthKey => {
      const [year, monthIndex] = monthKey.split('-');
      const date = new Date(year, monthIndex, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      return {
        name: monthName,
        sales: salesTrend[monthKey].sales,
        revenue: Math.round(salesTrend[monthKey].revenue)
      };
    });

    // Group sales by training title
    const courseDistribution = {};
    allCompletedSales.forEach(sale => {
      const courseName = sale.courseName || sale.contactTitle || 'Unknown Course';
      if (!courseDistribution[courseName]) {
        courseDistribution[courseName] = 0;
      }
      courseDistribution[courseName]++;
    });

    // Convert to array format for the frontend
    const courseDistributionArray = Object.entries(courseDistribution).map(([name, value]) => ({
      name,
      value
    }));

    // Get all sales with date filter for detailed stats
    const allSalesWithFilter = await SalesCustomer.find({
      ...dateFilter
    });

    // Calculate status distribution
    const statusDistribution = {};
    allSalesWithFilter.forEach(sale => {
      const status = sale.followupStatus || 'Unknown';
      if (!statusDistribution[status]) {
        statusDistribution[status] = 0;
      }
      statusDistribution[status]++;
    });

    // Convert to array format for the frontend
    const statusDistributionArray = Object.entries(statusDistribution).map(([name, value]) => ({
      name,
      value
    }));

    // Calculate overall team stats
    const totalTeamSales = agentPerformance.reduce((sum, agent) => sum + agent.completedDeals, 0);
    const totalTeamGrossCommission = agentPerformance.reduce((sum, agent) => sum + agent.totalGrossCommission, 0);
    const totalTeamNetCommission = agentPerformance.reduce((sum, agent) => sum + agent.totalNetCommission, 0);
    const averageGrossCommission = agentPerformance.length > 0 ? totalTeamGrossCommission / agentPerformance.length : 0;

    res.json({
      teamStats: {
        totalAgents: agents.length,
        totalTeamSales,
        totalTeamGrossCommission,
        totalTeamNetCommission,
        averageGrossCommissionPerAgent: averageGrossCommission
      },
      agentPerformance,
      salesTrend: salesTrendArray,
      courseDistribution: courseDistributionArray,
      statusDistribution: statusDistributionArray
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching team performance", 
      error: error.message 
    });
  }
});

// @desc    Get sales manager dashboard stats
// @route   GET /api/sales-manager/dashboard-stats
// @access  Private (Sales Manager, HR, Finance, Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Only sales managers, HR, Finance, and Admin can access this
    if (!isAllowedManagerRole(req.user?.role)) {
      res.status(403);
      throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
    }

    // Independent queries run concurrently; commission calculations need no documents or images.
    const [totalAgents, totalCustomers, totalCompletedDeals, completedSales, recentSales] = await Promise.all([
      User.countDocuments({ role: 'sales' }),
      SalesCustomer.countDocuments(),
      SalesCustomer.countDocuments({ followupStatus: 'Completed' }),
      SalesCustomer.find({ followupStatus: 'Completed' }).select('commission coursePrice'),
      SalesCustomer.countDocuments({
        followupStatus: 'Completed',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Calculate total gross and net commission
    let totalGrossCommission = 0;
    let totalNetCommission = 0;
    
    completedSales.forEach((sale) => {
      const commissionData = resolveSaleCommission(sale);
      totalGrossCommission += commissionData.grossCommission;
      totalNetCommission += commissionData.netCommission;
    });

    res.json({
      totalAgents,
      totalCustomers,
      totalCompletedDeals,
      totalTeamGrossCommission: Math.round(totalGrossCommission),
      totalTeamNetCommission: Math.round(totalNetCommission),
      recentSales
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching dashboard stats", 
      error: error.message 
    });
  }
});

// @desc    Get sales data for a specific agent
// @route   GET /api/sales-manager/agent-sales/:agentId
// @access  Private (Sales Manager, HR, Finance, Admin)
const getAgentSales = asyncHandler(async (req, res) => {
  try {
    // Only sales managers, HR, Finance, and Admin can access this
    if (!isAllowedManagerRole(req.user?.role)) {
      res.status(403);
      throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
    }

    const { agentId } = req.params;
    const { month, year } = req.query;

    // Build filter object
    let filter = {
      agentId: agentId,
      followupStatus: 'Completed'
    };

    // Date filtering
    if (month && year) {
      const startDate = new Date(year, month.split('-')[1] - 1, 1);
      const endDate = new Date(year, month.split('-')[1], 0);
      
      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Get sales for this agent with filters
    const sales = await SalesCustomer.find(filter)
      .sort({ date: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching agent sales", 
      error: error.message 
    });
  }
});

// @desc    Import sales into SalesCustomer
// @route   POST /api/sales-manager/import-sales
// @access  Private (Sales Manager, HR, Finance, Admin)
const importSales = asyncHandler(async (req, res) => {
  if (!isAllowedManagerRole(req.user?.role)) {
    res.status(403);
    throw new Error('Access denied. Sales managers, HR, Finance, or Admin only.');
  }

  const { sales = [] } = req.body || {};
  if (!Array.isArray(sales) || sales.length === 0) {
    res.status(400);
    throw new Error('Sales array is required.');
  }

  const prepared = [];
  const skipped = [];

  for (let i = 0; i < sales.length; i += 1) {
    const row = sales[i] || {};
    const customerName = row.customerName || row.Customer || row['Customer Name'];
    if (!customerName) {
      skipped.push({ index: i, reason: 'Missing customerName' });
      continue;
    }

    const agentValue = row.agentId || row.agent || row.Agent || row.agentName;
    const resolvedAgentId = await resolveAgentId(agentValue);
    const normalizedPrice = Number(row.coursePrice || row['Course Price'] || 0) || 0;
    const followupStatus = row.followupStatus || row.Status || 'Imported';
    const contactTitle = row.contactTitle || row['Training/Contact Title'] || row.Training || row.note || '';
    const dateValue = row.date || row.Date;
    const parsedDate = dateValue ? new Date(dateValue) : new Date();
    const finalDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    prepared.push({
      agentId: resolvedAgentId || null,
      createdBy: req.user._id,
      source: row.source || 'Sales',
      productInterest: row.productInterest || contactTitle || row.courseName || '',
      pipelineStatus: resolvedAgentId ? 'Assigned' : 'Pending Assignment',
      assignedBy: resolvedAgentId ? req.user._id : undefined,
      assignedAt: resolvedAgentId ? new Date() : undefined,
      customerName,
      contactTitle,
      phone: row.phone || row.Phone || '',
      callStatus: row.callStatus || 'Not Called',
      followupStatus,
      packageScope: row.packageScope || '',
      schedulePreference: row.schedulePreference || 'Regular',
      email: row.email || '',
      note: row.note || '',
      supervisorComment: row.supervisorComment || row['Supervisor Comment'] || '',
      courseName: row.courseName || contactTitle || '',
      courseId: row.courseId || '',
      date: finalDate,
      coursePrice: normalizedPrice,
      commission: calculateCommission(normalizedPrice)
    });
  }

  if (!prepared.length) {
    res.status(400);
    throw new Error('No valid sales rows to import.');
  }

  const inserted = await SalesCustomer.insertMany(prepared, { ordered: false });
  logSalesActivityMany({ sales: inserted, user: req.user, source: 'import' });

  res.status(201).json({
    importedCount: inserted.length,
    skippedCount: skipped.length,
    skipped
  });
});

const ACTIVITY_TIMEZONE = 'Africa/Addis_Ababa';
const countIf = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });
const hasType = (type) => ({ $in: [type, '$changeTypes'] });
const hasRemoved = (type) => ({ $in: [type, '$removedTypes'] });

// @desc    Read-only sales follow-up activity log with summary analysis
// @route   GET /api/sales-manager/activity-log
// @access  Private (Sales Manager and management roles)
const getSalesActivityLog = asyncHandler(async (req, res) => {
  if (!isAllowedManagerRole(req.user?.role)) {
    res.status(403);
    throw new Error('Access denied. Sales managers only.');
  }
  // Rebuilds earlier activity once if the server start did not, and waits for a
  // rebuild in progress so the first visit never shows an empty log (instant afterwards).
  await backfillSalesActivityHistory();

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const filter = {};

  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
    filter.createdAt = {};
    if (from && !Number.isNaN(from.getTime())) filter.createdAt.$gte = from;
    if (to && !Number.isNaN(to.getTime())) filter.createdAt.$lte = to;
  }
  if (['created', 'updated', 'deleted'].includes(req.query.action)) filter.action = req.query.action;
  if (req.query.changeType) filter.changeTypes = String(req.query.changeType);
  // An agent's activity: follow-ups they own, or changes they made.
  if (req.query.agent && mongoose.Types.ObjectId.isValid(req.query.agent)) {
    filter.$or = [{ agentId: String(req.query.agent) }, { actorId: new mongoose.Types.ObjectId(req.query.agent) }];
  }
  if (req.query.search?.trim()) {
    const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    const searchOr = [{ customerName: regex }, { phone: regex }, { courseName: regex }, { actorName: regex }, { agentName: regex }];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
  }

  const [result] = await SalesActivityLog.aggregate([
    { $match: filter },
    { $facet: {
      rows: [{ $sort: { createdAt: -1, _id: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
      totals: [{ $group: {
        _id: null,
        total: { $sum: 1 },
        created: countIf({ $eq: ['$action', 'created'] }),
        updated: countIf({ $eq: ['$action', 'updated'] }),
        deleted: countIf({ $eq: ['$action', 'deleted'] }),
        completed: countIf(hasType('completed')),
        slipAdded: countIf(hasType('payment_slip_added')),
        slipReplaced: countIf(hasType('payment_slip_replaced')),
        slipRemoved: countIf({ $or: [hasType('payment_slip_removed'), hasType('payment_slip_deleted')] }),
      } }],
      byPerson: [
        { $group: {
          _id: { $ifNull: ['$actorId', '$actorName'] },
          name: { $first: '$actorName' },
          role: { $first: '$actorRole' },
          total: { $sum: 1 },
          created: countIf({ $eq: ['$action', 'created'] }),
          updated: countIf({ $eq: ['$action', 'updated'] }),
          deleted: countIf({ $eq: ['$action', 'deleted'] }),
          slipAdded: countIf(hasType('payment_slip_added')),
          slipRemoved: countIf({ $or: [hasType('payment_slip_removed'), hasType('payment_slip_deleted')] }),
          lastActivity: { $max: '$createdAt' },
        } },
        { $sort: { total: -1 } },
        { $limit: 50 },
      ],
      byDay: [
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ACTIVITY_TIMEZONE } },
          created: countIf({ $eq: ['$action', 'created'] }),
          updated: countIf({ $eq: ['$action', 'updated'] }),
          deleted: countIf({ $eq: ['$action', 'deleted'] }),
        } },
        { $sort: { _id: -1 } },
        { $limit: 31 },
        { $sort: { _id: 1 } },
      ],
    } },
  ]);

  const totals = result?.totals?.[0] || {};
  const total = totals.total || 0;
  res.json({
    data: result?.rows || [],
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    summary: {
      total,
      created: totals.created || 0,
      updated: totals.updated || 0,
      deleted: totals.deleted || 0,
      completed: totals.completed || 0,
      slipAdded: totals.slipAdded || 0,
      slipReplaced: totals.slipReplaced || 0,
      slipRemoved: totals.slipRemoved || 0,
      byPerson: (result?.byPerson || []).map(({ _id, ...person }) => ({ id: String(_id || ''), ...person })),
      byDay: (result?.byDay || []).map(({ _id, ...day }) => ({ date: _id, ...day })),
    },
  });
});

// @desc    Read-only archive of removed payment slips/documents and deleted follow-ups
// @route   GET /api/sales-manager/removals
// @access  Private (Sales Manager and management roles)
const getSalesRemovals = asyncHandler(async (req, res) => {
  if (!isAllowedManagerRole(req.user?.role)) {
    res.status(403);
    throw new Error('Access denied. Sales managers only.');
  }
  const { SalesRemovalArchive } = require('../models/SalesRemovalArchive');
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const filter = {};

  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
    filter.createdAt = {};
    if (from && !Number.isNaN(from.getTime())) filter.createdAt.$gte = from;
    if (to && !Number.isNaN(to.getTime())) filter.createdAt.$lte = to;
  }
  if (req.query.type === 'followup_deleted') filter.kind = 'followup_deleted';
  else if (req.query.type === 'slip_removed') filter.removedTypes = { $in: ['payment_slip_removed', 'payment_slip_deleted'] };
  else if (req.query.type === 'slip_replaced') filter.removedTypes = 'payment_slip_replaced';
  else if (req.query.type === 'other_document') {
    filter.kind = 'document_removed';
    filter['documents.field'] = { $ne: 'paymentScreenshot' };
  }
  if (req.query.agent && mongoose.Types.ObjectId.isValid(req.query.agent)) {
    filter.$or = [{ agentId: String(req.query.agent) }, { actorId: new mongoose.Types.ObjectId(req.query.agent) }];
  }
  if (req.query.search?.trim()) {
    const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    const searchOr = [{ customerName: regex }, { phone: regex }, { courseName: regex }, { actorName: regex }, { agentName: regex }];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
  }

  const [result] = await SalesRemovalArchive.aggregate([
    { $match: filter },
    { $facet: {
      rows: [{ $sort: { createdAt: -1, _id: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
      totals: [{ $group: {
        _id: null,
        total: { $sum: 1 },
        followupsDeleted: countIf({ $eq: ['$kind', 'followup_deleted'] }),
        slipsRemoved: countIf({ $or: [hasRemoved('payment_slip_removed'), hasRemoved('payment_slip_deleted')] }),
        slipsReplaced: countIf(hasRemoved('payment_slip_replaced')),
        otherDocuments: { $sum: { $size: { $filter: { input: '$documents', as: 'doc', cond: { $ne: ['$$doc.field', 'paymentScreenshot'] } } } } },
      } }],
      byPerson: [
        { $group: {
          _id: { $ifNull: ['$actorId', '$actorName'] },
          name: { $first: '$actorName' },
          role: { $first: '$actorRole' },
          total: { $sum: 1 },
          followupsDeleted: countIf({ $eq: ['$kind', 'followup_deleted'] }),
          slipsRemoved: countIf({ $or: [hasRemoved('payment_slip_removed'), hasRemoved('payment_slip_deleted')] }),
          slipsReplaced: countIf(hasRemoved('payment_slip_replaced')),
          lastRemoval: { $max: '$createdAt' },
        } },
        { $sort: { total: -1 } },
        { $limit: 50 },
      ],
    } },
  ]);

  const totals = result?.totals?.[0] || {};
  const total = totals.total || 0;
  res.json({
    data: result?.rows || [],
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    summary: {
      total,
      followupsDeleted: totals.followupsDeleted || 0,
      slipsRemoved: totals.slipsRemoved || 0,
      slipsReplaced: totals.slipsReplaced || 0,
      otherDocuments: totals.otherDocuments || 0,
      byPerson: (result?.byPerson || []).map(({ _id, ...person }) => ({ id: String(_id || ''), ...person })),
    },
  });
});

// @desc    One archived (removed) document image, for viewing
// @route   GET /api/sales-manager/removals/documents/:documentId
// @access  Private (Sales Manager and management roles)
const getSalesRemovedDocument = asyncHandler(async (req, res) => {
  if (!isAllowedManagerRole(req.user?.role)) {
    res.status(403);
    throw new Error('Access denied. Sales managers only.');
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.documentId)) {
    res.status(404);
    throw new Error('Removed document not found');
  }
  const { SalesRemovedDocument } = require('../models/SalesRemovalArchive');
  const document = await SalesRemovedDocument.findById(req.params.documentId).select('field label data createdAt').lean();
  if (!document) {
    res.status(404);
    throw new Error('Removed document not found');
  }
  res.json(document);
});

module.exports = {
  getSalesRemovals,
  getSalesRemovedDocument,
  getAllSales,
  updateSupervisorComment,
  getAllAgents,
  getTeamPerformance,
  getDashboardStats,
  getAgentSales,
  importSales,
  getSalesActivityLog
};
