const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Import the controller directly
const userController = require('../controllers/userController');

// Mock all the dependencies
jest.mock('../models/User');
jest.mock('../utils/authHelpers.js');
jest.mock('../services/leetcode/leetcodeStatsService.js');
jest.mock('../services/github/githubStatsServices.js');
jest.mock('../services/codeforces/codeforcesStatsService.js');
jest.mock('../utils/activeUsers.js');

// Import mocked modules
const User = require('../models/User');
const {
    checkLeetCodeUsername,
    checkGitHubUsername,
    checkCodeforcesUsername
} = require('../utils/authHelpers.js');
const { updateUserLeetCodeStats } = require('../services/leetcode/leetcodeStatsService.js');
const { updateUserGitHubStats } = require('../services/github/githubStatsServices.js');
const { updateUserCodeforcesStats } = require('../services/codeforces/codeforcesStatsService.js');
const {
    getActiveUsersLast7Days,
    getActiveUsersCount,
    getActiveUsersLastNDays
} = require('../utils/activeUsers.js');

// Test configuration
const TEST_JWT = process.env.TEST_JWT || 'test-jwt-secret-key';
const TEST_USER_ID = '507f1f77bcf86cd799439011';

// Helper function to generate test JWT
const generateTestToken = (userId = TEST_USER_ID) => {
    return jwt.sign({ id: userId }, TEST_JWT, { expiresIn: '1h' });
};

// Create test app
const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Auth middleware
    const authMiddleware = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, TEST_JWT);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };

    // Define routes
    app.get('/api/user/details', authMiddleware, userController.getUserDetails);
    app.get('/api/user/search', authMiddleware, userController.searchUser);
    app.post('/api/user/setup/leetcode', authMiddleware, userController.setupLeetCode);
    app.post('/api/user/setup/github', authMiddleware, userController.setupGitHub);
    app.post('/api/user/setup/codeforces', authMiddleware, userController.setupCodeforces);
    app.get('/api/user/active', authMiddleware, userController.getActiveUsers);
    app.get('/api/user/active/count', authMiddleware, userController.getActiveUsersCount);

    return app;
};

// Mock user data
const mockUser = {
    _id: TEST_USER_ID,
    username: 'testuser',
    email: 'test@example.com',
    platforms: {
        leetcode: {
            username: '',
            totalQuestionsSolved: 0,
            questionsSolvedByDifficulty: { easy: 0, medium: 0, hard: 0 },
            attendedContestsCount: 0,
            contestRating: 0
        },
        github: {
            username: '',
            publicRepos: 0,
            followers: 0,
            following: 0
        },
        codeforces: {
            username: '',
            currentRating: 0,
            maxRating: 0,
            rank: '',
            maxRank: '',
            contribution: 0,
            friendOfCount: 0
        }
    },
    isProfileComplete: false,
    save: jest.fn().mockResolvedValue(true)
};

