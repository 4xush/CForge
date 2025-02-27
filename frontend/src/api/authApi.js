import api from "../config/api";

export const googleLogin = async (idToken) => {
  const response = await api.post(`/auth/google`, { idToken });
  localStorage.setItem("app-token", response.data.token);
  return response.data;
};
export const login = async (email, password) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    const { token, user } = data;
    if (!token || !user) {
      console.error("Missing token or user in response:", data);
      throw new Error("Invalid server response");
    }
    localStorage.setItem("app-token", token);
    return { user, token };
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

export const register = async (userData) => {
  try {
    const { data } = await api.post("/auth/signup", userData);
    const { token, user } = data;
    localStorage.setItem("app-token", token);
    return {
      user: {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
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
