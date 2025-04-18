import api from "../config/api";

export const refreshLeaderboard = async (roomId) => {
  try {
    const response = await api.post(`/rooms/${roomId}/update-leetcode-stats`);
    // Clear cached data after successful refresh
    clearLeaderboardCache(roomId);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error("Failed to update LeetCode stats");
  }
};

export const googleLogin = async (idToken) => {
  try {
    const response = await api.post(`/auth/google`, { idToken });
    // Let AuthContext handle token storage
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Google login failed";
    throw { message: errorMessage };
  }
};

export const login = async (email, password) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    const { token, user } = data;
    if (!token || !user) {
      console.error("Missing token or user in response:", data);
      throw new Error("Invalid server response");
    }
    // Let AuthContext handle token storage
    return { user, token };
  } catch (error) {
    console.error("Login API error:", error);
    throw error.response?.data || { message: "Login failed" };
  }
};

export const register = async (userData) => {
  try {
    const { data } = await api.post("/auth/signup", userData);
    const { token, user } = data;
    // Let AuthContext handle token storage
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
    console.error("Registration API error:", error);
    if (error.response?.data?.errors) {
      throw { message: error.response.data.errors.join(", ") };
    }
    throw error.response?.data || { message: "Registration failed" };
  }
};

export const getLeaderboard = async (roomId, sortBy, limit, page) => {
  try {
    // Create a unique key for this specific leaderboard request
    const cacheKey = `leaderboard_${roomId}_${sortBy}_${limit}_${page}`;

    // Check if we have cached data and it's not expired
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;

      // Use cache if it's less than 5 minutes old
      if (cacheAge < 5 * 60 * 1000) {
        return data;
      }

      // Remove expired cache
      sessionStorage.removeItem(cacheKey);
    }

    // Fetch fresh data if no cache or cache expired
    const response = await api.get(`/rooms/${roomId}/leaderboard`, {
      params: { sortBy, limit, page }
    });

    // Cache the new data with timestamp
    const cacheData = {
      data: response.data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

    return response.data;
  } catch (error) {
    // Try to return cached data if request fails, even if expired
    const cacheKey = `leaderboard_${roomId}_${sortBy}_${limit}_${page}`;
    const cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
      const { data } = JSON.parse(cachedData);
      return data;
    }

    throw error.response?.data || new Error("Failed to fetch leaderboard");
  }
};

// Add a function to clear leaderboard cache for a room
export const clearLeaderboardCache = (roomId) => {
  // Clear all cached data for this room
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith(`leaderboard_${roomId}`)) {
      sessionStorage.removeItem(key);
    }
  });
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
