/**
 * Retries an async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of the function
 */
const retryWithBackoff = async (fn, options = {}) => {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 300;
  const maxDelay = options.maxDelay || 3000;
  const factor = options.factor || 2;
  
  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      // Check if we should retry
      const shouldRetry = 
        attempt < maxRetries && 
        (options.retryCondition ? options.retryCondition(error) : true);
      
      if (!shouldRetry) {
        throw error;
      }
      
      // Calculate delay with jitter
      const delay = Math.min(
        maxDelay,
        baseDelay * Math.pow(factor, attempt - 1) * (0.8 + Math.random() * 0.4)
      );
      
      console.log(`Retry attempt ${attempt} for API call. Retrying in ${delay}ms`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = { retryWithBackoff }; 