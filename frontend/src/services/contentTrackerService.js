import axiosInstance from './axiosInstance';

const unwrap = (response) => response?.data ?? response;

export const fetchContentTrackerEntries = (params) =>
  axiosInstance
    .get('/content-tracker', { params })
    .then((response) => unwrap(response));

export const createContentTrackerEntry = (payload) =>
  axiosInstance
    .post('/content-tracker', payload)
    .then((response) => unwrap(response));

export const updateContentTrackerEntry = (id, payload) =>
  axiosInstance
    .put(`/content-tracker/${id}`, payload)
    .then((response) => unwrap(response));

export const deleteContentTrackerEntry = (id) =>
  axiosInstance
    .delete(`/content-tracker/${id}`)
    .then((response) => unwrap(response));
