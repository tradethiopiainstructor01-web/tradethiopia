import axiosInstance from './axiosInstance';

const api = axiosInstance;
const extractData = (response) => response?.data;

export const getCosts = (params = {}) => api.get('/costs', { params }).then(extractData);
export const createCost = (payload) => api.post('/costs', payload).then(extractData);
export const updateCost = (id, payload) => api.put(`/costs/${id}`, payload).then(extractData);
export const deleteCost = (id) => api.delete(`/costs/${id}`).then(extractData);
export const getCostStats = () => api.get('/costs/stats').then(extractData);

export default api;
