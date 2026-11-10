import axiosInstance from './axiosInstance';

export const fetchCalledCalls = async (params = {}) => {
  const response = await axiosInstance.get('/called-calls', { params });
  return response.data;
};

export const createCalledCall = async (data) => {
  const response = await axiosInstance.post('/called-calls', data);
  return response.data;
};

export const updateCalledCall = async (id, data) => {
  const response = await axiosInstance.put(`/called-calls/${id}`, data);
  return response.data;
};

export const deleteCalledCall = async (id) => {
  const response = await axiosInstance.delete(`/called-calls/${id}`);
  return response.data;
};

export const fetchCalledCallStats = async (params = {}) => {
  const response = await axiosInstance.get('/called-calls/stats', { params });
  return response.data;
};

export const bulkCreateCalledCalls = async (data) => {
  const response = await axiosInstance.post('/called-calls/bulk', data);
  return response.data;
};


export const sendBulkSms = async (data) => {
  const response = await axiosInstance.post('/called-calls/bulk-sms', data);
  return response.data;
};

export const fetchBulkSmsRecipients = async () => {
  const response = await axiosInstance.get('/called-calls/bulk-sms/recipients');
  return response.data;
};

export const saveBulkSmsRecipients = async (phoneNumbers, source = 'manual') => {
  const response = await axiosInstance.post('/called-calls/bulk-sms/recipients', { phoneNumbers, source });
  return response.data;
};

export const deleteBulkSmsRecipient = async (id) => {
  const response = await axiosInstance.delete(`/called-calls/bulk-sms/recipients/${id}`);
  return response.data;
};

export const clearBulkSmsRecipients = async () => {
  const response = await axiosInstance.delete('/called-calls/bulk-sms/recipients');
  return response.data;
};
