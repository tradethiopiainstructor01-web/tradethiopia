import axiosInstance from './axiosInstance';

// Get all customers for logged in agent
export const getAllCustomers = async () => {
  try {
    const response = await axiosInstance.get('/sales-customers');
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
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