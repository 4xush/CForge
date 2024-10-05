import axios from "axios";

// Fetch all messages from a room
export const fetchMessages = async (roomId, token) => {
  const response = await axios.get(`/api/rooms/${roomId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Send a message to a room
export const sendMessage = async (roomId, content, token) => {
  const response = await axios.post(
    `/api/rooms/${roomId}/messages`,
    { content },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
