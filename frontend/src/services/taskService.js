import axiosInstance from './axiosInstance';

// Create a new task
export const createTask = async (taskData) => {
  const response = await axiosInstance.post('/tasks', taskData);
  return response.data;
};

// Get tasks for the current sales manager
export const getTasksForManager = async () => {
  const response = await axiosInstance.get('/tasks');
  return response.data;
};

// Get tasks assigned to the current user (sales representative)
export const getMyTasks = async () => {
  const response = await axiosInstance.get('/tasks/my-tasks');
  return response.data;
};

// Update a task
export const updateTask = async (taskId, taskData) => {
  const response = await axiosInstance.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

// Delete a task
export const deleteTask = async (taskId) => {
  const response = await axiosInstance.delete(`/tasks/${taskId}`);
  return response.data;
};

// Get task statistics
export const getTaskStats = async (config = {}) => {
  const response = await axiosInstance.get('/tasks/stats', config);
  return response.data;
};
