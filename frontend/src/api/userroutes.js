import axios from "axios";

// Base URL for the API
const API_URL = "http://localhost:5000/api";  // Updated base URL to match backend structure

// Common headers configuration function to reduce repetition
const getConfig = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

// Function to get user profile details
export const getUserProfile = async (token) => {
    try {
        const response = await axios.get(
            `${API_URL}/users/profile`,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Function to delete user account
export const deleteUserAccount = async (token) => {
    try {
        const response = await axios.delete(
            `${API_URL}/users/profile`,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Function to update user password
export const updatePassword = async (passwordData, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/settings/password`,
            passwordData,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Function to update username
export const updateUsername = async (usernameData, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/settings/username`,
            usernameData,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Function to update email
export const updateEmail = async (emailData, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/settings/email`,
            emailData,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Function to update LeetCode username
export const updateLeetCodeUsername = async (leetcodeData, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/settings/leetcode`,
            { leetcodeUsername: leetcodeData.username }, // Ensure the property name matches backend expectation
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Function to update profile picture
export const updateProfilePicture = async (pictureData, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/settings/avatar`,
            pictureData,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Function to get all rooms for user
export const getAllRoomsForUser = async (token) => {
    try {
        const response = await axios.get(
            `${API_URL}/users/rooms`,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Function to update LeetCode stats for user
export const updateLeetCodeStats = async (token) => {
    try {
        const response = await axios.put(
            `${API_URL}/users/update/lcstats`,
            {},
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Function to get all users (admin route)
export const getAllUsers = async (token) => {
    try {
        const response = await axios.get(
            `${API_URL}/users/admin/users`,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

// Error handling utility
const handleApiError = (error) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return {
            status: error.response.status,
            message: error.response.data.message || 'An error occurred',
            data: error.response.data
        };
    } else if (error.request) {
        // The request was made but no response was received
        return {
            status: 503,
            message: 'Network error - no response received'
        };
    } else {
        // Something happened in setting up the request that triggered an Error
        return {
            status: 500,
            message: 'Error setting up the request'
        };
    }
};