const axios = require("axios");

const getGitHubStats = async (githubUsername) => {
    try {
        const headers = {
            "Content-Type": "application/json",
        };

        // Add GitHub token if available for higher rate limits
        if (process.env.GITHUB_TOKEN) {
            headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
        }

        const response = await axios.get(`https://api.github.com/users/${githubUsername}`, {
            headers,
            validateStatus: false // Don't throw on non-2xx status
        });

        // Handle rate limiting
        const rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining']);
        const rateLimitReset = parseInt(response.headers['x-ratelimit-reset']) * 1000; // Convert to ms

        if (response.status === 403 && rateLimitRemaining === 0) {
            const resetDate = new Date(rateLimitReset);
            const error = new Error('GitHub API rate limit exceeded');
            error.code = 'RATE_LIMIT_EXCEEDED';
            error.resetTime = resetDate;
            throw error;
        }

        // Handle other error responses
        if (response.status === 404) {
            const error = new Error('GitHub user not found');
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        if (response.status !== 200) {
            const error = new Error('GitHub API error: ' + (response.data?.message || 'Unknown error'));
            error.code = 'API_ERROR';
            error.status = response.status;
            throw error;
        }

        const { public_repos, followers, following } = response.data;

        return {
            githubUsername,
            publicRepos: public_repos,
            followers,
            following,
            rateLimitRemaining,
            rateLimitReset
        };
    } catch (error) {
        // Handle network errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            const networkError = new Error('GitHub API is unreachable');
            networkError.code = 'NETWORK_ERROR';
            throw networkError;
        }

        // Handle axios errors
        if (error.isAxiosError) {
            console.error(
                "GitHub API request failed:",
                error.response ? error.response.data : error.message
            );
        }

        // Rethrow with consistent error structure
        throw {
            message: error.message || 'Failed to fetch GitHub stats',
            code: error.code || 'GITHUB_API_ERROR',
            resetTime: error.resetTime,
            status: error.status
        };
    }
};

module.exports = {
    getGitHubStats,
};