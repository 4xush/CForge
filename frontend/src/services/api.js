import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/rooms"; // Ensure correct base URL

export const fetchRoomDetails = async (roomId, token) => {
    if (!token) throw new Error("No token provided");

    try {
        const response = await axios.get(`${API_BASE_URL}/${roomId}`, {
            headers: {
                "Authorization": `Bearer ${token}`, // Include the Bearer token
                "Content-Type": "application/json",
            },
        });
        return response.data; // Return the data from the response
    } catch (error) {
        console.error("Error fetching room details:", error); // Log the error
        throw new Error(error.response?.data?.message || "Failed to fetch room details");
    }
};


const createRoom = async (roomData, token) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/create`, roomData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data; // Return the data from the response
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create room');
    }
};

// Additional API functions can be added here

export { createRoom };
