import axiosInstance from './axiosInstance';

// Get all sales for sales manager
export const getAllSales = async (filters = {}) => {
  const token = localStorage.getItem('userToken');
  // token will be attached by axiosInstance interceptor; keep local logging
  
  try {
    console.log('Fetching all sales with token:', token ? token.substring(0, 10) + '...' : 'null');
    console.log('Filters:', filters);
    const response = await axiosInstance.get('/sales-manager/all-sales', { params: filters });
    console.log('All sales response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all sales:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

// Get all agents
export const getAllAgents = async () => {
  const token = localStorage.getItem('userToken');
  // token attached by axiosInstance
  
  try {
    console.log('Fetching all agents with token:', token ? token.substring(0, 10) + '...' : 'null');
    const response = await axiosInstance.get('/sales-manager/agents');
    console.log('All agents response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching agents:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

// Update supervisor comment
export const updateSupervisorComment = async (saleId, supervisorComment) => {
  const token = localStorage.getItem('userToken');
  // token attached by axiosInstance
  
  try {
    console.log('Updating supervisor comment with token:', token ? token.substring(0, 10) + '...' : 'null');
    console.log('Sale ID:', saleId);
    console.log('Supervisor comment:', supervisorComment);
    const response = await axiosInstance.put(`/sales-manager/sales/${saleId}/supervisor-comment`, { supervisorComment });
    console.log('Update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating supervisor comment:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

// Get dashboard stats
export const getDashboardStats = async () => {
  const token = localStorage.getItem('userToken');
  // token attached by axiosInstance
  
  try {
    console.log('Fetching dashboard stats with token:', token ? token.substring(0, 10) + '...' : 'null');
    const response = await axiosInstance.get('/sales-manager/dashboard-stats');
    console.log('Dashboard stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

// Get team performance stats
export const getTeamPerformance = async (timeRange = 'all') => {
  const token = localStorage.getItem('userToken');
  // token attached by axiosInstance
  
  try {
    console.log('Fetching team performance with token:', token ? token.substring(0, 10) + '...' : 'null');
    const response = await axiosInstance.get(`/sales-manager/team-performance?timeRange=${timeRange}`);
    console.log('Team performance response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching team performance:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

/**
 * Get sales forecast data
 * @param {Object} options - Options for the forecast
 * @param {string} options.range - Time range for the forecast (week/month/quarter/year)
 * @returns {Promise<Object>} Forecast data including actual and predicted values
 */
export const getSalesForecast = async ({ range = 'month' } = {}) => {
  try {
    console.log('Fetching sales forecast with range:', range);
    
    // In a real app, this would be an API call:
    // const response = await axiosInstance.get('/sales-manager/forecast', { params: { range } });
    // return response.data;
    
    // Mock data for development
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const forecastMonths = months.slice(0, 12);
    
    // Generate mock data
    const actualData = Array(12).fill(0).map((_, i) => {
      const monthOffset = (i - currentMonth) * 1.1;
      return Math.floor(50000 + Math.random() * 50000 * (1 + monthOffset * 0.1));
    });
    
    const forecastData = actualData.map((val, i) => 
      i <= currentMonth ? val : Math.floor(val * (0.9 + Math.random() * 0.3))
    );
    
    const confidence = forecastData.map(() => Math.floor(Math.random() * 30) + 70);
    
    return {
      labels: forecastMonths,
      actual: actualData,
      forecast: forecastData,
      confidence
    };
    
  } catch (error) {
    console.error('Error fetching sales forecast:', error);
    console.error('Error response:', error.response);
    
    // Return mock data even if there's an error in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock forecast data due to error');
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        actual: [45000, 52000, 48000, 61000, 72000, 85000, 92000, 88000, 95000, 102000, 110000, 120000],
        forecast: [45000, 52000, 48000, 61000, 72000, 85000, 92000, 88000, 95000, 102000, 110000, 120000],
        confidence: [85, 82, 88, 90, 87, 85, 83, 85, 88, 86, 85, 84]
      };
    }
    
    throw error;
  }
};

/**
 * Get agent's commission by matching agent name with username
 * @param {string} username - The username to match against agent names
 * @param {string} month - The month to filter sales (optional)
 * @param {string} year - The year to filter sales (optional)
 * @returns {Promise<number>} The total commission for the agent
 */
export const getAgentCommissionByUsername = async (username, month, year) => {
  try {
    console.log('Fetching commission data for username:', username, 'month:', month, 'year:', year);
    
    // For now, we'll return 0 as we need to implement proper commission calculation
    // This should be replaced with actual commission data from the payroll system
    return 0;
  } catch (error) {
    console.error('Error calculating agent commission:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

// Import sales rows
export const importSales = async (sales = []) => {
  const token = localStorage.getItem('userToken');
  // token attached by axiosInstance

  try {
    console.log('Importing sales with token:', token ? token.substring(0, 10) + '...' : 'null');
    const response = await axiosInstance.post('/sales-manager/import-sales', { sales });
    console.log('Import sales response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error importing sales:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};
