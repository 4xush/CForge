import { createContext, useContext, useState, useEffect } from "react";
import { login, register, googleLogin } from "../api/authApi"; // You'll need to create googleLogin
import toast from 'react-hot-toast';
// Moved validation functions to a separate utility file
import { validateUserData, validatePlatformData } from "@/lib/utils/validation";

export const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safe setter function for user data
  const setValidatedUser = (userData) => {
    if (validateUserData(userData)) {
      setAuthUser(userData);
      localStorage.setItem("app-user", JSON.stringify(userData));
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

        if (!validateUserData(userData)) {
          throw new Error("Stored user data is invalid");
        }

        // Verify token is not expired
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (tokenData.exp * 1000 < Date.now()) {
          throw new Error("Token expired");
        }

        setAuthUser(userData);
      }
    } catch (error) {
      console.error("Error restoring auth state:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginUser = async (email, password, googleToken = null) => {
    setError(null);
    setIsLoading(true);

    try {
      let response;

      if (googleToken) {
        // Google OAuth login
        response = await googleLogin(googleToken);
      } else {
        // Traditional email/password login
        response = await login(email, password);
      }

      const { user, token } = response;

      if (!validateUserData(user)) {
        throw new Error("Received invalid user data from server");
      }

      setAuthUser(user);
      localStorage.setItem("app-user", JSON.stringify(user));
      localStorage.setItem("app-token", token);
      return user;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (userData) => {
    setError(null);
    setIsLoading(true);

    try {
      const { user, token } = await register(userData);

      if (!validateUserData(user)) {
        throw new Error("Received invalid user data from server");
      }

      if (!setValidatedUser(user)) {
        throw new Error("Failed to set user data");
      }

      localStorage.setItem("app-token", token);
      return user;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Registration failed";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updates) => {
    if (!authUser) return false;

    const updatedUser = { ...authUser, ...updates };
    return setValidatedUser(updatedUser);
  };

  // Update platform data specifically
  const updatePlatformData = (platformName, platformData) => {
    if (!authUser) return false;

    const updatedPlatforms = {
      ...authUser.platforms,
      [platformName]: platformData
    };

    const updatedUser = {
      ...authUser,
      platforms: updatedPlatforms
    };

    return setValidatedUser(updatedUser);
  };

  const logout = () => {
    setAuthUser(null);
    setError(null);
    localStorage.removeItem("app-user");
    localStorage.removeItem("app-token");
    window.location.href = '/login'; // move the window to login page
  };

  const value = {
    authUser,
    isLoading,
    error,
    loginUser,
    registerUser,
    logout,
    updateUser,
    updatePlatformData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};