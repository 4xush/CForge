import ApiService from "../services/ApiService";

export const googleLogin = async (idToken) => {
  try {
    const response = await ApiService.post(`/auth/google`, { idToken });
    // Let AuthContext handle token storage
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Google login failed";
    throw { message: errorMessage };
  }
};

export const login = async (email, password) => {
  try {
    const { data } = await ApiService.post("/auth/login", { email, password });
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
    const { data } = await ApiService.post("/auth/signup", userData);
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

export const updateProfile = async (type, data) => {
  try {
    const response = await ApiService.put(`/users/settings/${type}`, data);
    return response.data.user;
  } catch (error) {
    throw error.response?.data || new Error("Failed to update profile");
  }
};

export const deleteAccount = async () => {
  try {
    await ApiService.delete("/users/profile");
  } catch (error) {
    throw error.response?.data || new Error("Failed to delete account");
  }
};
