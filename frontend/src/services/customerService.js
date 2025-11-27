import axios from 'axios';

// Use main project backend API
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = axios.create({ baseURL });

// Set auth token for requests
const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
};

// Get all customers for logged in agent
export const getAllCustomers = async () => {
  const token = localStorage.getItem('userToken');
  setAuthToken(token);
  
  try {
    const response = await API.get('/api/sales-customers');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch customers');
  }
};

// Create a new customer
export const createCustomer = async (customer) => {
  const token = localStorage.getItem('userToken');
  setAuthToken(token);
  
  try {
    const response = await API.post('/api/sales-customers', customer);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create customer');
  }
};

// Update a customer
export const updateCustomer = async (id, customer) => {
  const token = localStorage.getItem('userToken');
  setAuthToken(token);
  
  try {
    const response = await API.put(`/api/sales-customers/${id}`, customer);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update customer');
  }
};

// Delete a customer
export const deleteCustomer = async (id) => {
  const token = localStorage.getItem('userToken');
  setAuthToken(token);
  
  try {
    const response = await API.delete(`/api/sales-customers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete customer');
  }
};