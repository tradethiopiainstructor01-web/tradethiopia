import axios from './axiosInstance';

// Get all notifications for the current user
export const getNotifications = async () => {
  const response = await axios.get('/notifications');
  return response.data;
};

// Mark a notification as read
export const markNotificationAsRead = async (id) => {
  const response = await axios.put(`/notifications/${id}`);
  return response.data;
};

// Get task-related notifications
export const getTaskNotifications = async () => {
  const response = await axios.get('/notifications');
  // Filter for task-related notifications
  return response.data.filter(notification => notification.type === 'task');
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  const response = await axios.put('/notifications/mark-all-read');
  return response.data;
};