const { updateUserLeetCodeStats } = require('./leetcode/leetcodeStatsService');
const { updateUserGitHubStats } = require('./github/githubStatsServices');
const { updateUserCodeforcesStats } = require('./codeforces/codeforcesStatsService');

/**
 * Factory for platform-specific services
 */
class PlatformServiceFactory {
  /**
   * Get the appropriate stats update service for a platform
   * @param {string} platform - 'leetcode', 'github', or 'codeforces'
   * @returns {Function} - The stats update function
   */
  static getStatsUpdateService(platform) {
    switch (platform) {
      case 'leetcode':
        return updateUserLeetCodeStats;
      case 'github':
        return updateUserGitHubStats;
      case 'codeforces':
        return updateUserCodeforcesStats;
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }
  
  /**
   * Update stats for multiple platforms at once
   * @param {Object} user - User document
   * @param {Array} platforms - List of platforms to update
   * @param {boolean} throwError - Whether to throw errors
   * @returns {Promise<Object>} - Results object
   */
  static async updateMultiplePlatforms(user, platforms, throwError = false) {
    const results = {
      user: user,
      platformResults: {},
      warnings: []
    };
    
    const updatePromises = platforms.map(async platform => {
      try {
        if (!user.platforms[platform]?.username) {
          return;
        }
        
        const updateFn = this.getStatsUpdateService(platform);
        const result = await updateFn(user, false);
        
        results.platformResults[platform] = result.user.platforms[platform];
        
        if (result.error) {
          results.warnings.push({
            platform,
            message: result.error.message,
            code: result.error.code
          });
        }
      } catch (error) {
        console.error(`Error updating ${platform} stats:`, error);
        results.warnings.push({
          platform,
          message: `Failed to update ${platform} stats`,
          code: error.code || 'UNKNOWN_ERROR'
        });
        
        if (throwError) {
          throw error;
        }
      }
    });
    
    await Promise.all(updatePromises);
    return results;
  }
}

module.exports = PlatformServiceFactory; 