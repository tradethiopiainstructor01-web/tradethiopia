import axiosInstance from './axiosInstance';

// Fetch users and filter for customer service roles
export const getCustomerServiceUsers = async () => {
  const response = await axiosInstance.get('/users');
  // Normalize common response shapes
  const payload = response?.data;
  const usersArray =
    Array.isArray(payload) ? payload
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.users) ? payload.users
    : [];

  return usersArray.filter((u) => {
    const role = (u.role || u.userRole || '').toString().toLowerCase();
    return role === 'customerservice' || role === 'customersuccessmanager';
  });
};
