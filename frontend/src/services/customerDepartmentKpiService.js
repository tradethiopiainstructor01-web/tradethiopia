import api from './axiosInstance';
export const getCustomerDepartmentKpi = async (periodType, periodKey) => (await api.get('/customer-department-kpi', { params: { periodType, periodKey } })).data.data;
export const submitCustomerDepartmentKpi = async (report) => (await api.post('/customer-department-kpi', report)).data.data;