describe('UserController Tests', () => {
    let authToken;
    let app;

    beforeAll(() => {
        authToken = generateTestToken();
        app = createTestApp();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test method selector
    const runTest = (testMethod) => {
        switch (testMethod) {
            case 'getUserDetails':
                return testGetUserDetails();
            case 'searchUser':
                return testSearchUser();
            case 'setupLeetCode':
                return testSetupLeetCode();
            case 'setupGitHub':
                return testSetupGitHub();
            case 'setupCodeforces':
                return testSetupCodeforces();
            case 'getActiveUsers':
                return testGetActiveUsers();
            case 'getActiveUsersCount':
                return testGetActiveUsersCount();
            case 'all':
                return runAllTests();
            default:
                console.log('Invalid test method. Available options: getUserDetails, searchUser, setupLeetCode, setupGitHub, setupCodeforces, getActiveUsers, getActiveUsersCount, all');
        }
    };

    // Individual test functions
    function testGetUserDetails() {
        describe('GET /api/user/details - getUserDetails', () => {
            it('should return user details successfully', async () => {
                User.findById.mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUser)
                });

                const response = await request(app)
                    .get('/api/user/details')
                    .set('Authorization', `Bearer ${authToken}`);

                const { save, ...expectedUser } = mockUser;
                expect(response.status).toBe(200);
                expect(response.body).toEqual(expectedUser);
                expect(User.findById).toHaveBeenCalledWith(TEST_USER_ID);
            });

            it('should return 404 when user not found', async () => {
                User.findById.mockReturnValue({
                    select: jest.fn().mockResolvedValue(null)
                });

                const response = await request(app)
                    .get('/api/user/details')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(404);
                expect(response.body.message).toBe('User not found');
            });

            it('should return 500 on server error', async () => {
                User.findById.mockReturnValue({
                    select: jest.fn().mockRejectedValue(new Error('Database error'))
                });

                const response = await request(app)
                    .get('/api/user/details')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(500);
                expect(response.body.message).toBe('Server error');
            });
        });
    }

    function testSearchUser() {
        describe('GET /api/user/search - searchUser', () => {
            it('should return users matching the search query', async () => {
                const mockUsers = [mockUser];
                User.find.mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUsers)
                });

                const response = await request(app)
                    .get('/api/user/search?query=test')
                    .set('Authorization', `Bearer ${authToken}`);

                const expectedUsers = mockUsers.map(({ save, ...u }) => u);
                expect(response.status).toBe(200);
                expect(response.body).toEqual(expectedUsers);
            });

            it('should return 400 for empty query', async () => {
                const response = await request(app)
                    .get('/api/user/search?query=')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Search query cannot be empty');
            });

            it('should return 404 when no users found', async () => {
                User.find.mockReturnValue({
                    select: jest.fn().mockResolvedValue([])
                });

                const response = await request(app)
                    .get('/api/user/search?query=nonexistent')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(404);
                expect(response.body.message).toBe('No users found matching the query');
            });
        });
    }

    function testSetupLeetCode() {
        describe('POST /api/user/setup/leetcode - setupLeetCode', () => {
            it('should setup LeetCode username successfully', async () => {
                const updatedUser = { ...mockUser };
                updatedUser.platforms.leetcode.username = 'leetcodeuser';

                User.findById.mockResolvedValue(mockUser);
                checkLeetCodeUsername.mockResolvedValue(true);
                updateUserLeetCodeStats.mockResolvedValue({ user: updatedUser });

                const response = await request(app)
                    .post('/api/user/setup/leetcode')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ username: 'leetcodeuser' });

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('LeetCode username updated successfully');
                expect(checkLeetCodeUsername).toHaveBeenCalledWith('leetcodeuser');
            });

            it('should return 400 when username is missing', async () => {
                const response = await request(app)
                    .post('/api/user/setup/leetcode')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({});

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('LeetCode username is required');
            });

            it('should return 400 for invalid LeetCode username', async () => {
                User.findById.mockResolvedValue(mockUser);
                checkLeetCodeUsername.mockResolvedValue(false);

                const response = await request(app)
                    .post('/api/user/setup/leetcode')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ username: 'invalid' });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Invalid LeetCode username');
            });

            it('should return 404 when user not found', async () => {
                User.findById.mockResolvedValue(null);

                const response = await request(app)
                    .post('/api/user/setup/leetcode')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ username: 'leetcodeuser' });

                expect(response.status).toBe(404);
                expect(response.body.message).toBe('User not found');
            });

            it('should handle validation errors', async () => {
                User.findById.mockResolvedValue(mockUser);
                checkLeetCodeUsername.mockRejectedValue(new Error('Validation failed'));

                const response = await request(app)
                    .post('/api/user/setup/leetcode')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ username: 'invalid' });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Invalid LeetCode username');
            });
        });
    }

    function testSetupGitHub() {
        describe('POST /api/user/setup/github - setupGitHub', () => {
            it('should setup GitHub username successfully', async () => {
                const updatedUser = { ...mockUser };
                updatedUser.platforms.github.username = 'githubuser';

                User.findById.mockResolvedValue(mockUser);
                checkGitHubUsername.mockResolvedValue(true);
                updateUserGitHubStats.mockResolvedValue({ user: updatedUser });

                const response = await request(app)
                    .post('/api/user/setup/github')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ username: 'githubuser' });

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('GitHub username updated successfully');
                expect(checkGitHubUsername).toHaveBeenCalledWith('githubuser');
            });

            it('should return 400 when username is missing', async () => {
                const response = await request(app)
                    .post('/api/user/setup/github')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({});

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('GitHub username is required');
            });

            it('should return 400 for invalid GitHub username', async () => {
                User.findById.mockResolvedValue(mockUser);
                checkGitHubUsername.mockResolvedValue(false);

                const response = await request(app)
                    .post('/api/user/setup/github')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ username: 'invalid' });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Invalid GitHub username');
            });

            it('should handle error messages from validation', async () => {
                User.findById.mockResolvedValue(mockUser);
                checkGitHubUsername.mockRejectedValue(new Error('GitHub API error'));

                const response = await request(app)
                    .post('/api/user/setup/github')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ username: 'invalid' });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('GitHub API error');
            });
        });
    }

    function testSetupCodeforces() {
        describe('POST /api/user/setup/codeforces - setupCodeforces', () => {
            it('should setup Codeforces username successfully', async () => {
                const updatedUser = { ...mockUser };
                updatedUser.platforms.codeforces.username = 'codeforcesuser';

                User.findById.mockResolvedValue(mockUser);
                checkCodeforcesUsername.mockResolvedValue(true);
                updateUserCodeforcesStats.mockResolvedValue({ user: updatedUser });

                const response = await request(app)
                    .post('/api/user/setup/codeforces')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ username: 'codeforcesuser' });

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Codeforces username updated successfully');
                expect(checkCodeforcesUsername).toHaveBeenCalledWith('codeforcesuser');
            });

            it('should return 400 when username is missing', async () => {
                const response = await request(app)
                    .post('/api/user/setup/codeforces')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({});

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Codeforces username is required');
            });

            it('should return 400 for invalid Codeforces username', async () => {
                User.findById.mockResolvedValue(mockUser);
                checkCodeforcesUsername.mockResolvedValue(false);

                const response = await request(app)
                    .post('/api/user/setup/codeforces')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ username: 'invalid' });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Invalid Codeforces username');
            });
        });
    }

    function testGetActiveUsers() {
        describe('GET /api/user/active - getActiveUsers', () => {
            it('should return active users for last 7 days by default', async () => {
                const mockActiveUsers = [mockUser];
                getActiveUsersLast7Days.mockResolvedValue(mockActiveUsers);

                const response = await request(app)
                    .get('/api/user/active')
                    .set('Authorization', `Bearer ${authToken}`);

                const expectedActiveUsers = mockActiveUsers.map(({ save, ...u }) => u);
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Active users fetched successfully');
                expect(response.body.count).toBe(1);
                expect(response.body.users).toEqual(expectedActiveUsers);
                expect(getActiveUsersLast7Days).toHaveBeenCalled();
            });

            it('should return active users for specified days', async () => {
                const mockActiveUsers = [mockUser];
                getActiveUsersLastNDays.mockResolvedValue(mockActiveUsers);

                const response = await request(app)
                    .get('/api/user/active?days=30')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.count).toBe(1);
                expect(getActiveUsersLastNDays).toHaveBeenCalledWith(30);
            });

            it('should handle server error', async () => {
                getActiveUsersLast7Days.mockRejectedValue(new Error('Database error'));

                const response = await request(app)
                    .get('/api/user/active')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(500);
                expect(response.body.message).toBe('Server error');
            });
        });
    }

    function testGetActiveUsersCount() {
        describe('GET /api/user/active/count - getActiveUsersCount', () => {
            it('should return active users count', async () => {
                getActiveUsersCount.mockResolvedValue(10);

                const response = await request(app)
                    .get('/api/user/active/count')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Active users count fetched successfully');
                expect(response.body.count).toBe(10);
                expect(getActiveUsersCount).toHaveBeenCalled();
            });

            it('should handle server error', async () => {
                getActiveUsersCount.mockRejectedValue(new Error('Database error'));

                const response = await request(app)
                    .get('/api/user/active/count')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(500);
                expect(response.body.message).toBe('Server error');
            });
        });
    }

    function runAllTests() {
        testGetUserDetails();
        testSearchUser();
        testSetupLeetCode();
        testSetupGitHub();
        testSetupCodeforces();
        testGetActiveUsers();
        testGetActiveUsersCount();
    }

    // Authorization tests
    describe('Authorization Tests', () => {
        it('should return 401 for requests without token', async () => {
            const response = await request(app)
                .get('/api/user/details');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('No token provided');
        });

        it('should return 401 for requests with invalid token', async () => {
            const response = await request(app)
                .get('/api/user/details')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return 401 for requests with malformed authorization header', async () => {
            const response = await request(app)
                .get('/api/user/details')
                .set('Authorization', 'invalid-format');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('No token provided');
        });
    });

    // Run tests based on environment variable or run all
    const testMethod = process.env.TEST_METHOD || 'all';
    runTest(testMethod);
});

// Export the test runner for external use
// module.exports = { runTest };