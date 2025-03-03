/**
 * Validation utilities for user and platform data
 */

export const validatePlatformData = (platform) => {
    if (!platform || typeof platform !== 'object') return false;

    // Base validation for common platform fields
    const hasValidUsername = typeof platform.username === 'string';
    const hasValidTotalQuestions = typeof platform.totalQuestionsSolved === 'number' || platform.totalQuestionsSolved === undefined;
    const hasValidRating = typeof platform.contestRating === 'number' || platform.contestRating === undefined;

    return hasValidUsername || hasValidTotalQuestions || hasValidRating;
};

export const validateUserData = (user) => {
    if (!user || typeof user !== 'object') return false;

    const validationRules = {
        fullName: (val) => typeof val === 'string' && val.length >= 2,
        username: (val) => typeof val === 'string' && val.length >= 2,
        email: (val) => typeof val === 'string' && val.includes('@'),
        profilePicture: (val) => typeof val === 'string' && val.startsWith('http'),
        platforms: (val) => {
            if (!val || typeof val !== 'object') return false;

            // Validate each platform's data if it exists
            const supportedPlatforms = ['leetcode', 'codeforces'];
            return supportedPlatforms.every(platform => {
                return !val[platform] || validatePlatformData(val[platform]);
            });
        }
    };

    return Object.entries(validationRules).every(([field, validator]) => {
        const isValid = validator(user[field]);
        if (!isValid) {
            console.warn(`Invalid user data: ${field} failed validation`);
        }
        return isValid;
    });
};