const InventoryItem = require('../models/InventoryItem');
const SalesCustomer = require('../models/SalesCustomer');
const User = require('../models/user.model');

// Standardized commission calculation function
const calculateCommission = (salesValue) => {
  // Standard commission rate: 10%
  const commissionRate = 0.10;
  // Tax on commission: 5%
  const taxRate = 0.05;
  
  const grossCommission = salesValue * commissionRate;
  const commissionTax = grossCommission * taxRate;
  const netCommission = grossCommission - commissionTax;
  
  return {
    grossCommission: Math.round(grossCommission),
    commissionTax: Math.round(commissionTax),
    netCommission: Math.round(netCommission)
  };
};

exports.getMetrics = async (req, res) => {
  try {
    // Compute stock value: sum(price * quantity)
    const items = await InventoryItem.find({});
    const stockValue = items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 0)), 0);
    const totalProducts = items.length;
    const totalStockItems = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

    // For now, revenue and outstanding invoices are placeholders until a payments/invoices model exists
    const totalRevenue = 0;
    const outstandingInvoices = 0;

    res.json({
      totalRevenue,
      outstandingInvoices,
      stockValue,
      totalProducts,
      totalStockItems
    });
  } catch (err) {
    console.error('Error fetching finance metrics:', err);
    res.status(500).json({ message: 'Failed to fetch finance metrics' });
  }
};

// New function to get agent sales performance data for finance dashboard
exports.getAgentSalesPerformance = async (req, res) => {
  try {
    // Get all sales agents
    const agents = await User.find({ role: 'sales' });

    // Calculate performance metrics for each agent
    const agentPerformance = await Promise.all(agents.map(async (agent) => {
      // Get all completed sales for this agent
      const completedDeals = await SalesCustomer.countDocuments({
        agentId: agent._id,
        followupStatus: 'Completed'
      });

      // Get all completed sales for this agent
      const sales = await SalesCustomer.find({
        agentId: agent._id,
        followupStatus: 'Completed'
      });

      // Calculate gross and net commission for this agent
      let totalGrossCommission = 0;
      let totalNetCommission = 0;
      let totalSales = 0;
      
      sales.forEach(sale => {
        const coursePrice = sale.coursePrice || 0;
        
        // Calculate commission using standardized function
        const commissionData = calculateCommission(coursePrice);
        
        totalGrossCommission += commissionData.grossCommission;
        totalNetCommission += commissionData.netCommission;
        totalSales += coursePrice;
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
        averageGrossCommissionPerAgent: Math.round(averageGrossCommission)
      },
      agentPerformance
    });
  } catch (err) {
    console.error('Error fetching agent sales performance:', err);
    res.status(500).json({ message: 'Failed to fetch agent sales performance' });
  }
};