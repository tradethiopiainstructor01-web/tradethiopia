import axiosInstance from './axiosInstance';

// Fetch reception-originated customers that still require assignment
export const getPendingReceptionCustomers = async (filters = {}) => {
  try {
    const params = {
      pipelineStatus: 'Pending Assignment',
      ...filters
    };
    const response = await axiosInstance.get('/salescustomers', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Assign a customer to a specific agent (Sales Manager only)
export const assignCustomerToAgent = async (customerId, agentId) => {
  try {
    const response = await axiosInstance.put(`/salescustomers/${customerId}/assign`, {
      assignedAgentId: agentId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
