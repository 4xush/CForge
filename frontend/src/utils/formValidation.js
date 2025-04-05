/**
 * Form validation utility
 */

// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password strength validation
export const getPasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: 'Password is required' };
    
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length < 8) {
        feedback.push('Password should be at least 8 characters');
    } else {
        score += 1;
    }
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Provide feedback based on score
    if (score < 2) {
        feedback.push('Consider adding uppercase, lowercase, numbers, or special characters');
    }
    
    return {
        score: Math.min(score, 5),
        feedback: feedback.join('. ')
    };
};

// Username validation
export const isValidUsername = (username) => {
    if (!username || username.length < 3) return false;
    
    // Allow letters, numbers, and some special characters
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    return usernameRegex.test(username);
};

// Form field validators (returns error message or empty string)
export const validateField = (name, value, options = {}) => {
    switch (name) {
        case 'email':
            return !value ? 'Email is required' 
                : !isValidEmail(value) ? 'Please enter a valid email address'
                : '';
                
        case 'password':
            const minLength = options.minLength || 8;
            return !value ? 'Password is required'
                : value.length < minLength ? `Password must be at least ${minLength} characters`
                : '';
                
        case 'confirmPassword':
            return !value ? 'Please confirm your password'
                : value !== options.password ? 'Passwords do not match'
                : '';
                
        case 'username':
            return !value ? 'Username is required'
                : !isValidUsername(value) ? 'Username may only contain letters, numbers, and the characters . _ -'
                : '';
                
        case 'fullName':
            return !value ? 'Full name is required'
                : value.length < 2 ? 'Full name must be at least 2 characters'
                : '';
                
        case 'platformUsername':
            return !value ? 'Username is required' : '';
                
        default:
            return !value && options.required ? `${name} is required` : '';
    }
};

// Validate entire form
export const validateForm = (formData, schema) => {
    const errors = {};
    let isValid = true;
    
    Object.entries(schema).forEach(([field, rules]) => {
        const value = formData[field];
        const error = validateField(field, value, {
            ...rules,
            password: field === 'confirmPassword' ? formData.password : undefined
        });
        
        if (error) {
            errors[field] = error;
            isValid = false;
        }
    });
    
    return { isValid, errors };
};