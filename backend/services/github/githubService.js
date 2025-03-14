const axios = require("axios");

const getGitHubStats = async (githubUsername) => {
    try {
        const response = await axios.get(`https://api.github.com/users/${githubUsername}`, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        const { public_repos, followers, following } = response.data;

        return {
            githubUsername,
            publicRepos: public_repos,
            followers,
            following,
        };
    } catch (error) {
        console.error(
            "Error fetching GitHub stats:",
            error.response ? error.response.data : error.message
        );
        throw error;
    }
};

module.exports = {
    getGitHubStats,
};