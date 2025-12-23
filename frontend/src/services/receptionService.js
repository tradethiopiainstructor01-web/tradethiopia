import axiosInstance from './axiosInstance';

// Normalize phone number for consistent storage and comparison
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Handle Ethiopian phone numbers
  if (normalized.startsWith('+251')) {
    normalized = '0' + normalized.substring(4);
  } else if (normalized.startsWith('251')) {
    normalized = '0' + normalized.substring(3);
  } else if (normalized.startsWith('9')) {
    normalized = '0' + normalized;
  }
  
  return normalized;
};

// Get all customers with optional filters
export const getFilteredCustomers = async (filters = {}) => {
  try {
    const params = {};
    
    // Add filters to params if they exist
    if (filters.name) params.name = filters.name;
    if (filters.phone) params.phone = normalizePhoneNumber(filters.phone);
    if (filters.agent) params.agent = filters.agent;
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.productInterest) params.productInterest = filters.productInterest;
    
    const response = await axiosInstance.get('/sales-customers', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all agents for the agent dropdown
export const getAllAgents = async () => {
  try {
    const response = await axiosInstance.get('/users', { params: { role: 'sales' } });
    const users = response?.data?.data ?? [];
    // Guard against unexpected response shapes
    if (!Array.isArray(users)) {
      return [];
    }
    return users.filter((user) =>
      (user.role || '').toString().trim().toLowerCase().includes('sales')
    );
  } catch (error) {
    throw error;
  }
};

// Update customer (reception can update basic info)
export const updateCustomer = async (id, customerData) => {
  try {
    const response = await axiosInstance.put(`/sales-customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Assign agent to customer
export const assignAgent = async (customerId, agentId) => {
  try {
    const response = await axiosInstance.put(`/sales-customers/${customerId}`, {
      agentId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reception-specific customer creation
export const createReceptionCustomer = async (customerData) => {
  try {
    const payload = {
      ...customerData,
      source: 'Reception',
      pipelineStatus: 'Pending Assignment'
    };
    const response = await axiosInstance.post('/sales-customers', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};
