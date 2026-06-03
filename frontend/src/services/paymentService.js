import axiosInstance from './axiosInstance';

export const createPayment = async (data) => {
  const res = await axiosInstance.post('/payments', data);
  return res.data;
};

export const listPayments = async () => {
  const res = await axiosInstance.get('/payments');
  return res.data;
};
