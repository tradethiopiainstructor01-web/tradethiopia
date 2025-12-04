const SalesCustomer = require('../models/SalesCustomer');
const User = require('../models/user.model');
const asyncHandler = require('express-async-handler');

// @desc    Get all sales for sales manager (all agents)
// @route   GET /api/sales-manager/all-sales
// @access  Private (Sales Manager only)
const getAllSales = asyncHandler(async (req, res) => {
  try {
    // Only sales managers can access this
    if (req.user.role !== 'salesmanager') {
      res.status(403);
      throw new Error('Access denied. Sales managers only.');
    }

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
      filter.agentId = req.query.agentId;
    }

    // Get all completed sales from all agents with filters
    const sales = await SalesCustomer.find(filter)
      .sort({ date: -1 });

    // If no sales found, return empty array
    if (sales.length === 0) {
      return res.json([]);
    }

    // Populate agent information manually since agentId is stored as String
    const agentIds = [...new Set(sales.map(sale => sale.agentId))];
    
    // Filter out any falsy agent IDs
    const validAgentIds = agentIds.filter(id => id);
    if (validAgentIds.length === 0) {
      return res.json(sales.map(sale => sale.toObject()));
    }
    
    const agents = await User.find({ _id: { $in: validAgentIds } }, 'username fullName email');
    
    const agentMap = agents.reduce((map, agent) => {
      map[agent._id.toString()] = agent;
      return map;
    }, {});

    // Attach agent information to sales
    const salesWithAgents = sales.map(sale => {
      const saleObj = sale.toObject();
      return {
        ...saleObj,
        agentId: agentMap[sale.agentId] || null
      };
    });

    res.json(salesWithAgents);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching all sales", 
      error: error.message 
    });
  }
});

// @desc    Update supervisor comment for a sale
// @route   PUT /api/sales-manager/sales/:id/supervisor-comment
// @access  Private (Sales Manager only)
const updateSupervisorComment = asyncHandler(async (req, res) => {
  try {
    // Only sales managers can access this
    if (req.user.role !== 'salesmanager') {
      res.status(403);
      throw new Error('Access denied. Sales managers only.');
    }

    const { supervisorComment } = req.body;
    const saleId = req.params.id;

    // Update the supervisor comment
    const updatedSale = await SalesCustomer.findByIdAndUpdate(
      saleId,
      { supervisorComment },
      { new: true }
    );

    if (!updatedSale) {
      res.status(404);
      throw new Error('Sale not found');
    }

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
// @access  Private (Sales Manager only)
const getAllAgents = asyncHandler(async (req, res) => {
  try {
    // Only sales managers can access this
    if (req.user.role !== 'salesmanager') {
      res.status(403);
      throw new Error('Access denied. Sales managers only.');
    }

    // Get all sales agents with basic info
    const agents = await User.find({ role: 'sales' }, 'username fullName email phone status');

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
// @access  Private (Sales Manager only)
const getTeamPerformance = asyncHandler(async (req, res) => {
  try {
    // Only sales managers can access this
    if (req.user.role !== 'salesmanager') {
      res.status(403);
      throw new Error('Access denied. Sales managers only.');
    }

    // Get all sales agents
    const agents = await User.find({ role: 'sales' });

    // Calculate performance metrics for each agent
    const agentPerformance = await Promise.all(agents.map(async (agent) => {
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
        agentId: agent._id,
        agentName: agent.fullName || agent.username,
        agentEmail: agent.email,
        completedDeals,
        totalCommission
      };
    }));

    // Calculate course distribution
    // Build date filter based on time range
    const dateFilter = {};
    const now = new Date();
    
    switch(req.query.timeRange) {
      case 'week':
        dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) };
        break;
      case 'quarter':
        dateFilter.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()) };
        break;
      case 'year':
        dateFilter.createdAt = { $gte: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) };
        break;
      default:
        // No date filter for 'all' or unspecified
        break;
    }
    
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
        salesTrend[monthKey].revenue += sale.commission?.netCommission || 0;
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
    const totalTeamCommission = agentPerformance.reduce((sum, agent) => sum + agent.totalCommission, 0);
    const averageCommission = agentPerformance.length > 0 ? totalTeamCommission / agentPerformance.length : 0;

    res.json({
      teamStats: {
        totalAgents: agents.length,
        totalTeamSales,
        totalTeamCommission,
        averageCommissionPerAgent: averageCommission
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
// @access  Private (Sales Manager only)
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Only sales managers can access this
    if (req.user.role !== 'salesmanager') {
      res.status(403);
      throw new Error('Access denied. Sales managers only.');
    }

    // Get all sales agents count
    const totalAgents = await User.countDocuments({ role: 'sales' });

    // Get all customers from all agents
    const totalCustomers = await SalesCustomer.countDocuments();

    // Get all completed deals from all agents
    const totalCompletedDeals = await SalesCustomer.countDocuments({ followupStatus: 'Completed' });

    // Calculate total revenue (sum of all commissions)
    const salesWithCommission = await SalesCustomer.find({
      followupStatus: 'Completed',
      'commission.netCommission': { $exists: true }
    });

    const totalRevenue = salesWithCommission.reduce((sum, sale) => {
      return sum + (sale.commission?.netCommission || 0);
    }, 0);

    // Get recent sales (last 30 days)
    const recentSales = await SalesCustomer.countDocuments({
      followupStatus: 'Completed',
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalAgents,
      totalCustomers,
      totalCompletedDeals,
      totalRevenue,
      recentSales
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching dashboard stats", 
      error: error.message 
    });
  }
});

module.exports = {
  getAllSales,
  updateSupervisorComment,
  getAllAgents,
  getTeamPerformance,
  getDashboardStats
};