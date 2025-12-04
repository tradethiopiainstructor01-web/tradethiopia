import axiosInstance from './axiosInstance';

// Create a new task
export const createTask = async (taskData) => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Get tasks for the current sales manager
export const getTasksForManager = async () => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.get('/tasks');
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Get tasks assigned to the current user (sales representative)
export const getMyTasks = async () => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.get('/tasks/my-tasks');
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Update a task
export const updateTask = async (taskId, taskData) => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.put(`/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};

// Get task statistics
export const getTaskStats = async () => {
  const token = localStorage.getItem('userToken');
  
  try {
    const response = await axiosInstance.get('/tasks/stats');
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling function can handle it appropriately
    throw error;
  }
};