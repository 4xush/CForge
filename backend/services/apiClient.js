const axios = require('axios');

/**
 * Creates an API client with enhanced error handling
 * @param {Object} options - Configuration options
 * @returns {Object} - API client instance
 */
const createApiClient = (options = {}) => {
  const client = axios.create({
    timeout: options.timeout || 10000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CodeForge/1.0.0',
      ...options.headers
    }
  });
  
  // Response interceptor
  client.interceptors.response.use(
    response => response,
    error => {
      // Customize error handling based on status
      if (error.response) {
        // API responded with error status
        const status = error.response.status;
        
        if (status === 404) {
          error.customMessage = 'Resource not found';
          error.code = 'RESOURCE_NOT_FOUND';
        } else if (status === 429) {
          error.customMessage = 'Rate limit exceeded';
          error.code = 'RATE_LIMIT_EXCEEDED';
          error.retryAfter = error.response.headers['retry-after'] || 60;
        } else if (status >= 500) {
          error.customMessage = 'External service unavailable';
          error.code = 'SERVICE_UNAVAILABLE';
        }
      } else if (error.request) {
        // Request made but no response received
        error.customMessage = 'External service did not respond';
        error.code = 'SERVICE_TIMEOUT';
      } else {
        // Error setting up request
        error.customMessage = 'Request configuration error';
        error.code = 'REQUEST_ERROR';
      }
      
      console.error(`API Error (${error.code}): ${error.customMessage}`, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return Promise.reject(error);
    }
  );
  
  return client;
};

module.exports = createApiClient; 