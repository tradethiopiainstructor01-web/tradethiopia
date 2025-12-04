import axiosInstance from './axiosInstance';

// Fetch all assets
export const fetchAssets = () => axiosInstance.get('/assets').then(response => response.data);

// Fetch categories
export const fetchCategories = () => axiosInstance.get('/categories').then(response => response.data);

// Fetch users
export const fetchUsers = () => axiosInstance.get('/users').then(response => response.data);

// Fetch user counts
export const fetchUserCounts = () => axiosInstance.get('/users/count').then(response => response.data);

// Add a new asset
export const createAsset = (asset) => axiosInstance.post('/assets', asset).then(response => response.data);

// Update an asset
export const updateAsset = (id, asset) => axiosInstance.put(`/assets/${id}`, asset).then(response => response.data);

// Delete an asset
export const deleteAsset = (id) => axiosInstance.delete(`/assets/${id}`).then(response => response.data);

// Training follow-ups
export const fetchTrainingFollowups = (params) =>
  axiosInstance.get('/training-followups', { params }).then(response => response.data);

export const createTrainingFollowup = (data) =>
  axiosInstance.post('/training-followups', data).then(response => response.data);

export const updateTrainingFollowup = (id, data) =>
  axiosInstance.put(`/training-followups/${id}`, data).then(response => response.data);

export const deleteTrainingFollowup = (id) =>
  axiosInstance.delete(`/training-followups/${id}`).then(response => response.data);

// ENSRA follow-ups
export const fetchEnsraFollowups = (params) =>
  axiosInstance.get('/ensra-followups', { params }).then(response => response.data);

export const createEnsraFollowup = (data) =>
  axiosInstance.post('/ensra-followups', data).then(response => response.data);

export const updateEnsraFollowup = (id, data) =>
  axiosInstance.put(`/ensra-followups/${id}`, data).then(response => response.data);

export const deleteEnsraFollowup = (id) =>


  API.delete(`/ensra-followups/${id}`).then(response => response.data);

  axiosInstance.delete(`/ensra-followups/${id}`).then(response => response.data);

// Courses
export const fetchCourses = () =>
  axiosInstance.get('/courses').then(response => response.data);

export const createCourse = (data) =>
  axiosInstance.post('/courses', data).then(response => response.data);

export const updateCourse = (id, data) =>
  axiosInstance.put(`/courses/${id}`, data).then(response => response.data);

export const deleteCourse = (id) =>


  axiosInstance.delete(`/courses/${id}`).then(response => response.data);

  axiosInstance.delete(`/courses/${id}`).then(response => response.data);


  axiosInstance.delete(`/courses/${id}`).then(response => response.data);

