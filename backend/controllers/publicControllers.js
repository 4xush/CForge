const User = require('../models/User');
const axios = require("axios");
const winston = require('winston');
const redisClient = require('../services/cache/redisClient');

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/public-controller-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/public-controller-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// TTLs (Time-To-Live) for our caches in seconds
const PUBLIC_PROFILE_TTL = redisClient.ttlConfig?.public_profile || 600; // 10 minutes
const HEATMAP_TTL = redisClient.ttlConfig?.heatmap || 43200; // 12 hours
const NEGATIVE_CACHE_TTL = 60; // 1 minute for "not found" results
const HEATMAP_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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
        // 1. Try to fetch from Redis cache first
        if (redisClient.isReady()) {
            const cachedHeatmaps = await redisClient.get(cacheKey);
            if (cachedHeatmaps) {
                logger.info(`Cache HIT for heatmaps of user: ${username}`);
                return res.status(200).json({ success: true, heatmaps: JSON.parse(cachedHeatmaps) });
            }
        }

        // 2. Fetch user with platform data including heatmaps
        const user = await User.findOne({ username }).select('platforms');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const heatmaps = {};
        const platformsToUpdate = [];

        // 3. Check each platform and decide whether to use cached data or fetch fresh
        const platforms = ['leetcode', 'github', 'codeforces'];
        
        for (const platform of platforms) {
            const platformData = user.platforms?.[platform];
            
            if (!platformData?.username) {
                continue; // Skip if platform not configured
            }

            // Check if we have recent heatmap data in database
            const hasRecentHeatmapData = platformData.heatmapLastUpdated && 
                platformData.heatmapData && 
                Object.keys(convertMapToObject(platformData.heatmapData)).length > 0 &&
                (Date.now() - new Date(platformData.heatmapLastUpdated).getTime()) < HEATMAP_REFRESH_INTERVAL;

            if (hasRecentHeatmapData) {
                // Use existing heatmap data from database
                heatmaps[platform] = convertMapToObject(platformData.heatmapData);
                logger.info(`Using cached heatmap data for ${platform} (user: ${username})`);
            } else {
                // Mark for fresh fetch
                platformsToUpdate.push(platform);
                logger.info(`Heatmap data stale for ${platform} (user: ${username}), will fetch fresh`);
            }
        }

        // 4. Fetch fresh heatmap data for stale platforms
        if (platformsToUpdate.length > 0) {
            const platformPromises = platformsToUpdate.map(platform => {
                const platformData = user.platforms[platform];
                switch (platform) {
                    case 'leetcode':
                        return getLeetCodeHeatmap(platformData.username);
                    case 'github':
                        return getGitHubHeatmap(platformData.username);
                    case 'codeforces':
                        return getCodeforcesHeatmap(platformData.username);
                    default:
                        return Promise.resolve({});
                }
            });

            // Use Promise.allSettled to handle failures gracefully
            const results = await Promise.allSettled(platformPromises);
            
            // Process results and update database
            const updatePromises = [];
            
            results.forEach((result, index) => {
                const platform = platformsToUpdate[index];
                
                if (result.status === 'fulfilled' && result.value && Object.keys(result.value).length > 0) {
                    heatmaps[platform] = result.value;
                    
                    // Store as plain object - MongoDB will handle Map conversion based on schema
                    const updateData = {
                        [`platforms.${platform}.heatmapData`]: result.value,
                        [`platforms.${platform}.heatmapLastUpdated`]: new Date()
                    };
                    
                    // Add detailed logging to debug
                    logger.info(`Saving ${platform} heatmap data for user: ${username}`, {
                        platform,
                        dataType: typeof result.value,
                        isArray: Array.isArray(result.value),
                        // dataKeys: Object.keys(result.value || {}),
                        dataSize: JSON.stringify(result.value).length
                    });
                    
                    updatePromises.push(
                        User.findOneAndUpdate(
                            { username }, 
                            { $set: updateData },
                            { new: true }
                        ).then(updatedUser => {
                            if (updatedUser) {
                                logger.info(`Successfully updated ${platform} heatmap in database for user: ${username}`);
                                // Log what was actually saved
                                const savedData = updatedUser.platforms?.[platform]?.heatmapData;
                                logger.info(`Verified ${platform} heatmap data saved:`, {
                                    type: typeof savedData,
                                    isMap: savedData instanceof Map,
                                    hasData: savedData && Object.keys(convertMapToObject(savedData)).length > 0
                                });
                            } else {
                                logger.error(`Failed to find user ${username} for ${platform} heatmap update`);
                            }
                            return updatedUser;
                        }).catch(updateError => {
                            logger.error(`Error updating ${platform} heatmap for ${username}:`, updateError);
                            throw updateError;
                        })
                    );
                    
                    logger.info(`Successfully fetched and will save ${platform} heatmap for user: ${username}`);
                } else {
                    logger.error(`Failed to fetch ${platform} heatmap for ${username}:`, result.reason);
                    heatmaps[platform] = {}; // Return empty object on failure
                }
            });

            // Execute all database updates
            if (updatePromises.length > 0) {
                try {
                    await Promise.allSettled(updatePromises);
                    logger.info(`Updated heatmap data in database for user: ${username}`);
                } catch (updateError) {
                    logger.error(`Error updating heatmap data in database for ${username}:`, updateError);
                }
            }
        }

        // 5. Store the compiled heatmap object in Redis cache
        if (redisClient.isReady() && Object.keys(heatmaps).length > 0) {
            await redisClient.set(cacheKey, JSON.stringify(heatmaps), HEATMAP_TTL);
            logger.info(`Cached heatmap data in Redis for user: ${username}`);
        }

        res.status(200).json({ success: true, heatmaps });

    } catch (error) {
        logger.error(`Error in getPublicUserHeatMaps for ${username}:`, error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Helper function to convert MongoDB Map to plain object
const convertMapToObject = (mapData) => {
    if (!mapData) {
        return {};
    }
    
    // If it's already a plain object, return as-is
    if (typeof mapData === 'object' && !mapData.toObject && !(mapData instanceof Map)) {
        return mapData;
    }
    
    // If it's a MongoDB Map, convert to object
    if (mapData && typeof mapData.toObject === 'function') {
        return mapData.toObject();
    }
    
    // If it's a JavaScript Map, convert to object
    if (mapData instanceof Map) {
        return Object.fromEntries(mapData);
    }
    
    return {};
};

// Enhanced LeetCode heatmap fetcher
async function getLeetCodeHeatmap(leetcodeUsername) {
    try {
        logger.info(`Fetching LeetCode heatmap for: ${leetcodeUsername}`);
        
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
            headers: { 
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; HeatmapBot/1.0)"
            },
            timeout: 10000 // 10 second timeout
        });

        const matchedUser = response.data?.data?.matchedUser;
        const submissionCalendar = matchedUser?.submissionCalendar;

        if (!submissionCalendar) {
            logger.warn(`No submissionCalendar found for LeetCode user: ${leetcodeUsername}`);
            return {};
        }

        const parsedData = JSON.parse(submissionCalendar);
        logger.info(`Successfully fetched LeetCode heatmap for: ${leetcodeUsername} (${Object.keys(parsedData).length} entries)`);
        return parsedData;

    } catch (error) {
        logger.error(`Error fetching LeetCode heatmap for ${leetcodeUsername}:`, error);
        return {};
    }
}

