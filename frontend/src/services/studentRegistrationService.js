import axiosInstance from "./axiosInstance";

const unwrap = (response) => response.data?.data || response.data || [];
const requestConfig = { timeout: 30000 };

// Collect small, indexed batches so filters and exports still cover all records.
export const getStudentRegistrationsInBatches = async ({ signal } = {}) => {
  const students = [];
  let cursor;
  do {
    const response = await axiosInstance.get('/student-registrations', {
      ...requestConfig,
      signal,
      params: { batchSize: 100, cursor, autoSync: 'false' },
    });
    if (!Array.isArray(response.data?.data)) {
      throw new Error('The server returned an invalid registration list. Please retry.');
    }
    students.push(...response.data.data);
    const nextCursor = response.data.nextCursor;
    if (nextCursor && nextCursor === cursor) {
      throw new Error('The registration list could not finish loading. Please retry.');
    }
    cursor = nextCursor;
  } while (cursor);
  return students;
};

// The server answers from its in-memory list within milliseconds; only the very
// first load after a restart reads the whole collection, so allow it more time.
const listRequestConfig = { timeout: 120000 };

export const getStudentRegistrations = async (params = {}) => {
  const response = await axiosInstance.get("/student-registrations", {
    ...listRequestConfig,
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
