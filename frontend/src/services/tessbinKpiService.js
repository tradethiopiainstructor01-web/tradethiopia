import axiosInstance from './axiosInstance';

export const getTessbinKpiReport = async (timeframe = 'monthly', date = '') => {
  const response = await axiosInstance.get('/tessbin/kpi-reports', {
    params: { timeframe, date },
  });
  return response.data;
};

export const saveTessbinKpiReport = async (reportData) => {
  const response = await axiosInstance.put('/tessbin/kpi-reports', reportData);
  return response.data;
};

export const getTessbinLiveCounts = async (timeframe = 'monthly', date = '') => {
  const response = await axiosInstance.get('/tessbin/kpi-reports/live-counts', {
    params: { timeframe, date },
  });
  return response.data;
};
