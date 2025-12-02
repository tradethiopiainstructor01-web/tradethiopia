import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = axios.create({ baseURL });

const setAuthToken = (token) => {
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
};

export const getAllProductFollowups = async () => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.get('/api/product-followups');
  return res.data;
};

export const createProductFollowup = async (data) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post('/api/product-followups', data);
  return res.data;
};

export const updateProductFollowup = async (id, data) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.put(`/api/product-followups/${id}`, data);
  return res.data;
};

export const deleteProductFollowup = async (id) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.delete(`/api/product-followups/${id}`);
  return res.data;
};

export const processOrder = async (followupId, items) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post(`/api/followups/${followupId}/process-order`, { items });
  return res.data;
};

export const reserveOrder = async (followupId, items) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post(`/api/followups/${followupId}/reserve`, { items });
  return res.data;
};

export const previewReserve = async (followupId, items) => {
  setAuthToken(localStorage.getItem('userToken'));
  const res = await API.post(`/api/followups/${followupId}/reserve/preview`, { items });
  return res.data;
};
