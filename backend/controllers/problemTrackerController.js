const Problem = require('../models/Problem');
const UserSolvedProblem = require('../models/UserSolvedProblem');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const mongoose = require('mongoose');
const redisClient = require('../services/cache/redisClient');
const { getRecentSubmissions, getProblemDetails } = require('../services/leetcode/leetcodeProblemService');
const { PlatformUsernameError } = require('../utils/customErrors');

/**
 * Sync user's recent solved problems from LeetCode
 * Auto-fetches latest 10 problems and creates/updates records
 */
const syncRecentProblems = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Rate limiting: Allow sync only once every 5 minutes per user
    const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
    const lastSyncKey = `problem_sync:${userId}`;

    let lastSyncTime = 0;
    try {
      // Try to get from Redis first, fallback to memory cache
      if (redisClient && redisClient.isConnected) {
        const cached = await redisClient.get(lastSyncKey);
        lastSyncTime = cached ? parseInt(cached) : 0;
      } else {
        // Fallback to memory cache
        if (!global.syncCache) global.syncCache = {};
        lastSyncTime = global.syncCache[lastSyncKey] || 0;
      }
    } catch (error) {
      console.warn('Cache check failed, proceeding with sync:', error.message);
    }

    const now = Date.now();
    if (now - lastSyncTime < SYNC_COOLDOWN_MS) {
      const remainingTime = Math.ceil((SYNC_COOLDOWN_MS - (now - lastSyncTime)) / 1000);
      return res.status(429).json({
        message: `Please wait ${remainingTime} seconds before syncing again`,
        cooldownSeconds: remainingTime,
        nextSyncAllowed: new Date(lastSyncTime + SYNC_COOLDOWN_MS).toISOString()
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const leetcodeUsername = user.platforms?.leetcode?.username;
    if (!leetcodeUsername) {
      return res.status(400).json({
        message: 'LeetCode username not configured. Please add your LeetCode username in settings first.'
      });
    }

    // Fetch recent submissions from LeetCode
    const recentSubmissions = await getRecentSubmissions(leetcodeUsername, 20);
    if (recentSubmissions.length === 0) {
      return res.json({
        message: 'No recent accepted submissions found',
        synced: 0,
        problems: []
      });
    }

    const syncResults = {
      synced: 0,
      created: 0,
      updated: 0,
      problems: []
    };

    // Process each submission
    for (const submission of recentSubmissions) {
      try {
        // Check if problem exists, create if not
        let problem = await Problem.findOne({ leetcodeId: submission.titleSlug });

        if (!problem) {
          // Fetch additional problem details if needed
          let problemDetails;
          try {
            problemDetails = await getProblemDetails(submission.titleSlug);
          } catch (detailError) {
            console.warn(`Could not fetch details for ${submission.titleSlug}, using submission data`);
            problemDetails = {
              leetcodeId: submission.titleSlug,
              title: submission.title,
              url: submission.url,
              difficulty: null
            };
          }

          problem = new Problem({
            leetcodeId: problemDetails.leetcodeId,
            title: problemDetails.title,
            url: problemDetails.url,
            difficulty: problemDetails.difficulty
          });
          await problem.save();
        }

        // Check if user already has this problem tracked
        let userSolvedProblem = await UserSolvedProblem.findOne({
          user: userId,
          problem: problem._id
        });

        if (!userSolvedProblem) {
          // Create new UserSolvedProblem record
          userSolvedProblem = new UserSolvedProblem({
            user: userId,
            problem: problem._id,
            solvedAt: submission.solvedAt,
            syncSource: 'leetcode_api',
            lastSyncedAt: new Date()
          });
          await userSolvedProblem.save();
          syncResults.created++;
        } else {
          // Update existing record
          userSolvedProblem.lastSyncedAt = new Date();
          userSolvedProblem.syncSource = 'leetcode_api';
          // Update solvedAt if this submission is more recent
          if (submission.solvedAt > userSolvedProblem.solvedAt) {
            userSolvedProblem.solvedAt = submission.solvedAt;
          }
          await userSolvedProblem.save();
          syncResults.updated++;
        }

        // Populate problem details for response
        await userSolvedProblem.populate('problem');
        syncResults.problems.push({
          id: userSolvedProblem._id,
          problem: {
            id: problem._id,
            title: problem.title,
            url: problem.url,
            difficulty: problem.difficulty,
            leetcodeId: problem.leetcodeId
          },
          solvedAt: userSolvedProblem.solvedAt,
          notes: userSolvedProblem.notes,
          isImportant: userSolvedProblem.isImportant,
          isBookmarked: userSolvedProblem.isBookmarked,
          tags: userSolvedProblem.tags,
          lastReviewedAt: userSolvedProblem.lastReviewedAt,
          reviewCount: userSolvedProblem.reviewCount
        });

        syncResults.synced++;

      } catch (problemError) {
        console.error(`Error processing problem ${submission.titleSlug}:`, problemError.message);
        // Continue with other problems
      }
    }

    // Update sync cache
    try {
      if (redisClient && redisClient.isConnected) {
        await redisClient.set(lastSyncKey, now.toString(), 300); // 5 minutes TTL
      } else {
        if (!global.syncCache) global.syncCache = {};
        global.syncCache[lastSyncKey] = now;
      }
    } catch (error) {
      console.warn('Failed to update sync cache:', error.message);
    }

    res.json({
      message: `Successfully synced ${syncResults.synced} problems`,
      ...syncResults
    });

  } catch (error) {
    console.error('Error syncing recent problems:', error);

    if (error instanceof PlatformUsernameError) {
      return res.status(400).json({
        message: error.message,
        platform: error.platform,
        errorCode: error.errorCode
      });
    }

    res.status(500).json({
      message: 'Failed to sync recent problems',
      error: error.message
    });
  }
};

/**
 * Get user's tracked problems with pagination and filtering
 */
const getTrackedProblems = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      isImportant,
      bookmarked,
      search,
      sortBy = 'solvedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = { user: userId };

    if (isImportant) {
      filter.isImportant = isImportant;
    }

    if (bookmarked === 'true') {
      filter.isBookmarked = true;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Base query
    let query = UserSolvedProblem.find(filter)
      .populate('problem')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Add search if provided
    if (search) {
      const problems = await Problem.find({
        title: { $regex: search, $options: 'i' }
      }).select('_id');

      const problemIds = problems.map(p => p._id);
      filter.problem = { $in: problemIds };

      query = UserSolvedProblem.find(filter)
        .populate('problem')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const trackedProblems = await query;
    const total = await UserSolvedProblem.countDocuments(filter);

    // Get reminder counts for each problem
    const problemIds = trackedProblems.map(usp => usp._id);
    const reminderCounts = await Reminder.aggregate([
      { $match: { userSolvedProblem: { $in: problemIds }, isActive: true } },
      { $group: { _id: '$userSolvedProblem', count: { $sum: 1 } } }
    ]);
    
    const reminderCountMap = {};
    reminderCounts.forEach(rc => {
      reminderCountMap[rc._id.toString()] = rc.count;
    });

    // Format response
    const formattedProblems = trackedProblems.map(usp => ({
      id: usp._id,
      problem: {
        id: usp.problem._id,
        title: usp.problem.title,
        url: usp.problem.url,
        difficulty: usp.problem.difficulty,
        leetcodeId: usp.problem.leetcodeId
      },
      solvedAt: usp.solvedAt,
      notes: usp.notes,
      isImportant: Boolean(usp.isImportant), // Ensure it's a proper boolean
      lastReviewedAt: usp.lastReviewedAt,
      reviewCount: usp.reviewCount,
      createdAt: usp.createdAt,
      updatedAt: usp.updatedAt,
      hasReminders: (reminderCountMap[usp._id.toString()] || 0) > 0,
      reminderCount: reminderCountMap[usp._id.toString()] || 0
    }));

    res.json({
      problems: formattedProblems,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: trackedProblems.length,
        totalProblems: total
      }
    });

  } catch (error) {
    console.error('Error fetching tracked problems:', error);
    res.status(500).json({
      message: 'Failed to fetch tracked problems',
      error: error.message
    });
  }
};

