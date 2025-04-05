const axios = require('axios');
const User = require('../models/User');

/**
 * Validates if a platform username is still valid
 * @param {string} platform - 'leetcode', 'github' or 'codeforces'
 * @param {string} username - The username to validate
 * @returns {Promise<boolean>} - Whether username is valid
 */
const validatePlatformUsername = async (platform, username) => {
  try {
    switch(platform) {
      case 'leetcode':
        const query = `{ matchedUser(username: "${username}") { username } }`;
        const response = await axios.post(
          "https://leetcode.com/graphql",
          { query },
          { headers: { "Content-Type": "application/json" } }
        );
        return !!response.data.data.matchedUser;
        
      case 'github':
        const githubRes = await axios.get(`https://api.github.com/users/${username}`);
        return githubRes.status === 200;
        
      case 'codeforces':
        const cfRes = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`);
        return cfRes.data.status === "OK";
        
      default:
        return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return false; // Username doesn't exist
    }
    if (error.response?.status === 429) {
      throw new Error(`${platform} API rate limit exceeded. Please try again later.`);
    }
    // For connection issues, don't invalidate the username yet
    throw new Error(`Unable to verify ${platform} username. Network or service issue.`);
  }
};

/**
 * Marks a platform username as invalid in the user's record
 * @param {string} userId - MongoDB user ID
 * @param {string} platform - 'leetcode', 'github' or 'codeforces'
 */
const markPlatformUsernameInvalid = async (userId, platform) => {
  const updateField = `platforms.${platform}.isValid`;
  const lastCheckField = `platforms.${platform}.lastValidationCheck`;
  
  await User.findByIdAndUpdate(userId, {
    $set: {
      [updateField]: false,
      [lastCheckField]: new Date()
    }
  });
};

/**
 * Handles the case when a platform username is found to be invalid
 * @param {Object} user - User document
 * @param {string} platform - 'leetcode', 'github' or 'codeforces'
 */
const handleInvalidUsername = async (user, platform) => {
  // 1. Mark username as invalid
  await markPlatformUsernameInvalid(user._id, platform);
  
  // 2. Send notification to user (implement notification system)
  // notificationService.sendUsernameInvalidNotification(user, platform);
  
  // 3. Log the event
  console.log(`[USERNAME_INVALID] User ${user._id} has invalid ${platform} username: ${user.platforms[platform].username}`);
  
  return {
    isValid: false,
    message: `Your ${platform} username appears to be invalid or has changed. Please update it in your profile.`
  };
};

module.exports = {
  validatePlatformUsername,
  markPlatformUsernameInvalid,
  handleInvalidUsername
}; 