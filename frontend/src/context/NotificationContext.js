import { createContext, useState, useEffect } from "react";
import { getNotifications, markAsRead } from "../api/notificationApi";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await getNotifications();
      setNotifications(data);
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    const updatedNotification = await markAsRead(id);
    setNotifications(notifications.map((notification) => 
      notification._id === id ? updatedNotification : notification
    ));
  };

  return (
    <NotificationContext.Provider value={{ notifications, handleMarkAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
