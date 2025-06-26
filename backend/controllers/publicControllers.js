const User = require('../models/User');
const axios = require("axios");
const winston = require('winston');
const redisClient = require('../services/cache/redisClient'); // Adjust path as needed

// Logger setup (remains the same)
const logger = winston.createLogger({
    // ... your logger config ...
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// TTLs (Time-To-Live) for our caches in seconds
const PUBLIC_PROFILE_TTL = redisClient.ttlConfig.public_profile || 600; // 10 minutes
const HEATMAP_TTL = redisClient.ttlConfig.heatmap || 43200; // 12 hours
const NEGATIVE_CACHE_TTL = 60; // 1 minute for "not found" results

exports.getPublicUserProfile = async (req, res) => {
    const { username } = req.params;
    const cacheKey = `public:profile:${username}`;

    try {
        // 1. Try to fetch from Redis cache first
        if (redisClient.isReady()) {
            const cachedProfile = await redisClient.get(cacheKey);
            if (cachedProfile) {
                // Handle negative caching (user confirmed not to exist)
                if (cachedProfile === "NOT_FOUND") {
                    return res.status(404).json({ success: false, message: "User not found" });
                }
                // Cache HIT
                return res.status(200).json({ success: true, user: JSON.parse(cachedProfile) });
            }
        }

        // 2. If cache miss, fetch from the database
        const user = await User.findOne({ username }).select('-password -_id');

        if (!user) {
            // Set negative cache to prevent repeated DB queries for non-existent users
            if (redisClient.isReady()) {
                await redisClient.set(cacheKey, "NOT_FOUND", NEGATIVE_CACHE_TTL);
            }
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 3. Store the result in Redis for future requests
        if (redisClient.isReady()) {
            await redisClient.set(cacheKey, JSON.stringify(user), PUBLIC_PROFILE_TTL);
        }

        res.status(200).json({ success: true, user });

    } catch (error) {
        logger.error(`Error in getPublicUserProfile for ${username}:`, error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

exports.getPublicUserHeatMaps = async (req, res) => {
    const { username } = req.params;
    const cacheKey = `public:heatmap:${username}`;

    try {
        // 1. Try to fetch the entire heatmap object from Redis
        if (redisClient.isReady()) {
            const cachedHeatmaps = await redisClient.get(cacheKey);
            if (cachedHeatmaps) {
                // Cache HIT
                return res.status(200).json({ success: true, heatmaps: JSON.parse(cachedHeatmaps) });
            }
        }

        // 2. If cache miss, fetch from source
        const user = await User.findOne({ username }).select('platforms');
        if (!user) {
            // Note: We don't need to set a negative cache here because getPublicUserProfile would have already done it.
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const platformPromises = [];
        const platformNames = [];

        // Create promises for all available platforms
        if (user.platforms?.leetcode?.username) {
            platformPromises.push(getLeetCodeHeatmap(user.platforms.leetcode.username));
            platformNames.push('leetcode');
        }
        if (user.platforms?.github?.username) {
            platformPromises.push(getGitHubHeatmap(user.platforms.github.username));
            platformNames.push('github');
        }
        if (user.platforms?.codeforces?.username) {
            platformPromises.push(getCodeforcesHeatmap(user.platforms.codeforces.username));
            platformNames.push('codeforces');
        }

        // Use Promise.allSettled to ensure we get results even if one API fails
        const results = await Promise.allSettled(platformPromises);
        const heatmaps = {};

        results.forEach((result, index) => {
            const platformName = platformNames[index];
            if (result.status === 'fulfilled') {
                heatmaps[platformName] = result.value;
            } else {
                logger.error(`Failed to fetch ${platformName} heatmap for ${username}:`, result.reason);
                heatmaps[platformName] = []; // Return empty array on failure for this platform
            }
        });

        // 3. Store the newly compiled heatmap object in Redis
        if (redisClient.isReady() && Object.keys(heatmaps).length > 0) {
            await redisClient.set(cacheKey, JSON.stringify(heatmaps), HEATMAP_TTL);
        }

        res.status(200).json({ success: true, heatmaps });

    } catch (error) {
        logger.error(`Error in getPublicUserHeatMaps for ${username}:`, error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

async function getLeetCodeHeatmap(leetcodeUsername) {
    const response = await axios.post('https://leetcode.com/graphql', {
        query: `
            query submissionCalendar($username: String!) {
                matchedUser(username: $username) {
                    submissionCalendar
                }
            }
        `,
        variables: { username: leetcodeUsername },
    }, {
        headers: { "Content-Type": "application/json" },
    });

    // Add null checks before accessing submissionCalendar
    const matchedUser = response.data?.data?.matchedUser;
    const submissionCalendar = matchedUser?.submissionCalendar;

    if (!submissionCalendar) {
        console.warn(`No submissionCalendar found for LeetCode user: ${leetcodeUsername}`);
        return {}; // Return empty object if data is missing
    }

    try {
        return JSON.parse(submissionCalendar); // Returns { "timestamp": "count", ... }
    } catch (parseError) {
        console.error(`Error parsing submissionCalendar for LeetCode user ${leetcodeUsername}:`, parseError);
        return {}; // Return empty object on parsing error
    }
}

async function getGitHubHeatmap(githubUsername) {
    try {
        // Add authentication and proper headers
        const headers = {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        // Get events with authentication
        const response = await axios.get(
            `https://api.github.com/users/${githubUsername}/events`,
            { headers }
        );

        // Validate response
        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Invalid response format from GitHub API');
        }

        const events = response.data;
        const dailyContributions = {};

        // Process events into daily contributions
        events.forEach(event => {
            if (!event.created_at) return; // Skip invalid events

            const date = new Date(event.created_at).toISOString().split('T')[0];

            // Count different types of contributions differently
            let contributionCount = 0;
            switch (event.type) {
                case 'PushEvent':
                    contributionCount = event.payload?.commits?.length || 1;
                    break;
                case 'PullRequestEvent':
                case 'IssuesEvent':
                    contributionCount = 1;
                    break;
                default:
                    contributionCount = 0.5; // Other events count as partial contributions
            }

            dailyContributions[date] = (dailyContributions[date] || 0) + contributionCount;
        });

        // Convert to array format with dates and counts
        return Object.entries(dailyContributions).map(([date, count]) => ({
            date,
            count: Math.round(count * 10) / 10 // Round to 1 decimal place
        }));

    } catch (error) {
        console.error(`Error fetching GitHub heatmap for user ${githubUsername}:`, error);
        if (error.response?.status === 403) {
            throw new Error('GitHub API rate limit exceeded');
        } else if (error.response?.status === 404) {
            throw new Error('GitHub user not found');
        }
        throw new Error('Failed to fetch GitHub contribution data');
    }
}

async function getCodeforcesHeatmap(codeforcesHandle) {
    const response = await axios.get(`https://codeforces.com/api/user.status?handle=${codeforcesHandle}`);
    const data = response.data;

    const dailySubmissions = {};
    data.result.forEach(submission => {
        const date = new Date(submission.creationTimeSeconds * 1000).toISOString().split('T')[0];
        dailySubmissions[date] = (dailySubmissions[date] || 0) + 1;
    });

    return Object.entries(dailySubmissions).map(([date, count]) => ({ date, count }));
}
