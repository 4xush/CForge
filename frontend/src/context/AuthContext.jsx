import { createContext, useContext, useState, useEffect } from "react";
import { login, register } from "../api";
import toast from 'react-hot-toast';

const validatePlatformData = (platform) => {
  if (!platform || typeof platform !== 'object') return false;

  // Base validation for common platform fields
  const hasValidUsername = typeof platform.username === 'string';
  const hasValidTotalQuestions = typeof platform.totalQuestionsSolved === 'number' || platform.totalQuestionsSolved === undefined;
  const hasValidRating = typeof platform.contestRating === 'number' || platform.contestRating === undefined;

  return hasValidUsername || hasValidTotalQuestions || hasValidRating;
};

const validateUserData = (user) => {
  if (!user || typeof user !== 'object') return false;

  const validationRules = {
    fullName: (val) => typeof val === 'string' && val.length >= 2,
    username: (val) => typeof val === 'string' && val.length >= 2,
    email: (val) => typeof val === 'string' && val.includes('@'),
    profilePicture: (val) => typeof val === 'string' && val.startsWith('http'),
    platforms: (val) => {
      if (!val || typeof val !== 'object') return false;

      // Validate each platform's data if it exists
      const supportedPlatforms = ['leetcode', 'codeforces'];
      return supportedPlatforms.every(platform => {
        return !val[platform] || validatePlatformData(val[platform]);
      });
    }
  };

  return Object.entries(validationRules).every(([field, validator]) => {
    const isValid = validator(user[field]);
    if (!isValid) {
      console.warn(`Invalid user data: ${field} failed validation`);
    }
    return isValid;
  });
};

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

  const loginUser = async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const { user, token } = await login(email, password);

      if (!validateUserData(user)) {
        throw new Error("Received invalid user data from server");
      }

      setAuthUser(user);
      localStorage.setItem("app-user", JSON.stringify(user));
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