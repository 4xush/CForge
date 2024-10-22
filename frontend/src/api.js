import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {  // Fixed template literal
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
  const token = data.token;
  localStorage.setItem("token", token);
  return data;
};

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users/register`, userData);
    return response.data;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error.response?.data || "An error occurred during registration";
  }
};

export const getLeaderboard = async (roomId, sortBy, limit, page) => {
  try {
    const response = await axios.get(`${API_URL}/rooms/${roomId}/leaderboard`, {
      params: { sortBy, limit, page }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    throw error.response?.data || "An error occurred while fetching the leaderboard";
  }
};

export const updateProfile = async (type, data, token) => {
  try {
    const response = await fetch(`${API_URL}/users/settings/${type}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong');
    }

    return result.data.user;
  } catch (error) {
    throw error;
  }
};

export const deleteAccount = async (token) => {
  try {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete account');
    }
  } catch (error) {
    throw error;
  }
};