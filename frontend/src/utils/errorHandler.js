import { toast } from 'react-hot-toast';

// Error categories
export const ERROR_CATEGORIES = {
  AUTH: 'auth',
  NETWORK: 'network',
  SERVER: 'server',
  VALIDATION: 'validation',
  RESOURCE: 'resource',
  PLATFORM: 'platform',
  UNKNOWN: 'unknown'
};

/**
 * Centralized error handler
 * @param {Error} error - The error object
 * @param {Object} options - Handler options
 * @returns {Object} - Normalized error object
 */
export const handleError = (error, options = {}) => {
  const {
    showToast = true,
    throwError = false,
    context = '',
    defaultMessage = 'An unexpected error occurred'
  } = options;
  
  // Normalize the error
  const normalizedError = normalizeError(error, context, defaultMessage);
  
  // Log error for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR][${context}]`, normalizedError);
  }
  
  // Show toast notifications based on category
  if (showToast) {
    displayErrorToast(normalizedError);
  }
  
  // Throw the normalized error if required
  if (throwError) {
    throw normalizedError;
  }
  
  return normalizedError;
};

/**
 * Convert error to a standardized format
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @param {string} defaultMessage - Fallback error message
 * @returns {Object} - Normalized error object
 */
const normalizeError = (error, context, defaultMessage) => {
  let normalizedError = {
    originalError: error,
    message: defaultMessage,
    category: ERROR_CATEGORIES.UNKNOWN,
    context,
    timestamp: new Date().toISOString()
  };
  
  // Handle Axios errors
  if (error.response) {
    const { status, data } = error.response;
    normalizedError.status = status;
    normalizedError.message = data?.message || error.message || defaultMessage;
    
    // Categorize based on status
    if (status === 401 || status === 403) {
      normalizedError.category = ERROR_CATEGORIES.AUTH;
    } else if (status === 404) {
      normalizedError.category = ERROR_CATEGORIES.RESOURCE;
    } else if (status >= 400 && status < 500) {
      normalizedError.category = ERROR_CATEGORIES.VALIDATION;
    } else if (status >= 500) {
      normalizedError.category = ERROR_CATEGORIES.SERVER;
    }
  } 
  // Handle network errors
  else if (error.request || error.message === 'Network Error') {
    normalizedError.category = ERROR_CATEGORIES.NETWORK;
    normalizedError.message = 'Network connection issue. Please check your internet.';
  }
  // Platform-specific errors
  else if (error.code?.includes('PLATFORM_')) {
    normalizedError.category = ERROR_CATEGORIES.PLATFORM;
    normalizedError.platform = error.platform;
  }
  // Regular JS errors
  else if (error instanceof Error) {
    normalizedError.message = error.message;
    normalizedError.stack = error.stack;
  }
  
  return normalizedError;
};

/**
 * Display appropriate toast notification based on error type
 * @param {Object} error - Normalized error object
 */
const displayErrorToast = (error) => {
  const { category, message } = error;
  
  switch (category) {
    case ERROR_CATEGORIES.AUTH:
      toast.error(message || 'Authentication error. Please log in again.', {
        id: `auth-error-${Date.now()}`,
        duration: 5000
      });
      break;
      
    case ERROR_CATEGORIES.NETWORK:
      toast.error(message || 'Network error. Please check your connection.', {
        id: `network-error-${Date.now()}`,
        duration: 5000
      });
      break;
      
    case ERROR_CATEGORIES.SERVER:
      toast.error(message || 'Server error. Please try again later.', {
        id: `server-error-${Date.now()}`,
        duration: 5000
      });
      break;
      
    case ERROR_CATEGORIES.RESOURCE:
      toast.error(message || 'Resource not found.', {
        id: `resource-error-${Date.now()}`,
        duration: 5000
      });
      break;
      
    case ERROR_CATEGORIES.PLATFORM:
      toast.error(message || 'Platform connection error.', {
        id: `platform-error-${Date.now()}`,
        duration: 5000,
        icon: '🔌'
      });
      break;
      
    case ERROR_CATEGORIES.VALIDATION:
      // Don't show toast for validation errors unless specifically requested
      // These are usually handled by the form UI
      break;
      
    default:
      toast.error(message || 'An unexpected error occurred.', {
        id: `unknown-error-${Date.now()}`,
        duration: 5000
      });
  }
};