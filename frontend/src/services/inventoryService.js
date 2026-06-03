import axiosInstance from './axiosInstance';

export const getAllInventory = async () => {
  const res = await axiosInstance.get('/inventory');
  return res.data;
};

export const createInventoryItem = async (data) => {
  const res = await axiosInstance.post('/inventory', data);
  return res.data;
};

export const updateInventoryItem = async (id, data) => {
  const res = await axiosInstance.put(`/inventory/${id}`, data);
  return res.data;
};

export const deleteInventoryItem = async (id) => {
  const res = await axiosInstance.delete(`/inventory/${id}`);
  return res.data;
};

export const deliverStock = async (id, amount) => {
  const res = await axiosInstance.post(`/inventory/${id}/deliver`, { amount });
  return res.data;
};

export const addBufferStock = async (id, amount) => {
  const res = await axiosInstance.post(`/inventory/${id}/add-buffer`, { amount });
  return res.data;
};

export const transferBufferToStock = async (id, amount) => {
  const res = await axiosInstance.post(`/inventory/${id}/transfer-buffer`, { amount });
  return res.data;
};

export const getMovements = async (id) => {
  const res = await axiosInstance.get(`/inventory/${id}/movements`);
  return res.data;
};