/**
 * Update user solved problem (notes, isImportant, bookmarks, tags)
 */
const updateTrackedProblem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { problemId } = req.params;
    const { notes, isImportant, isBookmarked, tags } = req.body;

    const userSolvedProblem = await UserSolvedProblem.findOne({
      _id: problemId,
      user: userId
    }).populate('problem');

    if (!userSolvedProblem) {
      return res.status(404).json({ message: 'Tracked problem not found' });
    }

    // Update fields
    if (notes !== undefined) userSolvedProblem.notes = notes;
    if (isImportant !== undefined) userSolvedProblem.isImportant = isImportant;
    if (isBookmarked !== undefined) userSolvedProblem.isBookmarked = isBookmarked;
    if (tags !== undefined) userSolvedProblem.tags = tags;

    await userSolvedProblem.save();

    res.json({
      message: 'Problem updated successfully',
      problem: {
        id: userSolvedProblem._id,
        problem: {
          id: userSolvedProblem.problem._id,
          title: userSolvedProblem.problem.title,
          url: userSolvedProblem.problem.url,
          difficulty: userSolvedProblem.problem.difficulty,
          leetcodeId: userSolvedProblem.problem.leetcodeId
        },
        solvedAt: userSolvedProblem.solvedAt,
        notes: userSolvedProblem.notes,
        isImportant: userSolvedProblem.isImportant,
        isBookmarked: userSolvedProblem.isBookmarked,
        tags: userSolvedProblem.tags,
        lastReviewedAt: userSolvedProblem.lastReviewedAt,
        reviewCount: userSolvedProblem.reviewCount
      }
    });

  } catch (error) {
    console.error('Error updating tracked problem:', error);
    res.status(500).json({
      message: 'Failed to update tracked problem',
      error: error.message
    });
  }
};

