import { createContext, useState, useEffect } from "react";
import { getMessages, replyToMessage } from "../api/messageApi";

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await getMessages();
      setMessages(data);
    };
    fetchMessages();
  }, []);

  const handleReply = async (messageId, replyText) => {
    const response = await replyToMessage(messageId, replyText);
    // Assuming the response includes the updated message, you can update the state
    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        message.id === messageId ? { ...message, ...response } : message
      )
    );
  };
  

  return (
    <MessageContext.Provider value={{ messages, handleReply }}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext;
