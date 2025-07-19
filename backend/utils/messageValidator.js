const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/message-validation.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

class MessageValidator {
    constructor() {
        // Validation rules
        this.rules = {
            content: {
                minLength: 1,
                maxLength: 2000, // 2000 characters max
                allowEmpty: false
            },
            attachments: {
                maxCount: 5,
                maxSizeBytes: 10 * 1024 * 1024, // 10MB per attachment
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf']
            },
            general: {
                maxEditTimeMinutes: 60, // Can only edit messages within 1 hour
                allowedSpecialChars: /^[\w\s\.\,\!\?\-\(\)\[\]\{\}\@\#\$\%\^\&\*\+\=\|\\\:\;\"\'\`\~\/\<\>]*$/
            }
        };

        // Spam detection patterns
        this.spamPatterns = [
            /(.)\1{10,}/g, // Repeated characters (10+ times)
            /^[A-Z\s!]{20,}$/g, // All caps messages (20+ chars)
            /(https?:\/\/[^\s]+){3,}/g, // Multiple URLs (3+)
            /(.{1,10})\1{5,}/g, // Repeated phrases (5+ times)
        ];

        // Profanity filter (basic - you might want to use a more comprehensive library)
        this.profanityWords = [
            // Add your profanity words here - keeping it minimal for example
            'spam', 'scam', 'fake'
        ];
    }

    /**
     * Validate a message for sending
     * @param {Object} message - Message object
     * @param {string} message.content - Message content
     * @param {string} message.sender - Sender ID
     * @param {Array} message.attachments - Optional attachments
     * @returns {Object} - { valid: boolean, errors: Array, warnings: Array }
     */
    validateMessage(message) {
        const errors = [];
        const warnings = [];

        if (!message || typeof message !== 'object') {
            errors.push('Invalid message format');
            return { valid: false, errors, warnings };
        }

        // Validate required fields
        if (!message.content && (!message.attachments || message.attachments.length === 0)) {
            errors.push('Message must have content or attachments');
        }

        if (!message.sender) {
            errors.push('Message must have a sender');
        }

        // Validate content if present
        if (message.content) {
            const contentValidation = this.validateContent(message.content);
            errors.push(...contentValidation.errors);
            warnings.push(...contentValidation.warnings);
        }

        // Validate attachments if present
        if (message.attachments && message.attachments.length > 0) {
            const attachmentValidation = this.validateAttachments(message.attachments);
            errors.push(...attachmentValidation.errors);
            warnings.push(...attachmentValidation.warnings);
        }

        const valid = errors.length === 0;

        if (!valid) {
            logger.warn(`Message validation failed for sender ${message.sender}:`, { errors, warnings });
        }

        return { valid, errors, warnings };
    }

    /**
     * Validate message content
     * @param {string} content - Message content
     * @returns {Object} - { errors: Array, warnings: Array }
     */
    validateContent(content) {
        const errors = [];
        const warnings = [];

        // Type check
        if (typeof content !== 'string') {
            errors.push('Message content must be a string');
            return { errors, warnings };
        }

        // Length validation
        if (content.length < this.rules.content.minLength) {
            errors.push(`Message too short (minimum ${this.rules.content.minLength} characters)`);
        }

        if (content.length > this.rules.content.maxLength) {
            errors.push(`Message too long (maximum ${this.rules.content.maxLength} characters)`);
        }

        // Empty content check
        if (!this.rules.content.allowEmpty && content.trim().length === 0) {
            errors.push('Message cannot be empty or only whitespace');
        }

        // Character validation
        if (!this.rules.general.allowedSpecialChars.test(content)) {
            warnings.push('Message contains potentially unsafe characters');
        }

        // Spam detection
        const spamCheck = this.detectSpam(content);
        if (spamCheck.isSpam) {
            warnings.push(`Potential spam detected: ${spamCheck.reasons.join(', ')}`);
        }

        // Profanity check
        const profanityCheck = this.detectProfanity(content);
        if (profanityCheck.hasProfanity) {
            warnings.push(`Inappropriate content detected: ${profanityCheck.words.join(', ')}`);
        }

        return { errors, warnings };
    }

    /**
     * Validate message attachments
     * @param {Array} attachments - Array of attachment objects
     * @returns {Object} - { errors: Array, warnings: Array }
     */
    validateAttachments(attachments) {
        const errors = [];
        const warnings = [];

        if (!Array.isArray(attachments)) {
            errors.push('Attachments must be an array');
            return { errors, warnings };
        }

        // Count validation
        if (attachments.length > this.rules.attachments.maxCount) {
            errors.push(`Too many attachments (maximum ${this.rules.attachments.maxCount})`);
        }

        // Validate each attachment
        attachments.forEach((attachment, index) => {
            if (!attachment || typeof attachment !== 'object') {
                errors.push(`Invalid attachment format at index ${index}`);
                return;
            }

            // Size validation (if size is provided)
            if (attachment.size && attachment.size > this.rules.attachments.maxSizeBytes) {
                errors.push(`Attachment ${index} too large (maximum ${this.rules.attachments.maxSizeBytes / 1024 / 1024}MB)`);
            }

            // Type validation (if type is provided)
            if (attachment.type && !this.rules.attachments.allowedTypes.includes(attachment.type)) {
                errors.push(`Attachment ${index} has unsupported type: ${attachment.type}`);
            }

            // URL validation (if URL is provided)
            if (attachment.url && !this.isValidUrl(attachment.url)) {
                errors.push(`Attachment ${index} has invalid URL`);
            }
        });

        return { errors, warnings };
    }

    /**
     * Validate message edit
     * @param {Object} originalMessage - Original message object
     * @param {string} newContent - New content
     * @returns {Object} - { valid: boolean, errors: Array, warnings: Array }
     */
    validateEdit(originalMessage, newContent) {
        const errors = [];
        const warnings = [];

        if (!originalMessage || !originalMessage.createdAt) {
            errors.push('Original message not found or invalid');
            return { valid: false, errors, warnings };
        }

        // Check edit time limit
        const messageAge = Date.now() - new Date(originalMessage.createdAt).getTime();
        const maxEditTime = this.rules.general.maxEditTimeMinutes * 60 * 1000;

        if (messageAge > maxEditTime) {
            errors.push(`Message too old to edit (maximum ${this.rules.general.maxEditTimeMinutes} minutes)`);
        }

        // Validate new content
        const contentValidation = this.validateContent(newContent);
        errors.push(...contentValidation.errors);
        warnings.push(...contentValidation.warnings);

        // Check if content actually changed
        if (originalMessage.content === newContent) {
            warnings.push('No changes detected in message content');
        }

        const valid = errors.length === 0;
        return { valid, errors, warnings };
    }

    /**
     * Detect spam patterns in content
     * @param {string} content - Content to check
     * @returns {Object} - { isSpam: boolean, reasons: Array }
     */
    detectSpam(content) {
        const reasons = [];

        this.spamPatterns.forEach((pattern, index) => {
            if (pattern.test(content)) {
                switch (index) {
                    case 0:
                        reasons.push('repeated characters');
                        break;
                    case 1:
                        reasons.push('excessive caps');
                        break;
                    case 2:
                        reasons.push('multiple URLs');
                        break;
                    case 3:
                        reasons.push('repeated phrases');
                        break;
                }
            }
        });

        return {
            isSpam: reasons.length > 0,
            reasons
        };
    }

    /**
     * Detect profanity in content
     * @param {string} content - Content to check
     * @returns {Object} - { hasProfanity: boolean, words: Array }
     */
    detectProfanity(content) {
        const lowerContent = content.toLowerCase();
        const foundWords = [];

        this.profanityWords.forEach(word => {
            if (lowerContent.includes(word.toLowerCase())) {
                foundWords.push(word);
            }
        });

        return {
            hasProfanity: foundWords.length > 0,
            words: foundWords
        };
    }

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} - Is valid URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Sanitize message content
     * @param {string} content - Content to sanitize
     * @returns {string} - Sanitized content
     */
    sanitizeContent(content) {
        if (typeof content !== 'string') {
            return '';
        }

        // Basic HTML escape
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .trim();
    }

    /**
     * Update validation rules
     * @param {Object} newRules - New rules to merge
     */
    updateRules(newRules) {
        this.rules = { ...this.rules, ...newRules };
        logger.info('Message validation rules updated');
    }

    /**
     * Get current validation statistics
     * @returns {Object} - Current rules and limits
     */
    getValidationInfo() {
        return {
            rules: this.rules,
            spamPatternsCount: this.spamPatterns.length,
            profanityWordsCount: this.profanityWords.length
        };
    }
}

module.exports = MessageValidator;