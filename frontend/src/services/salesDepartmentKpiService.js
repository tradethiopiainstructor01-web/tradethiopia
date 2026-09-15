import axiosInstance from './axiosInstance';

export const getSalesDepartmentKpis = async (periodType = 'monthly', periodKey = '') => {
  const response = await axiosInstance.get('/sales-department-kpi', {
    params: { periodType, periodKey },
  });
  return response.data;
};

export const saveSalesDepartmentKpi = async (kpiData) => {
  const response = await axiosInstance.post('/sales-department-kpi', kpiData);
  return response.data;
};

export const getSalesLiveStats = async (periodType = '', periodKey = '') => {
  const response = await axiosInstance.get('/sales-department-kpi/live-stats', {
    params: { periodType, periodKey },
  });
  return response.data;
};

export const getRealOperationalSalesKpis = async (periodType = 'monthly', periodKey = '') => {
  const response = await axiosInstance.get('/sales-department-kpi/live-operational-data', {
    params: { periodType, periodKey },
  });
  return response.data;
};