/**
 * Delete a tracked problem
 */
const deleteTrackedProblem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { problemId } = req.params;

    const userSolvedProblem = await UserSolvedProblem.findOne({
      _id: problemId,
      user: userId
    });

    if (!userSolvedProblem) {
      return res.status(404).json({ message: 'Tracked problem not found' });
    }

    // Also delete associated reminders
    await Reminder.deleteMany({ userSolvedProblem: problemId });

    await UserSolvedProblem.findByIdAndDelete(problemId);

    res.json({ message: 'Tracked problem deleted successfully' });

  } catch (error) {
    console.error('Error deleting tracked problem:', error);
    res.status(500).json({
      message: 'Failed to delete tracked problem',
      error: error.message
    });
  }
};

/**
 * Get dashboard stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    // First check if user has any tracked problems
    const totalCount = await UserSolvedProblem.countDocuments({ user: new mongoose.Types.ObjectId(userId) });

    const stats = await UserSolvedProblem.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'problems',
          localField: 'problem',
          foreignField: '_id',
          as: 'problemDetails'
        }
      },
      { $unwind: '$problemDetails' },
      {
        $group: {
          _id: null,
          totalProblems: { $sum: 1 },
          easyCount: {
            $sum: { $cond: [{ $eq: ['$problemDetails.difficulty', 'Easy'] }, 1, 0] }
          },
          mediumCount: {
            $sum: { $cond: [{ $eq: ['$problemDetails.difficulty', 'Medium'] }, 1, 0] }
          },
          hardCount: {
            $sum: { $cond: [{ $eq: ['$problemDetails.difficulty', 'Hard'] }, 1, 0] }
          },
          bookmarkedCount: {
            $sum: { $cond: ['$isBookmarked', 1, 0] }
          },
          importantCount: {
            $sum: { $cond: ['$isImportant', 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalProblems: 0,
      easyCount: 0,
      mediumCount: 0,
      hardCount: 0,
      importantCount: 0
    };

    // Get pending reminders count
    const pendingReminders = await Reminder.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
      status: 'pending',
      isActive: true
      // Show all pending reminders, not just overdue ones
    });

    const finalResult = {
      ...result,
      pendingReminders
    };

    res.json(finalResult);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

module.exports = {
  syncRecentProblems,
  getTrackedProblems,
  updateTrackedProblem,
  deleteTrackedProblem,
  getDashboardStats
};