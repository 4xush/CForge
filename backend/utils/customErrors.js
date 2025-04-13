    // backend/utils/customErrors.js
    class PlatformUsernameError extends Error {
        constructor(message, platform, code = 'INVALID_USERNAME') {
          super(message);
          this.name = 'PlatformUsernameError';
          this.platform = platform; // 'leetcode', 'codeforces', etc.
          this.code = code; // e.g., 'INVALID_USERNAME', 'FETCH_FAILED'
          // Ensure the stack trace is captured correctly
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PlatformUsernameError);
          }
        }
      }
  
      module.exports = { PlatformUsernameError };