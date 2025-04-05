const checkPlatformStatus = async (req, res, next) => {
  try {
    // Skip if no authenticated user
    if (!req.user) {
      return next();
    }
    
    const user = req.user;
    const warnings = [];
    
    // Check each platform
    ['leetcode', 'github', 'codeforces'].forEach(platform => {
      if (user.platforms?.[platform]?.username && user.platforms[platform].isValid === false) {
        warnings.push({
          platform,
          message: `Your ${platform} username appears to be invalid or has changed. Please update it.`
        });
      }
    });
    
    // Attach warnings to the response
    if (warnings.length > 0) {
      // Create or append to existing metaData
      res.locals.metaData = res.locals.metaData || {};
      res.locals.metaData.platformWarnings = warnings;
    }
    
    next();
  } catch (error) {
    // Don't interrupt the main request flow for this check
    console.error('Error in platform status middleware:', error);
    next();
  }
};

// Response handler middleware to include metadata
const includeMetaData = (req, res, next) => {
  // Store the original res.json function
  const originalJson = res.json;
  
  // Override res.json to include metaData
  res.json = function(body) {
    // If we have metaData, include it in the response
    if (res.locals.metaData) {
      if (typeof body === 'object' && body !== null) {
        body.metaData = res.locals.metaData;
      }
    }
    
    // Call the original json function
    return originalJson.call(this, body);
  };
  
  next();
};

module.exports = { checkPlatformStatus, includeMetaData }; 