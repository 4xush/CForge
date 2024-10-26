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
            console.log(response);
            return await response.json();
        } catch (error) {
            throw new Error('Failed to generate invite link');
        }
    }
};