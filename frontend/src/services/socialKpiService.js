import axiosInstance from './axiosInstance';

export const getSocialKpiReports = async (periodType = '', periodKey = '') => {
  const params = {};
  if (periodType) params.periodType = periodType;
  if (periodKey) params.periodKey = periodKey;
  const response = await axiosInstance.get('/social-kpi-reports', { params });
  return response.data;
};

export const submitSocialKpiReport = async (payload) => {
  const response = await axiosInstance.post('/social-kpi-reports', payload);
  return response.data;
};
