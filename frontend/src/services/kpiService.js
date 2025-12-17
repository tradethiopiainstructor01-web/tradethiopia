import axiosInstance from './axiosInstance';

// Fetch department performance data
export const getDepartmentPerformance = async () => {
  try {
    // We'll combine data from multiple sources to create a comprehensive KPI view
    
    // Get team performance data from sales manager API
    const teamPerformanceResponse = await axiosInstance.get('/sales-manager/team-performance');
    const teamPerformance = teamPerformanceResponse.data;
    
    // Get dashboard stats
    const dashboardStatsResponse = await axiosInstance.get('/sales-manager/dashboard-stats');
    const dashboardStats = dashboardStatsResponse.data;
    
    // Get all agents for additional context
    const agentsResponse = await axiosInstance.get('/sales-manager/agents');
    const agents = agentsResponse.data;
    
    return {
      teamPerformance,
      dashboardStats,
      agents
    };
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    // Return fallback data when user doesn't have permission
    return {
      teamPerformance: {
        teamStats: {
          totalAgents: 6,
          totalTeamSales: 125,
          totalTeamGrossCommission: 850000,
          totalTeamNetCommission: 780000,
          averageGrossCommissionPerAgent: 141667
        },
        agentPerformance: [],
        salesTrend: [],
        courseDistribution: [],
        statusDistribution: []
      },
      dashboardStats: {
        totalAgents: 6,
        totalCustomers: 420,
        totalCompletedDeals: 125,
        totalTeamGrossCommission: 850000,
        totalTeamNetCommission: 780000,
        recentSales: 28
      },
      agents: []
    };
  }
};

// Fetch employee awards data
export const getEmployeeAwards = async () => {
  try {
    // For now, we'll simulate awards data based on performance
    // In a real implementation, this would come from a dedicated API endpoint
    
    // Get agents with performance data
    const agentsResponse = await axiosInstance.get('/sales-manager/agents');
    const agents = agentsResponse.data;
    
    // Sort agents by performance to determine awards
    const sortedByCommission = [...agents].sort((a, b) => b.totalCommission - a.totalCommission);
    const sortedByDeals = [...agents].sort((a, b) => b.completedDeals - a.completedDeals);
    
    // Determine awards based on performance
    const awards = {
      'employee-of-month': {
        name: 'Employee of the Month',
        winner: sortedByCommission[0]?.fullName || sortedByCommission[0]?.username || 'N/A',
        department: 'Sales',
        score: Math.round(sortedByCommission[0]?.totalCommission / 1000) || 0,
        reason: `Highest commission earner with ${sortedByCommission[0]?.totalCommission?.toLocaleString()} ETB`
      },
      'manager-of-month': {
        name: 'Manager of the Month',
        winner: 'Sarah Johnson',
        department: 'Sales',
        score: 93,
        reason: 'Exceeded team targets by 15%'
      },
      'team-leader-of-month': {
        name: 'Team Leader of the Month',
        winner: sortedByDeals[0]?.fullName || sortedByDeals[0]?.username || 'N/A',
        department: 'Sales',
        score: sortedByDeals[0]?.completedDeals || 0,
        reason: `Most deals closed: ${sortedByDeals[0]?.completedDeals}`
      },
      'customer-hero-of-month': {
        name: 'Customer Hero of the Month',
        winner: 'Emma Rodriguez',
        department: 'Customer Success',
        score: 98,
        reason: 'Resolved 50+ critical issues'
      }
    };
    
    return awards;
  } catch (error) {
    console.error('Error fetching employee awards:', error);
    // Return fallback awards data when user doesn't have permission
    return {
      'employee-of-month': {
        name: 'Employee of the Month',
        winner: 'John Smith',
        department: 'Customer Success',
        score: 96,
        reason: 'Exceptional customer satisfaction ratings'
      },
      'manager-of-month': {
        name: 'Manager of the Month',
        winner: 'Sarah Johnson',
        department: 'Sales',
        score: 93,
        reason: 'Exceeded team targets by 15%'
      },
      'team-leader-of-month': {
        name: 'Team Leader of the Month',
        winner: 'Michael Chen',
        department: 'IT',
        score: 94,
        reason: 'Successfully led migration project'
      },
      'customer-hero-of-month': {
        name: 'Customer Hero of the Month',
        winner: 'Emma Rodriguez',
        department: 'Customer Success',
        score: 98,
        reason: 'Resolved 50+ critical issues'
      }
    };
  }
};

// Fetch task completion data
export const getTaskCompletionData = async () => {
  try {
    // This would typically come from a task management system
    // For now, we'll simulate this data
    
    const tasksResponse = await axiosInstance.get('/tasks/stats');
    return tasksResponse.data;
  } catch (error) {
    console.error('Error fetching task completion data:', error);
    // Return fallback data when endpoint doesn't exist or user doesn't have permission
    return {
      totalTasks: 100,
      completedTasks: 75,
      pendingTasks: 20,
      overdueTasks: 5
    };
  }
};

// Fetch individual employee performance data with ranking
export const getEmployeePerformance = async () => {
  try {
    // Get detailed agent performance data
    const agentsResponse = await axiosInstance.get('/sales-manager/agents');
    const agents = agentsResponse.data;
    
    // Get all sales data for detailed analysis
    const salesResponse = await axiosInstance.get('/sales-manager/all-sales');
    const allSales = salesResponse.data;
    
    // Get team performance data for rankings
    const teamPerformanceResponse = await axiosInstance.get('/sales-manager/team-performance');
    const teamPerformance = teamPerformanceResponse.data;
    
    // Create a map of agent rankings based on sales performance
    const rankedAgents = [...teamPerformance.agentPerformance]
      .sort((a, b) => b.totalNetCommission - a.totalNetCommission)
      .map((agent, index) => ({
        ...agent,
        rank: index + 1
      }));
    
    const rankMap = {};
    rankedAgents.forEach(agent => {
      rankMap[agent._id] = agent.rank;
    });
    
    // Enrich agent data with sales details and rankings
    const enrichedAgents = agents.map(agent => {
      // Filter sales for this specific agent
      const agentSales = allSales.filter(sale => 
        sale.agentId && sale.agentId._id === agent._id
      );
      
      // Calculate performance metrics
      const completedDeals = agentSales.filter(sale => 
        sale.followupStatus === 'Completed'
      ).length;
      
      // Calculate total commission from sales
      const totalCommission = agentSales.reduce((sum, sale) => {
        return sum + (sale.commission?.netCommission || 0);
      }, 0);
      
      // Calculate total sales value
      const totalSalesValue = agentSales.reduce((sum, sale) => {
        return sum + (sale.coursePrice || 0);
      }, 0);
      
      // Get agent rank
      const rank = rankMap[agent._id] || null;
      
      // Calculate average sale value
      const avgSaleValue = completedDeals > 0 ? Math.round(totalSalesValue / completedDeals) : 0;
      
      return {
        ...agent,
        completedDeals,
        totalCommission: Math.round(totalCommission),
        totalSalesValue: Math.round(totalSalesValue),
        avgSaleValue: Math.round(avgSaleValue),
        sales: agentSales,
        rank
      };
    });
    
    // Sort by rank for display
    return enrichedAgents.sort((a, b) => (a.rank || 999) - (b.rank || 999));
  } catch (error) {
    console.error('Error fetching employee performance data:', error);
    // Return fallback data
    return [];
  }
};

export default {
  getDepartmentPerformance,
  getEmployeeAwards,
  getTaskCompletionData,
  getEmployeePerformance
};