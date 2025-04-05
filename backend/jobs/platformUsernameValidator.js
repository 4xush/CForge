const User = require('../models/User');
const { validatePlatformUsername, handleInvalidUsername } = require('../services/platformValidationService');

/**
 * Periodically validates platform usernames to ensure they're still valid
 */
const validateUsernames = async () => {
  try {
    console.log('Starting platform username validation job');
    
    // Find users with platform usernames that need validation
    // Last validation > 7 days ago or never validated
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    const users = await User.find({
      $or: [
        { "platforms.leetcode.username": { $ne: null }, "platforms.leetcode.lastValidationCheck": { $lt: cutoffDate } },
        { "platforms.leetcode.username": { $ne: null }, "platforms.leetcode.lastValidationCheck": { $exists: false } },
        { "platforms.github.username": { $ne: null }, "platforms.github.lastValidationCheck": { $lt: cutoffDate } },
        { "platforms.github.username": { $ne: null }, "platforms.github.lastValidationCheck": { $exists: false } },
        { "platforms.codeforces.username": { $ne: null }, "platforms.codeforces.lastValidationCheck": { $lt: cutoffDate } },
        { "platforms.codeforces.username": { $ne: null }, "platforms.codeforces.lastValidationCheck": { $exists: false } }
      ]
    }).limit(100); // Process in batches
    
    console.log(`Found ${users.length} users to validate platform usernames`);
    
    for (const user of users) {
      // Validate each platform username
      const platforms = ['leetcode', 'github', 'codeforces'];
      
      for (const platform of platforms) {
        if (user.platforms[platform]?.username) {
          try {
            const username = user.platforms[platform].username;
            const isValid = await validatePlatformUsername(platform, username);
            
            if (!isValid) {
              await handleInvalidUsername(user, platform);
            } else {
              // Update last validation check time
              user.platforms[platform].isValid = true;
              user.platforms[platform].lastValidationCheck = new Date();
              await user.save();
            }
          } catch (error) {
            console.error(`Error validating ${platform} username for user ${user._id}:`, error.message);
            // For network/service errors, don't invalidate the username yet
            // Just update the check time so we try again in the next cycle
            user.platforms[platform].lastValidationCheck = new Date();
            await user.save();
          }
        }
      }
    }
    
    console.log('Completed platform username validation job');
  } catch (error) {
    console.error('Error in username validation job:', error);
  }
};

module.exports = { validateUsernames }; 