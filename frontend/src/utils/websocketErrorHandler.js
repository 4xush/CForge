import toast from "react-hot-toast";

/**
 * Enhanced WebSocket error handler for rate limiting and validation errors
 */
class WebSocketErrorHandler {
    constructor() {
        this.rateLimitToasts = new Map(); // Track active rate limit toasts
    }

    /**
     * Handle message errors from enhanced WebSocket service
     * @param {Object} error - Error object from WebSocket
     * @param {Function} onRetry - Optional retry callback
     */
    handleMessageError(error, onRetry = null) {
        console.error('WebSocket message error:', error);

        switch (error.type) {
            case 'rate_limit':
                this.handleRateLimitError(error, 'message', onRetry);
                break;
            case 'validation':
                this.handleValidationError(error);
                break;
            default:
                this.handleGenericError(error);
                break;
        }
    }

    /**
     * Handle room errors from enhanced WebSocket service
     * @param {Object} error - Error object from WebSocket
     * @param {Function} onRetry - Optional retry callback
     */
    handleRoomError(error, onRetry = null) {
        console.error('WebSocket room error:', error);

        switch (error.type) {
            case 'rate_limit':
                this.handleRateLimitError(error, 'room_join', onRetry);
                break;
            default:
                this.handleGenericError(error);
                break;
        }
    }

    /**
     * Handle rate limit errors with countdown timer
     * @param {Object} error - Rate limit error
     * @param {string} action - Action type (message, room_join, edit)
     * @param {Function} onRetry - Optional retry callback
     */
    handleRateLimitError(error, action, onRetry = null) {
        const { retryAfter, reason } = error;
        const toastId = `rate_limit_${action}`;

        // Dismiss existing rate limit toast for this action
        if (this.rateLimitToasts.has(toastId)) {
            toast.dismiss(this.rateLimitToasts.get(toastId));
        }

        // Create countdown toast
        let remainingTime = retryAfter;
        const countdownToast = toast.error(
            `${this.getActionDisplayName(action)} rate limit exceeded. Try again in ${remainingTime}s`,
            {
                id: toastId,
                duration: retryAfter * 1000,
                icon: '⏱️'
            }
        );

        this.rateLimitToasts.set(toastId, countdownToast);

        // Update countdown every second
        const countdownInterval = setInterval(() => {
            remainingTime--;
            if (remainingTime > 0) {
                toast.error(
                    `${this.getActionDisplayName(action)} rate limit exceeded. Try again in ${remainingTime}s`,
                    {
                        id: toastId,
                        duration: remainingTime * 1000,
                        icon: '⏱️'
                    }
                );
            } else {
                clearInterval(countdownInterval);
                this.rateLimitToasts.delete(toastId);
                
                // Show retry available message
                toast.success(`You can now ${action === 'message' ? 'send messages' : action === 'room_join' ? 'join rooms' : 'edit messages'} again`, {
                    duration: 3000,
                    icon: '✅'
                });

                // Call retry callback if provided
                if (onRetry && typeof onRetry === 'function') {
                    setTimeout(onRetry, 500); // Small delay before retry
                }
            }
        }, 1000);

        // Clean up interval after rate limit expires
        setTimeout(() => {
            clearInterval(countdownInterval);
            this.rateLimitToasts.delete(toastId);
        }, retryAfter * 1000 + 1000);
    }

    /**
     * Handle validation errors
     * @param {Object} error - Validation error
     */
    handleValidationError(error) {
        const { details } = error;
        
        if (Array.isArray(details) && details.length > 0) {
            // Show first validation error
            toast.error(`Message validation failed: ${details[0]}`, {
                duration: 4000,
                icon: '⚠️'
            });

            // Log all validation errors for debugging
            console.warn('All validation errors:', details);
        } else {
            toast.error('Message validation failed. Please check your message content.', {
                duration: 4000,
                icon: '⚠️'
            });
        }
    }

    /**
     * Handle generic WebSocket errors
     * @param {Object} error - Generic error
     */
    handleGenericError(error) {
        const message = error.error || error.message || 'An unexpected error occurred';
        toast.error(message, {
            duration: 4000,
            icon: '❌'
        });
    }

    /**
     * Handle message sent with warnings
     * @param {Object} response - Message sent response with warnings
     */
    handleMessageWarnings(response) {
        if (response.warnings && response.warnings.length > 0) {
            // Show warning for potential spam/inappropriate content
            toast.warning(`Message sent with warnings: ${response.warnings[0]}`, {
                duration: 3000,
                icon: '⚠️'
            });
        }
    }

    /**
     * Get display name for action type
     * @param {string} action - Action type
     * @returns {string} - Display name
     */
    getActionDisplayName(action) {
        switch (action) {
            case 'message':
                return 'Message sending';
            case 'room_join':
                return 'Room joining';
            case 'edit':
                return 'Message editing';
            default:
                return 'Action';
        }
    }

    /**
     * Show rate limit status to user
     * @param {Object} status - Rate limit status
     * @param {string} action - Action type
     */
    showRateLimitStatus(status, action) {
        const { count, limit, blocked, blockedUntil } = status;
        
        if (blocked && blockedUntil) {
            const remainingTime = Math.ceil((blockedUntil - Date.now()) / 1000);
            toast.error(`${this.getActionDisplayName(action)} blocked for ${remainingTime}s`, {
                duration: 3000,
                icon: '🚫'
            });
        } else if (count > limit * 0.8) {
            // Warn when approaching limit
            toast.warning(`${this.getActionDisplayName(action)}: ${count}/${limit} (approaching limit)`, {
                duration: 2000,
                icon: '⚠️'
            });
        }
    }

    /**
     * Clear all active rate limit toasts
     */
    clearAllRateLimitToasts() {
        for (const [toastId, toast] of this.rateLimitToasts.entries()) {
            toast.dismiss(toast);
        }
        this.rateLimitToasts.clear();
    }
}

// Create singleton instance
const webSocketErrorHandler = new WebSocketErrorHandler();

export default webSocketErrorHandler;