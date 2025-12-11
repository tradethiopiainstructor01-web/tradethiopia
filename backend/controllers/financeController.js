const InventoryItem = require('../models/InventoryItem');
const SalesCustomer = require('../models/SalesCustomer');
const User = require('../models/user.model');
const Purchase = require('../models/Purchase');
const { calculateCommission } = require('../utils/commission');

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

// New function to get purchase data for finance dashboard
exports.getPurchaseSummary = async (req, res) => {
  try {
    const totalPurchases = await Purchase.countDocuments();
    
    const stats = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalDeclarationValue: { $sum: '$totalDeclarationValue' },
          totalOtherCost: { $sum: '$totalOtherCost' },
          totalProfitMargin: { $sum: '$totalProfitMargin' },
          totalSellingPrice: { $sum: '$totalSellingPrice' },
          avgItemsPerPurchase: { $avg: '$totalItems' }
        }
      }
    ]);
    
    const purchaseStats = stats.length > 0 ? stats[0] : {
      totalDeclarationValue: 0,
      totalOtherCost: 0,
      totalProfitMargin: 0,
      totalSellingPrice: 0,
      avgItemsPerPurchase: 0
    };

    res.json({
      totalPurchases,
      ...purchaseStats
    });
  } catch (err) {
    console.error('Error fetching purchase summary:', err);
    res.status(500).json({ message: 'Failed to fetch purchase summary' });
  }
};

// New function to get recent purchases for finance dashboard
exports.getRecentPurchases = async (req, res) => {
  try {
    const recentPurchases = await Purchase.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('referenceNumber supplier totalDeclarationValue totalOtherCost totalSellingPrice createdAt');

    res.json(recentPurchases);
  } catch (err) {
    console.error('Error fetching recent purchases:', err);
    res.status(500).json({ message: 'Failed to fetch recent purchases' });
  }
};
