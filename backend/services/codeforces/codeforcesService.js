const axios = require("axios");
const { PlatformUsernameError } = require('../../utils/customErrors'); // Assuming custom error defined here

const getCodeforcesStats = async (codeforcesUsername) => {
    const url = `https://codeforces.com/api/user.info?handles=${codeforcesUsername}`;

    try {
        const response = await axios.get(url);

        // Check if Codeforces API indicates failure (even with a 200 OK)
        if (response.data.status === "FAILED") {
            console.warn(`Codeforces API reported failure for handle: ${codeforcesUsername}. Comment: ${response.data.comment}`);
            // Throw a specific error for invalid username
            throw new PlatformUsernameError(
                `Codeforces username "${codeforcesUsername}" not found or invalid.`,
                'codeforces',
                'INVALID_USERNAME'
            );
        }

        const userData = response.data.result[0];

        // Parse and return required data
        return {
            username: userData.handle,
            currentRating: userData.rating || 0,
            maxRating: userData.maxRating || 0,
            rank: userData.rank || "Unrated",
            maxRank: userData.maxRank || "Unrated",
            contribution: userData.contribution || 0,
            friendOfCount: userData.friendOfCount || 0,
        };
    } catch (error) {
        // Re-throw our custom error if it's already the right type
        if (error instanceof PlatformUsernameError) {
            throw error;
        }

        // Handle Axios errors specifically
        if (axios.isAxiosError(error)) {
            console.error(
                `Axios error fetching Codeforces stats for ${codeforcesUsername}:`,
                error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message
            );
            // Check if the error response indicates the user doesn't exist (e.g., specific status code or message)
            // Codeforces might not use standard 404 for invalid handles, relying on the 'FAILED' status checked above.
            // If other error types signify invalid users, add checks here.
            // For now, we primarily rely on the FAILED status check.
            // If it's some other Axios error, throw a generic fetch error.
            throw new Error(`Failed to fetch Codeforces data for ${codeforcesUsername}. ${error.message}`);
        } else {
            // Handle non-Axios errors
            console.error(`Unexpected error fetching Codeforces stats for ${codeforcesUsername}:`, error.message);
            throw error; // Re-throw unexpected errors
        }
    }
};

module.exports = {
    getCodeforcesStats,
};
