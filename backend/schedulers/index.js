const cron = require('node-cron');
const { validateUsernames } = require('../jobs/platformUsernameValidator');

// Schedule username validation to run daily at 3:00 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Running scheduled platform username validation');
  try {
    await validateUsernames();
  } catch (error) {
    console.error('Error running scheduled username validation:', error);
  }
});

module.exports = { initSchedulers: () => console.log('Schedulers initialized') }; 