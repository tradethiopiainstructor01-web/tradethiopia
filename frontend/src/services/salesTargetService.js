import axiosInstance from './axiosInstance';

// Set or update sales targets for an agent
export const setSalesTarget = async (targetData) => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.post('/sales-targets', targetData);
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Get sales targets for an agent
export const getSalesTargets = async (agentId, params = {}) => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.get(`/sales-targets/${agentId}`, { params });
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Get current user's sales targets
export const getMySalesTargets = async () => {
  const token = localStorage.getItem('userToken');
  
  try {
    // First get the current user's info
    const userResponse = await axiosInstance.get('/users/profile');
    const userId = userResponse.data._id;
    
    // Then get their targets
    const response = await axiosInstance.get(`/sales-targets/${userId}`);
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Get current sales targets for all agents
export const getCurrentSalesTargets = async () => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.get('/sales-targets');
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Get sales stats for the current agent
export const getAgentSalesStats = async () => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.get('/sales-customers/stats');
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Delete a sales target
export const deleteSalesTarget = async (targetId) => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.delete(`/sales-targets/${targetId}`);
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};
