import axiosInstance from './axiosInstance';

// Fetch payroll data for a specific month
export const fetchPayrollData = async (month, params = {}) => {
  const response = await axiosInstance.get(`/payroll/${month}`, { params });
  return response.data;
};

// Calculate payroll for all employees
export const calculatePayroll = async (data) => {
  const response = await axiosInstance.post('/payroll/calculate', data);
  return response.data;
};

// Submit HR adjustment
export const submitHrAdjustment = async (data) => {
  // Log the user's role for debugging
  const userRole = localStorage.getItem('userRole');
  console.log('Current user role:', userRole);
  
  const response = await axiosInstance.post('/payroll/hr-adjust', data);
  return response.data;
};

// Submit Finance adjustment
export const submitFinanceAdjustment = async (data) => {
  const response = await axiosInstance.post('/payroll/finance-adjust', data);
  return response.data;
};

// Get detailed payroll view for an employee
export const getPayrollDetails = async (userId, params) => {
  const response = await axiosInstance.get(`/payroll/${userId}/details`, { params });
  return response.data;
};

// Approve payroll
export const approvePayroll = async (payrollId) => {
  const response = await axiosInstance.put(`/payroll/${payrollId}/approve`);
  return response.data;
};

// Lock payroll
export const lockPayroll = async (payrollId) => {
  const response = await axiosInstance.put(`/payroll/${payrollId}/lock`);
  return response.data;
};