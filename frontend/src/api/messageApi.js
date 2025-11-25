import axios from "axios";

export const getMessages = async () => {
  try {
    const response = await axios.get("/api/messages");
    return response.data;
  } catch (error) {
    console.error("Error fetching messages", error);
  }
};

export const replyToMessage = async (messageId, replyText) => {
  try {
    const response = await axios.post("/api/messages/reply", {
      messageId,
      replyText,
    });
    return response.data;
  } catch (error) {
    console.error("Error replying to message", error);
  }
};