// Enhanced GitHub heatmap fetcher

async function getGitHubHeatmap(githubUsername) {
    try {
        logger.info(`Fetching GitHub heatmap for: ${githubUsername}`);

        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'HeatmapBot/1.0',
        };

        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
        } else {
            throw new Error('GITHUB_TOKEN not set in environment');
        }

        const query = `
            query {
                user(login: "${githubUsername}") {
                    contributionsCollection {
                        contributionCalendar {
                            totalContributions
                            weeks {
                                contributionDays {
                                    date
                                    contributionCount
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await axios.post(
            'https://api.github.com/graphql',
            { query },
            {
                headers,
                timeout: 10000, // 10 second timeout
            }
        );

        const weeks = response.data?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;

        if (!weeks || !Array.isArray(weeks)) {
            throw new Error('Invalid response format from GitHub GraphQL API');
        }

        const dailyContributions = {};

        for (const week of weeks) {
            for (const day of week.contributionDays) {
                dailyContributions[day.date] = day.contributionCount;
            }
        }

        logger.info(`Successfully fetched GitHub heatmap for: ${githubUsername} (${Object.keys(dailyContributions).length} days)`);
        return dailyContributions;

    } catch (error) {
        logger.error(`Error fetching GitHub heatmap for ${githubUsername}:`, error);

        if (error.response?.status === 403) {
            throw new Error('GitHub API rate limit exceeded');
        } else if (error.response?.status === 404) {
            throw new Error('GitHub user not found');
        }

        return {};
    }
}

// Enhanced Codeforces heatmap fetcher
async function getCodeforcesHeatmap(codeforcesHandle) {
    try {
        logger.info(`Fetching Codeforces heatmap for: ${codeforcesHandle}`);
        
        const response = await axios.get(
            `https://codeforces.com/api/user.status?handle=${codeforcesHandle}`,
            { timeout: 10000 } // 10 second timeout
        );

        if (!response.data || response.data.status !== 'OK' || !response.data.result) {
            throw new Error('Invalid response from Codeforces API');
        }

        const submissions = response.data.result;
        const dailySubmissions = {};

        submissions.forEach(submission => {
            if (!submission.creationTimeSeconds) return;
            
            const date = new Date(submission.creationTimeSeconds * 1000).toISOString().split('T')[0];
            dailySubmissions[date] = (dailySubmissions[date] || 0) + 1;
        });

        logger.info(`Successfully fetched Codeforces heatmap for: ${codeforcesHandle} (${Object.keys(dailySubmissions).length} days)`);
        return dailySubmissions;

    } catch (error) {
        logger.error(`Error fetching Codeforces heatmap for ${codeforcesHandle}:`, error);
        
        if (error.response?.status === 400) {
            throw new Error('Invalid Codeforces handle');
        }
        
        return {};
    }
}