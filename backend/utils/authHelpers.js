const axios = require("axios");

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return (
    password &&
    password.length >= 8);
};

const validateFullName = (name) => {
  const trimmedName = name?.trim();
  return trimmedName && trimmedName.length >= 2 && trimmedName.length <= 50;
};

const checkLeetCodeUsername = async (username) => {
  if (!username || typeof username !== "string") {
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
    const response = await axios.post(
      "https://leetcode.com/graphql",
      { query },
      {
        timeout: 5000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return response.data.data.matchedUser !== null;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error(
        "LeetCode API rate limit exceeded. Please try again later."
      );
    }
    console.error("LeetCode API error:", error.message || error);
    throw new Error(
      "Unable to verify LeetCode username. Please check your connection or try again later."
    );
  }
};

module.exports = {
  validateEmail,
  validatePassword,
  validateFullName,
  checkLeetCodeUsername,
};
