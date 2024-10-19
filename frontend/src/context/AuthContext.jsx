import { createContext, useContext, useState, useEffect } from "react";
import { updateLeetCodeStats, login, register } from "../api";
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const useAuthContext = () => {
  return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(
    JSON.parse(localStorage.getItem("chat-user")) || null
  );
  // Remove the statsUpdated state since we'll update stats only on login/register

  const loginUser = async (email, password) => {
    try {
      const userData = await login(email, password);
      setAuthUser(userData);
      localStorage.setItem("chat-user", JSON.stringify(userData));

      // Update LeetCode stats after successful login
      try {
        await updateLeetCodeStats();
        toast.success("LeetCode stats updated successfully!");
      } catch (error) {
        console.error("Failed to update LeetCode stats:", error);
        toast.error("Error updating LeetCode stats");
      }

      return userData;
    } catch (error) {
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const registerUser = async (userData) => {
    try {
      const newUser = await register(userData);
      setAuthUser(newUser);
      localStorage.setItem("chat-user", JSON.stringify(newUser));

      // Update LeetCode stats after successful registration
      try {
        await updateLeetCodeStats();
        toast.success("LeetCode stats updated successfully!");
      } catch (error) {
        console.error("Failed to update LeetCode stats:", error);
        toast.error("Error updating LeetCode stats");
      }

      return newUser;
    } catch (error) {
      toast.error(error.message || "Registration failed");
      throw error;
    }
  };

  const logout = () => {
    setAuthUser(null);
    localStorage.removeItem("chat-user");
    localStorage.removeItem("token");
  };

  const value = {
    authUser,
    loginUser,
    registerUser,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};