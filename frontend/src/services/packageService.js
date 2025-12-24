import axiosInstance from './axiosInstance';

// Fetch all packages
export const fetchPackages = () => axiosInstance.get('/packages').then(response => response.data);

// Fetch package by number
export const fetchPackageByNumber = (packageNumber, market = "Local") =>
  axiosInstance.get(`/packages/${packageNumber}?market=${market}`).then(response => response.data);

// Create a new package
export const createPackage = (pkg) => axiosInstance.post('/packages', pkg).then(response => response.data);

// Update a package
export const updatePackage = (id, pkg) => axiosInstance.put(`/packages/${id}`, pkg).then(response => response.data);

// Delete a package
export const deletePackage = (id) => axiosInstance.delete(`/packages/${id}`).then(response => response.data);

// Fetch package analytics
export const fetchPackageAnalytics = () => axiosInstance.get('/packages/analytics').then(response => response.data);

// Fetch aggregated package sales records from buyers and sellers
export const fetchPackageSales = () => axiosInstance.get('/packages/sales').then(response => response.data);

export const fetchUserProfile = (userId) => axiosInstance.get(`/users/${userId}`).then(response => response.data);

// Approve commission and add to payroll
export const approveCommission = (commissionId, commissionData) => 
  axiosInstance.post(`/packages/approve-commission/${commissionId}`, commissionData).then(response => response.data);
