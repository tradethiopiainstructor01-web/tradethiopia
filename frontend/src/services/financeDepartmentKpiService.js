import axiosInstance from './axiosInstance';

export const getFinanceDepartmentKpis = async (periodType = 'weekly', periodKey = '') => {
  const response = await axiosInstance.get('/finance-department-kpi', {
    params: { periodType, periodKey },
  });
  return response.data;
};

export const saveFinanceDepartmentKpi = async (kpiData) => {
  const response = await axiosInstance.post('/finance-department-kpi', kpiData);
  return response.data;
};

export const getFinanceLiveStats = async (periodType = '', periodKey = '') => {
  const response = await axiosInstance.get('/finance-department-kpi/live-stats', {
    params: { periodType, periodKey },
  });
  return response.data;
};
