/**
 * Validates user data structure
 * @param {Object} userData - User data to validate
 * @returns {boolean} - Whether the user data is valid
 */
export const validateUserData = (userData) => {
  if (!userData) return false;
  
  // Basic structure validation
  const requiredFields = ['_id', 'username', 'email'];
  const hasRequiredFields = requiredFields.every(field => !!userData[field]);
  
  // Validate platforms object if it exists
  let validPlatforms = true;
  if (userData.platforms) {
    // Check if platforms object has the expected structure
    const platformNames = ['leetcode', 'github', 'codeforces'];
    validPlatforms = platformNames.every(platform => {
      // Platform can be missing, but if present must have the right structure
      if (!userData.platforms[platform]) return true;
      return typeof userData.platforms[platform] === 'object';
    });
  }
  
  return hasRequiredFields && validPlatforms;
};