import api from "../config/api";

const BASE_URL = '/rooms';

export const getRoomDetails = async (roomId) => {
    try {
        const response = await api.get(`${BASE_URL}/${roomId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error("Failed to fetch room details");
    }
};

export const generateInviteLink = async (roomId) => {
    try {
        const response = await api.post(`${BASE_URL}/admin/${roomId}/invite`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error("Failed to generate invite link");
    }
};

export const verifyInvite = async (inviteCode) => {
    try {
        const response = await api.get(`${BASE_URL}/invite/${inviteCode}/verify`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error("Failed to verify invite link");
    }
};

export const joinRoom = async (inviteCode) => {
    try {
        const response = await api.post(`${BASE_URL}/invite/${inviteCode}/join`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error("Failed to join room");
    }
};

export const getLeaderboard = async (roomId, sortBy, limit, page) => {
    try {
        const response = await api.get(`${BASE_URL}/${roomId}/leaderboard`, {
            params: { sortBy, limit, page },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error("Failed to fetch leaderboard");
    }
};

export const createRoom = async (formData) => {
    try {
        const response = await api.post(`${BASE_URL}/create`, formData);
        console.log('Room created:', response.data);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error("Failed to create room");
    }
};

export default {
    getRoomDetails,
    generateInviteLink,
    verifyInvite,
    joinRoom,
    getLeaderboard,
    createRoom
};

