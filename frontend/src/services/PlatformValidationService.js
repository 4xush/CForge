import ApiService from './ApiService';
import toast from 'react-hot-toast';

class PlatformValidationService {
    // Validate LeetCode username
    async validateLeetCodeUsername(username) {
        try {
            const response = await ApiService.get(`/platform/validate/leetcode/${username}`);
            return response.data.valid;
        } catch (error) {
            console.error('LeetCode validation error:', error);
            return false;
        }
    }
    
    // Check if a user's platforms are valid
    async checkUserPlatforms(user) {
        const warnings = [];
        
        // Check for platform validation flags from API response metadata
        if (user.platforms) {
            if (user.platforms.leetcode?.isValid === false) {
                warnings.push({
                    platform: 'leetcode',
                    message: 'Your LeetCode username appears to be invalid or changed'
                });
            }
            
            if (user.platforms.github?.isValid === false) {
                warnings.push({
                    platform: 'github',
                    message: 'Your GitHub username appears to be invalid or changed'
                });
            }
            
            if (user.platforms.codeforces?.isValid === false) {
                warnings.push({
                    platform: 'codeforces',
                    message: 'Your Codeforces username appears to be invalid or changed'
                });
            }
        }
        
        // Show toast notifications for warnings
        if (warnings.length > 0) {
            warnings.forEach(warning => {
                toast.error(warning.message, {
                    id: `platform-warning-${warning.platform}`,
                    duration: 6000,
                    action: {
                        text: 'Fix',
                        onClick: () => window.location.href = '/settings?tab=platforms'
                    }
                });
            });
        }
        
        return warnings;
    }
}

export default new PlatformValidationService(); 