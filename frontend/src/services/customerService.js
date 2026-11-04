import axiosInstance from './axiosInstance';

// Get all customers for logged in agent
export const getAllCustomers = async () => {
  try {
    // Summary rows mark stored documents instead of sending the images; screens
    // load a record's images on demand with withDocuments (utils/salesDocuments).
    const response = await axiosInstance.get('/sales-customers', { params: { fields: 'summary' } });
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Fast startup request. The dashboard can paint the newest rows without waiting
// for the complete follow-up history to be transferred and parsed.
export const getInitialCustomers = async (limit = 25) => {
  const response = await axiosInstance.get('/sales-customers', {
    params: { fields: 'summary', page: 1, limit }
  });
  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    total: Number(response.data?.pagination?.total) || 0
  };
};

// Create a new customer
export const createCustomer = async (customer) => {
  try {
    const response = await axiosInstance.post('/sales-customers', customer);
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Update a customer
export const updateCustomer = async (id, customer) => {
  try {
    const response = await axiosInstance.put(`/sales-customers/${id}`, customer);
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (id) => {
  try {
    const response = await axiosInstance.delete(`/sales-customers/${id}`);
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

export const sendCustomerEmail = async (id, emailData) => {
  try {
    const response = await axiosInstance.post(`/sales-customers/${id}/email`, emailData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sendCustomerSms = async (id, smsData) => {
  try {
    const response = await axiosInstance.post(`/sales-customers/${id}/sms`, smsData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
