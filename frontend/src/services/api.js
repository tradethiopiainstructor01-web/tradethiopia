import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const API = axios.create({ baseURL }); // Update baseURL if needed

// Fetch all assets
export const fetchAssets = () => API.get('/assets').then(response => response.data);

// Fetch categories
export const fetchCategories = () => API.get('/categories').then(response => response.data);

// Fetch users
export const fetchUsers = () => API.get('/users').then(response => response.data);

// Fetch user counts
export const fetchUserCounts = () => API.get('/users/count').then(response => response.data);

// Add a new asset
export const createAsset = (asset) => API.post('/assets', asset).then(response => response.data);

// Update an asset
export const updateAsset = (id, asset) => API.put(`/assets/${id}`, asset).then(response => response.data);

// Delete an asset
export const deleteAsset = (id) => API.delete(`/assets/${id}`).then(response => response.data);

// Training follow-ups
export const fetchTrainingFollowups = (params) =>
  API.get('/training-followups', { params }).then(response => response.data);

export const createTrainingFollowup = (data) =>
  API.post('/training-followups', data).then(response => response.data);

export const updateTrainingFollowup = (id, data) =>
  API.put(`/training-followups/${id}`, data).then(response => response.data);

export const deleteTrainingFollowup = (id) =>
  API.delete(`/training-followups/${id}`).then(response => response.data);

// ENSRA follow-ups
export const fetchEnsraFollowups = (params) =>
  API.get('/ensra-followups', { params }).then(response => response.data);

export const createEnsraFollowup = (data) =>
  API.post('/ensra-followups', data).then(response => response.data);

export const updateEnsraFollowup = (id, data) =>
  API.put(`/ensra-followups/${id}`, data).then(response => response.data);

export const deleteEnsraFollowup = (id) =>
  API.delete(`/ensra-followups/${id}`).then(response => response.data);
