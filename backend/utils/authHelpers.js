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


// Function to check GitHub username
const checkGitHubUsername = async (username) => {
  if (!username || typeof username !== "string") {
    throw new Error("Invalid GitHub username format");
  }

  try {
    const response = await axios.get(
      `https://api.github.com/users/${username}`,
      {
        timeout: 5000,
        headers: { "User-Agent": "axios/1.7.4" },
      }
    );

    return response.status === 200;
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }
    console.error("GitHub API error:", error.message || error);
    throw new Error(
      "Unable to verify GitHub username. Please check your connection or try again later."
    );
  }
};

// Function to check Codeforces username
const checkCodeforcesUsername = async (username) => {
  if (!username || typeof username !== "string") {
    throw new Error("Invalid Codeforces username format");
  }

  try {
    const response = await axios.get(
      `https://codeforces.com/api/user.info?handles=${username}`,
      {
        timeout: 5000,
      }
    );

    return response.data.status === "OK";
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }
    console.error("Codeforces API error:", error.message || error);
    throw new Error(
      "Unable to verify Codeforces username. Please check your connection or try again later."
    );
  }
};

module.exports = {
  validateEmail,
  validatePassword,
  validateFullName,
  checkLeetCodeUsername,
  checkGitHubUsername,
  checkCodeforcesUsername,
};
