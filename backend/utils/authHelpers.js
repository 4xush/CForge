const axios = require("axios");

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (minimum 8 characters)
const validatePassword = (password) => {
  return password && password.length >= 8;
};

// Full name validation (between 2 and 50 characters)
const validatefullName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

// Check if LeetCode username exists
const checkLeetCodeUsername = async (username) => {
  if (!username || typeof username !== 'string') {
    throw new Error("Invalid LeetCode username format");
  }

  const query = `
    {
      matchedUser(username: "${username}") {
        username
      }
    }
  `;

  try {
    const response = await axios.post("https://leetcode.com/graphql", { query }, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data.data.matchedUser !== null;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error("LeetCode API rate limit exceeded. Please try again later.");
    }
    throw new Error("Error verifying LeetCode username. Please check the username and try again.");
  }
};

// Generate avatar URL based on gender and username
const generateAvatarUrl = (gender, username) => {
  const normalizedGender = gender.toLowerCase();
  return `https://avatar.iran.liara.run/public/${normalizedGender === "male" ? "boy" : "girl"}?username=${username}`;
};

module.exports = {
  validateEmail,
  validatePassword,
  validatefullName,
  checkLeetCodeUsername,
  generateAvatarUrl
};
