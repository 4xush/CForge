const axios = require("axios");
const { PlatformUsernameError } = require('../../utils/customErrors');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const delay = ms => new Promise(res => setTimeout(res, ms));

const getCodeforcesStats = async (codeforcesUsername) => {
    const url = `https://codeforces.com/api/user.info?handles=${codeforcesUsername}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await axios.get(url);

            if (response.data.status === "FAILED") {
                console.warn(`Codeforces API reported failure for handle: ${codeforcesUsername}. Comment: ${response.data.comment}`);
                throw new PlatformUsernameError(
                    `Codeforces username "${codeforcesUsername}" not found or invalid.`,
                    'codeforces',
                    'INVALID_USERNAME'
                );
            }

            const userData = response.data.result[0];

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
            const isAxiosErr = axios.isAxiosError(error);
            const isRetryable = isAxiosErr && [502, 503, 504].includes(error?.response?.status);

            if (error instanceof PlatformUsernameError) {
                throw error;
            }

            if (isAxiosErr) {
                console.error(
                    `Axios error on attempt ${attempt} fetching Codeforces stats for ${codeforcesUsername}:`,
                    error.response
                        ? `${error.response.status} - ${JSON.stringify(error.response.data)}`
                        : error.message
                );

                if (isRetryable && attempt < MAX_RETRIES) {
                    await delay(RETRY_DELAY_MS * attempt); // exponential backoff
                    continue;
                }

                throw new Error(`Failed to fetch Codeforces data for ${codeforcesUsername}. ${error.message}`);
            } else {
                console.error(`Unexpected error fetching Codeforces stats for ${codeforcesUsername}:`, error.message);
                throw error;
            }
        }
    }
};

module.exports = {
    getCodeforcesStats,
};
