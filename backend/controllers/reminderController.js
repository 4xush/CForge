const Reminder = require('../models/Reminder');
const UserSolvedProblem = require('../models/UserSolvedProblem');

/**
 * Create reminders for a tracked problem
 */
const createReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { problemId } = req.params;
    const { intervals = [1, 3, 7, 14, 30] } = req.body; // Default spaced repetition intervals

    // Verify the problem belongs to the user
    const userSolvedProblem = await UserSolvedProblem.findOne({
      _id: problemId,
      user: userId
    }).populate('problem');

    if (!userSolvedProblem) {
      return res.status(404).json({ message: 'Tracked problem not found' });
    }

    // Delete existing reminders for this problem
    await Reminder.deleteMany({ 
      user: userId, 
      userSolvedProblem: problemId 
    });

    // Create new reminders
    const reminders = [];
    const baseDate = new Date();

    for (const interval of intervals) {
      const reminderDate = new Date(baseDate);
      reminderDate.setDate(reminderDate.getDate() + interval);

      const reminder = new Reminder({
        user: userId,
        userSolvedProblem: problemId,
        reminderDate,
        interval,
        status: 'pending',
        isActive: true
      });

      await reminder.save();
      reminders.push({
        id: reminder._id,
        reminderDate: reminder.reminderDate,
        interval: reminder.interval,
        status: reminder.status
      });
    }

    res.json({
      message: `Created ${reminders.length} reminders for "${userSolvedProblem.problem.title}"`,
      reminders,
      problem: {
        id: userSolvedProblem._id,
        title: userSolvedProblem.problem.title
      }
    });

  } catch (error) {
    console.error('Error creating reminders:', error);
    res.status(500).json({ 
      message: 'Failed to create reminders',
      error: error.message 
    });
  }
};

/**
 * Get user's pending reminders
 */
const getPendingReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    
    // First, let's see ALL reminders for this user
    const allReminders = await Reminder.find({ user: userId });

    const reminders = await Reminder.find({
      user: userId,
      status: 'pending',
      isActive: true
    })
    .populate({
      path: 'userSolvedProblem',
      populate: {
        path: 'problem',
        model: 'Problem'
      }
    })
    .sort({ reminderDate: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Reminder.countDocuments({
      user: userId,
      status: 'pending',
      isActive: true
    });

    const formattedReminders = reminders.map(reminder => ({
      id: reminder._id,
      reminderDate: reminder.reminderDate,
      interval: reminder.interval,
      status: reminder.status,
      problem: {
        id: reminder.userSolvedProblem._id,
        title: reminder.userSolvedProblem.problem.title,
        url: reminder.userSolvedProblem.problem.url,
        difficulty: reminder.userSolvedProblem.problem.difficulty,
        leetcodeId: reminder.userSolvedProblem.problem.leetcodeId,
        solvedAt: reminder.userSolvedProblem.solvedAt,
        importance: reminder.userSolvedProblem.importance
      }
    }));

    res.json({
      reminders: formattedReminders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: reminders.length,
        totalReminders: total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching pending reminders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch pending reminders',
      error: error.message 
    });
  }
};

const getProblemReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { problemId } = req.params;

    // Verify the problem belongs to the user
    const userSolvedProblem = await UserSolvedProblem.findOne({
      _id: problemId,
      user: userId
    });

    if (!userSolvedProblem) {
      return res.status(404).json({ message: 'Tracked problem not found' });
    }

    const reminders = await Reminder.find({
      user: userId,
      userSolvedProblem: problemId
    }).sort({ reminderDate: 1 });

    const formattedReminders = reminders.map(reminder => ({
      id: reminder._id,
      reminderDate: reminder.reminderDate,
      interval: reminder.interval,
      status: reminder.status,
      isActive: reminder.isActive,
      completedAt: reminder.completedAt,
      createdAt: reminder.createdAt
    }));

    res.json({
      reminders: formattedReminders,
      problemId: problemId
    });

  } catch (error) {
    console.error('Error fetching problem reminders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch problem reminders',
      error: error.message 
    });
  }
};

/**
 * Mark reminder as completed
 */
const completeReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reminderId } = req.params;

    const reminder = await Reminder.findOne({
      _id: reminderId,
      user: userId
    }).populate({
      path: 'userSolvedProblem',
      populate: {
        path: 'problem',
        model: 'Problem'
      }
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Update reminder status
    reminder.status = 'completed';
    reminder.completedAt = new Date();
    await reminder.save();

    // Update the UserSolvedProblem review tracking
    const userSolvedProblem = reminder.userSolvedProblem;
    userSolvedProblem.lastReviewedAt = new Date();
    userSolvedProblem.reviewCount += 1;
    await userSolvedProblem.save();

    res.json({
      message: 'Reminder marked as completed',
      reminder: {
        id: reminder._id,
        status: reminder.status,
        completedAt: reminder.completedAt
      },
      problem: {
        title: userSolvedProblem.problem.title,
        reviewCount: userSolvedProblem.reviewCount
      }
    });

  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({ 
      message: 'Failed to complete reminder',
      error: error.message 
    });
  }
};

/**
 * Skip/snooze a reminder
 */
const skipReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reminderId } = req.params;
    const { snoozeHours = 24 } = req.body; // Default snooze for 24 hours

    const reminder = await Reminder.findOne({
      _id: reminderId,
      user: userId
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Update reminder date to snooze
    const newReminderDate = new Date();
    newReminderDate.setHours(newReminderDate.getHours() + snoozeHours);
    
    reminder.reminderDate = newReminderDate;
    reminder.status = 'pending'; // Keep as pending
    await reminder.save();

    res.json({
      message: `Reminder snoozed for ${snoozeHours} hours`,
      reminder: {
        id: reminder._id,
        reminderDate: reminder.reminderDate,
        status: reminder.status
      }
    });

  } catch (error) {
    console.error('Error skipping reminder:', error);
    res.status(500).json({ 
      message: 'Failed to skip reminder',
      error: error.message 
    });
  }
};

/**
 * Delete reminders for a problem
 */
const deleteReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { problemId } = req.params;

    // Verify the problem belongs to the user
    const userSolvedProblem = await UserSolvedProblem.findOne({
      _id: problemId,
      user: userId
    });

    if (!userSolvedProblem) {
      return res.status(404).json({ message: 'Tracked problem not found' });
    }

    const deleteResult = await Reminder.deleteMany({
      user: userId,
      userSolvedProblem: problemId
    });

    res.json({
      message: `Deleted ${deleteResult.deletedCount} reminders`,
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    console.error('Error deleting reminders:', error);
    res.status(500).json({ 
      message: 'Failed to delete reminders',
      error: error.message 
    });
  }
};

module.exports = {
  createReminders,
  getPendingReminders,
  getProblemReminders,
  completeReminder,
  skipReminder,
  deleteReminders
};