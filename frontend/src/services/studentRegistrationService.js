import axiosInstance from "./axiosInstance";

const unwrap = (response) => response.data?.data || response.data || [];
const requestConfig = { timeout: 30000 };

// The server answers from its in-memory list within milliseconds; only the very
// first load after a restart reads the whole collection, so allow it more time.
const listRequestConfig = { timeout: 120000 };

export const getStudentRegistrations = async (params = {}, { signal } = {}) => {
  const response = await axiosInstance.get("/student-registrations", {
    ...listRequestConfig,
    signal,
    params,
  });
  return unwrap(response);
};

export const getStudentRegistrationById = async (id) => {
  const response = await axiosInstance.get(`/student-registrations/${id}`, requestConfig);
  return unwrap(response);
};

export const createStudentRegistration = async (payload) => {
  const response = await axiosInstance.post("/student-registrations", payload, requestConfig);
  return unwrap(response);
};

export const updateStudentRegistration = async (id, payload) => {
  const response = await axiosInstance.put(`/student-registrations/${id}`, payload, requestConfig);
  return unwrap(response);
};

export const updateStudentCocPayment = async (id, payload) => {
  const response = await axiosInstance.put(`/student-registrations/${id}/coc-payment`, payload, requestConfig);
  return unwrap(response);
};

export const updateStudentCocCompletion = async (id, classCompleted) => {
  const response = await axiosInstance.put(`/student-registrations/${id}/coc-completion`, { classCompleted }, requestConfig);
  return unwrap(response);
};

export const deleteStudentRegistration = async (id) => {
  const response = await axiosInstance.delete(`/student-registrations/${id}`, requestConfig);
  return unwrap(response);
};

export const syncAllFollowupsToStudentRegistrations = async () => {
  const response = await axiosInstance.post("/student-registrations/sync-all", {}, requestConfig);
  return unwrap(response);
};
