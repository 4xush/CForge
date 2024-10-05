import axios from "axios";

// Set up the base URL for your API requests
const API_URL = "http://localhost:5000/api";

// src/api.js
export const login = async (email, password) => {
  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
  }

  const data = await response.json();
  const token = data.token; // Assuming the backend returns a token in the response

  // Store the token in localStorage for future use
  localStorage.setItem("token", token);

  return data;
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
