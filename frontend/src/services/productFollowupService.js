import axiosInstance from './axiosInstance';

export const getAllProductFollowups = async () => {
  const res = await axiosInstance.get('/product-followups');
  return res.data;
};

export const createProductFollowup = async (data) => {
  const res = await axiosInstance.post('/product-followups', data);
  return res.data;
};

export const updateProductFollowup = async (id, data) => {
  const res = await axiosInstance.put(`/product-followups/${id}`, data);
  return res.data;
};

export const deleteProductFollowup = async (id) => {
  const res = await axiosInstance.delete(`/product-followups/${id}`);
  return res.data;
};

export const processOrder = async (followupId, items) => {
  const res = await axiosInstance.post(`/followups/${followupId}/process-order`, { items });
  return res.data;
};

export const reserveOrder = async (followupId, items) => {
  const res = await axiosInstance.post(`/followups/${followupId}/reserve`, { items });
  return res.data;
};

export const previewReserve = async (followupId, items) => {
  const res = await axiosInstance.post(`/followups/${followupId}/reserve/preview`, { items });
  return res.data;
};
