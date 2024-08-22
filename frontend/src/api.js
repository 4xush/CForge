import axios from "axios";

// Set up the base URL for your API requests
const API_URL = "http://localhost:5000/api";

// Function to handle login
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/users/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error during login:", error);
    throw error.response?.data || "An error occurred during login";
  }
};

// You can add more API functions here, such as registration, fetching data, etc.
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users/register`, userData);
    return response.data;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error.response?.data || "An error occurred during registration";
  }
};
