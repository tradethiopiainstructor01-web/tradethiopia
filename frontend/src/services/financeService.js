import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = axios.create({ baseURL });

const setAuthToken = (token) => {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
};

export const getFinanceMetrics = async () => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.get('/api/finance/metrics');
  return res.data;
};

export const getOrders = async (opts = {}) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.get('/api/orders', { params: opts });
  return res.data; // { data, total, page, pages }
};

export const exportOrders = async (opts = {}) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.get('/api/orders/export', { params: opts, responseType: 'blob' });
  return res.data;
};

export const bulkFulfill = async (orderIds = []) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post('/api/orders/bulk-fulfill', { orderIds });
  return res.data;
};

export const fulfillOrder = async (followupId, orderId) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post(`/api/followups/${followupId}/orders/${orderId}/fulfill`);
  return res.data;
};

export const getDemands = async () => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.get('/api/demands');
  return res.data;
};

export const resolveDemand = async (id) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post(`/api/demands/${id}/resolve`);
  return res.data;
};
