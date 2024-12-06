const BASE_URL = 'http://localhost:5000/api/rooms/admin';

export const roomApi = {
    // Get room details
    getRoomDetails: async (roomId) => {
        try {
            const response = await fetch(`${BASE_URL}/rooms/${roomId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('app-token')}`
                }
            });
            return await response.json();
        } catch (error) {
            throw new Error('Failed to fetch room details');
        }
    },

    // Generate invite link
    generateInviteLink: async (roomId) => {
        try {
            const response = await fetch(`${BASE_URL}/${roomId}/invite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('app-token')}`
                }
            });
            return await response.json();
        } catch (error) {
            throw new Error('Failed to generate invite link');
        }
    },

    // Verify invite code
    verifyInvite: async (inviteCode) => {
        try {
            const response = await fetch(`${BASE_URL}/invite/${inviteCode}/verify`);
            return await response.json();
        } catch (error) {
            throw new Error('Failed to verify invite link');
        }
    },

    // Join room via invite code
    joinRoom: async (inviteCode) => {
        try {
            const response = await fetch(`${BASE_URL}/invite/${inviteCode}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('app-token')}`
                }
            });
            return await response.json();
        } catch (error) {
            throw new Error('Failed to join room');
        }
    }
};
