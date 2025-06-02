const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const User = require('../models/User');
const {
  getActiveUsersLast7Days,
  getActiveUsersCount,
  getActiveUsersLastNDays
} = require('../utils/activeUsers');

async function testActiveUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cforge');
    console.log('Connected to MongoDB');

    const baseURL = `http://localhost:${process.env.PORT || 5000}`;
    const secretKey = process.env.OWNER_SECRET_KEY;

    if (!secretKey) {
      console.error('OWNER_SECRET_KEY not found in environment variables');
      return;
    }

    // Test 1: Direct function call - Get active users in last 7 days
    console.log('\n=== Test 1: Direct function - Active users in last 7 days ===');
    const activeUsers7Days = await getActiveUsersLast7Days();
    console.log(`Found ${activeUsers7Days.length} active users in last 7 days`);
    activeUsers7Days.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Last active: ${user.lastActiveAt}`);
    });

    // Test 2: Direct function call - Get count of active users
    console.log('\n=== Test 2: Direct function - Count of active users ===');
    const activeCount = await getActiveUsersCount();
    console.log(`Active users count: ${activeCount}`);

    // Test 3: Update a user's lastActiveAt for testing
    console.log('\n=== Test 3: Update test user activity ===');
    const testUser = await User.findOne();
    if (testUser) {
      const oldLastActive = testUser.lastActiveAt;
      testUser.lastActiveAt = new Date();
      await testUser.save();
      console.log(`Updated ${testUser.username}'s lastActiveAt from ${oldLastActive} to ${testUser.lastActiveAt}`);
    } else {
      console.log('No users found in database');
    }

    // Test 4: API endpoint test - Get active users with secret key (header)
    console.log('\n=== Test 4: API endpoint with header - Active users ===');
    try {
      const response = await axios.get(`${baseURL}/api/users/active`, {
        headers: {
          'x-secret-key': secretKey
        }
      });
      console.log(`API Response: Found ${response.data.count} active users`);
      console.log('First few users:', response.data.users.slice(0, 3));
    } catch (error) {
      console.error('API test failed:', error.response?.data || error.message);
    }

    // Test 5: API endpoint test - Get active users count with secret key (query param)
    console.log('\n=== Test 5: API endpoint with query param - Active users count ===');
    try {
      const response = await axios.get(`${baseURL}/api/users/active/count?secretKey=${secretKey}`);
      console.log(`API Response: Active users count: ${response.data.count}`);
    } catch (error) {
      console.error('API count test failed:', error.response?.data || error.message);
    }

    // Test 6: API endpoint test - Invalid secret key
    console.log('\n=== Test 6: API endpoint with invalid secret key ===');
    try {
      const response = await axios.get(`${baseURL}/api/users/active`, {
        headers: {
          'x-secret-key': 'invalid_key'
        }
      });
      console.log('This should not succeed');
    } catch (error) {
      console.log('Expected error:', error.response?.data?.message || error.message);
    }

    // Test 7: API endpoint test - No secret key
    console.log('\n=== Test 7: API endpoint with no secret key ===');
    try {
      const response = await axios.get(`${baseURL}/api/users/active`);
      console.log('This should not succeed');
    } catch (error) {
      console.log('Expected error:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
testActiveUsers();