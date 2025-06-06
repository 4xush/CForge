import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { login, register, googleLogin } from "../api/authApi";
import { validateUserData } from "@/lib/utils/validation";
import ApiService from "../services/ApiService";
import PropTypes from 'prop-types';

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

  // Memoize authUser to ensure stable reference when content hasn't changed
  const memoizedAuthUser = useMemo(() => {
    return authUser;
  }, [authUser]);

  const setValidatedUser = useCallback((userData) => {
    if (validateUserData(userData)) {
      // Only update if the data has actually changed to prevent unnecessary re-renders
      setAuthUser(prevUser => {
        const userString = JSON.stringify(userData);
        const prevUserString = JSON.stringify(prevUser);
        if (userString === prevUserString) {
          return prevUser; // Return same reference if data is identical
        }
        localStorage.setItem("app-user", userString);
        setError(null); // Clear error on success
        return userData;
      });
      return true;
    }
    console.error("Invalid user data structure detected");
    return false;
  }, []);

  // OPTIMIZATION: Add a parameter to control when to refresh platform data
  const refreshPlatformData = useCallback(async (force = false) => {
    try {
      const response = await ApiService.put('users/platform/refresh');
      if (response.data && response.data.user) {
        // Update both state and localStorage with the refreshed data
        setValidatedUser(response.data.user);
      }
    } catch (error) {
      console.error("Failed to refresh platform data:", error);
    }
  }, [setValidatedUser]);

  const loginUser = useCallback(async (email, password, googleToken = null) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = googleToken ? await googleLogin(googleToken) : await login(email, password);
      const { user, token } = response;
      
      if (!user || !token) {
        throw new Error("Invalid response from server - missing user or token");
      }

      // Set token first
      localStorage.setItem("app-token", token);
      
      // Then set user data
      if (!setValidatedUser(user)) {
        localStorage.removeItem("app-token");
        throw new Error("Received invalid user data from server");
      }

      // OPTIMIZATION: Only refresh platform data after login if needed
      // Remove this if backend handles it automatically
      // await refreshPlatformData(true);
      
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
  }, [setValidatedUser]); // OPTIMIZATION: Removed refreshPlatformData dependency

  const registerUser = useCallback(async (userData) => {
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
  }, [setValidatedUser]);

  const logout = useCallback(() => {
    setAuthUser(null);
    setError(null);
    localStorage.removeItem("app-user");
    localStorage.removeItem("app-token");
    // No automatic redirect - let component handle navigation
  }, []);

  const updateUser = useCallback((updates) => {
    if (memoizedAuthUser) {
      return setValidatedUser({ ...memoizedAuthUser, ...updates });
    }
    return false;
  }, [memoizedAuthUser, setValidatedUser]);

  const updatePlatformData = useCallback((platformName, platformData) => {
    if (memoizedAuthUser) {
      return setValidatedUser({
        ...memoizedAuthUser,
        platforms: { ...memoizedAuthUser.platforms, [platformName]: platformData }
      });
    }
    return false;
  }, [memoizedAuthUser, setValidatedUser]);

  // OPTIMIZATION: Remove automatic platform refresh on page load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("app-user");
        const token = localStorage.getItem("app-token");
        
        if (storedUser && token) {
          const userData = JSON.parse(storedUser);
          if (!validateUserData(userData)) {
            throw new Error("Stored user data is invalid");
          }
          
          try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            if (tokenData.exp * 1000 < Date.now()) {
              throw new Error("Token expired");
            }
            setAuthUser(userData);
            
            // REMOVED: await refreshPlatformData();
            // This was causing unnecessary API calls on every page refresh
            // If backend manages platform data automatically, this is not needed
            
          } catch (error) {
            console.error("Token validation error:", error);
            throw new Error("Invalid token format");
          }
        }
      } catch (error) {
        console.error("Error restoring auth state:", error);
        setAuthUser(null);
        localStorage.removeItem("app-user");
        localStorage.removeItem("app-token");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // OPTIMIZATION: Removed refreshPlatformData dependency

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    authUser: memoizedAuthUser,
    isLoading,
    error,
    loginUser,
    registerUser,
    logout,
    updateUser,
    updatePlatformData,
    refreshPlatformData, // Keep this for manual refresh when needed
  }), [
    memoizedAuthUser,
    isLoading,
    error,
    loginUser,
    registerUser,
    logout,
    updateUser,
    updatePlatformData,
    refreshPlatformData,
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};