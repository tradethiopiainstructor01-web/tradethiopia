import axios from "axios";

export const getNotifications = async () => {
  try {
    const response = await axios.get("/api/notifications");
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications", error);
  }
};

export const markAsRead = async (id) => {
  try {
    const response = await axios.put(`/api/notifications/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read", error);
  }
};
