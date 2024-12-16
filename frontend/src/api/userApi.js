import axios from "axios";

const API_URI = "http://localhost:5000/api";

const getConfig = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

export const getUserProfile = async (token) => {
    try {
        const response = await axios.get(
            `${API_URI}/users/profile`,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const deleteUserAccount = async (token) => {
    try {
        const response = await axios.delete(
            `${API_URI}/users/profile`,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const updatePassword = async (passwordData, token) => {
    try {
        const response = await axios.put(
            `${API_URI}/settings/password`,
            passwordData,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const updateUsername = async (usernameData, token) => {
    try {
        const response = await axios.put(
            `${API_URI}/settings/username`,
            usernameData,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const updateEmail = async (emailData, token) => {
    try {
        const response = await axios.put(
            `${API_URI}/settings/email`,
            emailData,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const updateLeetCodeUsername = async (leetcodeData, token) => {
    try {
        const response = await axios.put(
            `${API_URI}/settings/leetcode`,
            { leetcodeUsername: leetcodeData.username }, // Ensure the property name matches backend expectation
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const updateProfilePicture = async (pictureData, token) => {
    try {
        const response = await axios.put(
            `${API_URI}/settings/avatar`,
            pictureData,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const getAllRoomsForUser = async (token) => {
    try {
        const response = await axios.get(
            `${API_URI}/users/rooms`,
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const updateLeetCodeStats = async (token) => {
    try {
        const response = await axios.put(
            `${API_URI}/users/update/lcstats`,
            {},
            getConfig(token)
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
};

export const getAllUsers = async (token) => {
    try {
        const response = await axios.get(
            `${API_URI}/users/admin/users`,
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