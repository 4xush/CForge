import { createContext, useContext, useState, useEffect } from "react";
import { login, register, googleLogin } from "../api/authApi";
import toast from 'react-hot-toast';
import { validateUserData } from "@/lib/utils/validation";

export const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const setValidatedUser = (userData) => {
    if (validateUserData(userData)) {
      setAuthUser(userData);
      localStorage.setItem("app-user", JSON.stringify(userData));
      setError(null); // Clear error on success
      return true;
    }
    console.error("Invalid user data structure detected");
    return false;
  };

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("app-user");
      const token = localStorage.getItem("app-token");
      if (storedUser && token) {
        const userData = JSON.parse(storedUser);
        if (!validateUserData(userData)) throw new Error("Stored user data is invalid");
        
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          if (tokenData.exp * 1000 < Date.now()) {
            console.warn("Token expired on page load");
            throw new Error("Token expired");
          }
          setAuthUser(userData);
        } catch (tokenError) {
          console.error("Token validation error:", tokenError);
          throw new Error("Invalid token format");
        }
      }
    } catch (error) {
      console.error("Error restoring auth state:", error);
      // Clear auth data but don't redirect
      setAuthUser(null);
      localStorage.removeItem("app-user");
      localStorage.removeItem("app-token");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginUser = async (email, password, googleToken = null) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = googleToken ? await googleLogin(googleToken) : await login(email, password);
      const { user, token } = response;
      
      if (!user || !token) {
        throw new Error("Invalid response from server - missing user or token");
      }
      
      if (!setValidatedUser(user)) {
        throw new Error("Received invalid user data from server");
      }
      
      localStorage.setItem("app-token", token);
      return user;
    } catch (error) {
      console.error("Login error in AuthContext:", error);
      
      // Clean up any partially set data
      localStorage.removeItem("app-user");
      localStorage.removeItem("app-token");
      
      // Format error message for display
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        "Login failed. Please check your credentials and try again.";
      
      setError(errorMessage);
      throw error; // Re-throw to allow component to handle it
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (userData) => {
    setError(null);
    setIsLoading(true);
    try {
      const { user, token } = await register(userData);
      
      if (!user || !token) {
        throw new Error("Invalid response from server - missing user or token");
      }
      
      if (!setValidatedUser(user)) {
        throw new Error("Received invalid user data from server");
      }
      
      localStorage.setItem("app-token", token);
      return user;
    } catch (error) {
      console.error("Registration error in AuthContext:", error);
      
      // Clean up any partially set data
      localStorage.removeItem("app-user");
      localStorage.removeItem("app-token");
      
      // Format error message for display
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        "Registration failed. Please try again.";
      
      setError(errorMessage);
      throw error; // Re-throw to allow component to handle it
    } finally {
      setIsLoading(false);
    }
  };

  // Changed to not redirect automatically
  const logout = () => {
    setAuthUser(null);
    setError(null);
    localStorage.removeItem("app-user");
    localStorage.removeItem("app-token");
    // No automatic redirect - let component handle navigation
  };

  const value = {
    authUser,
    isLoading,
    error,
    loginUser,
    registerUser,
    logout,
    updateUser: (updates) => authUser && setValidatedUser({ ...authUser, ...updates }),
    updatePlatformData: (platformName, platformData) => authUser && setValidatedUser({
      ...authUser,
      platforms: { ...authUser.platforms, [platformName]: platformData }
    }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};