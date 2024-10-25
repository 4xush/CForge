// api.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add response interceptor to handle common errors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("app-token"); // Match storage key
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const login = async (email, password) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    console.log("API Response:", data); // Debug log 1

    const { token, user } = data;
    if (!token || !user) {
      console.error("Missing token or user in response:", data);
      throw new Error("Invalid server response");
    }

    console.log("Saving token:", token); // Debug log 2
    localStorage.setItem("app-token", token);

    console.log("Processed user data:", user); // Debug log 3
    return { user, token };
  } catch (error) {
    console.error("Login error details:", error); // Debug log 4
    throw error.response?.data || { message: "Login failed" };
  }
};
export const register = async (userData) => {
  try {
    const { data } = await api.post("/auth/signup", userData);
    const { token, user } = data;
    localStorage.setItem("app-token", token); // Standardized key
    return {
      user: {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        // leetcodeStats: user.leetcodeStats
        platforms: user.platforms
      },
      token
    };
  } catch (error) {
    throw error.response?.data || { message: "Registration failed" };
  }
};


export const getLeaderboard = async (roomId, sortBy, limit, page) => {
  try {
    const response = await api.get(`/rooms/${roomId}/leaderboard`, {
      params: { sortBy, limit, page }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error("Failed to fetch leaderboard");
  }
};

export const updateProfile = async (type, data) => {
  try {
    const response = await api.put(`/users/settings/${type}`, data);
    return response.data.user;
  } catch (error) {
    throw error.response?.data || new Error("Failed to update profile");
  }
};

export const deleteAccount = async () => {
  try {
    await api.delete("/users/profile");
  } catch (error) {
    throw error.response?.data || new Error("Failed to delete account");
  }
};