const axios = require("axios");

const getCodeforcesStats = async (codeforcesUsername) => {
    const url = `https://codeforces.com/api/user.info?handles=${codeforcesUsername}`;

    try {
        // Fetch data from Codeforces API
        const response = await axios.get(url);
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
        console.error(
            "Error fetching Codeforces stats:",
            error.response ? error.response.data : error.message
        );
        throw error;
    }
};

module.exports = {
    getCodeforcesStats,
};
