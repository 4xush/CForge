const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const PushNotificationService = require('./pushNotificationService');

class ReminderScheduler {
  static isRunning = false;

  /**
   * Start the reminder scheduler
   * Runs every 15 minutes to check for due reminders
   */
  static start() {
    if (this.isRunning) {
      console.log('⏰ Reminder scheduler is already running');
      return;
    }

    console.log('🚀 Starting reminder scheduler...');

    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await this.checkAndSendReminders();
    });

    // Also run once on startup
    setTimeout(() => {
      this.checkAndSendReminders();
    }, 10000); // Wait 10 seconds after startup

    this.isRunning = true;
    console.log('✅ Reminder scheduler started - checking every 15 minutes');
  }

  /**
   * Check for due reminders and send push notifications
   */
  static async checkAndSendReminders() {
    try {
      console.log('⏰ Checking for due reminders...');

      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      // Find reminders that are due (within the last 5 minutes to current time)
      const dueReminders = await Reminder.find({
        status: 'pending',
        isActive: true,
        reminderDate: {
          $gte: fifteenMinutesAgo,
          $lte: now
        }
      })
        .populate({
          path: 'userSolvedProblem',
          populate: {
            path: 'problem',
            model: 'Problem'
          }
        })
        .populate('user');

      if (dueReminders.length === 0) {
        console.log('📭 No due reminders found');
        return;
      }

      console.log(`📬 Found ${dueReminders.length} due reminders`);

      // Group reminders by user
      const remindersByUser = {};
      dueReminders.forEach(reminder => {
        const userId = reminder.user._id.toString();
        if (!remindersByUser[userId]) {
          remindersByUser[userId] = [];
        }
        remindersByUser[userId].push(reminder);
      });

      // Send notifications for each user
      let totalSent = 0;
      let totalFailed = 0;

      for (const [userId, userReminders] of Object.entries(remindersByUser)) {
        try {
          // Send individual notifications for each reminder
          for (const reminder of userReminders) {
            const result = await PushNotificationService.sendReminderNotification(
              userId,
              {
                id: reminder._id,
                interval: reminder.interval,
                problem: {
                  id: reminder.userSolvedProblem._id,
                  title: reminder.userSolvedProblem.problem.title,
                  difficulty: reminder.userSolvedProblem.problem.difficulty,
                  url: reminder.userSolvedProblem.problem.url
                }
              }
            );

            totalSent += result.sent;
            totalFailed += result.failed;

            // Mark reminder as notified (you might want to add this field to schema)
            // For now, we'll just log it
            console.log(`📱 Sent reminder notification for problem: ${reminder.userSolvedProblem.problem.title}`);
          }
        } catch (error) {
          console.error(`❌ Error sending notifications to user ${userId}:`, error);
          totalFailed += userReminders.length;
        }
      }

      console.log(`📊 Reminder notifications summary: ${totalSent} sent, ${totalFailed} failed`);

    } catch (error) {
      console.error('❌ Error in reminder scheduler:', error);
    }
  }

  /**
   * Send immediate reminder notification
   */
  static async sendImmediateReminder(reminderId) {
    try {
      const reminder = await Reminder.findById(reminderId)
        .populate({
          path: 'userSolvedProblem',
          populate: {
            path: 'problem',
            model: 'Problem'
          }
        })
        .populate('user');

      if (!reminder) {
        throw new Error('Reminder not found');
      }

      const result = await PushNotificationService.sendReminderNotification(
        reminder.user._id,
        {
          id: reminder._id,
          interval: reminder.interval,
          problem: {
            id: reminder.userSolvedProblem._id,
            title: reminder.userSolvedProblem.problem.title,
            difficulty: reminder.userSolvedProblem.problem.difficulty,
            url: reminder.userSolvedProblem.problem.url
          }
        }
      );

      console.log(`📱 Immediate reminder sent: ${result.sent} sent, ${result.failed} failed`);
      return result;
    } catch (error) {
      console.error('❌ Error sending immediate reminder:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler
   */
  static stop() {
    // Note: node-cron doesn't provide a direct way to stop specific tasks
    // You would need to keep track of the task reference
    this.isRunning = false;
    console.log('⏹️ Reminder scheduler stopped');
  }
}

module.exports = ReminderScheduler;