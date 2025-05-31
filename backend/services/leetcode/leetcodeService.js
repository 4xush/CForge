const axios = require("axios");
const { PlatformUsernameError } = require('../../utils/customErrors');

// Add retry constants
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = [502, 503, 504, 525]; // Added 525 for SSL handshake failures

const delay = ms => new Promise(res => setTimeout(res, ms));

const getLeetCodeStats = async (leetcodeUsername) => {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
      }
    }
  `;

  const variables = {
    username: leetcodeUsername,
  };

  // Retry mechanism for transient errors
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        "https://leetcode.com/graphql",
        {
          query,
          variables,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", // More browser-like UA
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      // Check for GraphQL errors in the response body
      if (response.data.errors) {
        console.error(`GraphQL error fetching LeetCode stats for ${leetcodeUsername}:`, response.data.errors);
        // Check if the error indicates user not found (may require inspecting specific error messages/codes)
        const isUserNotFound = response.data.errors.some(err => err.message?.includes("User matching query does not exist"));
        if (isUserNotFound) {
          throw new PlatformUsernameError(
            `LeetCode username "${leetcodeUsername}" not found or invalid.`,
            'leetcode',
            'INVALID_USERNAME'
          );
        }
        // Otherwise, throw a generic GraphQL error
        throw new Error(`GraphQL error fetching LeetCode data for ${leetcodeUsername}.`);
      }

      const apiData = response.data.data;

      // Check if matchedUser is null, indicating user not found
      if (!apiData || !apiData.matchedUser) {
        console.warn(`LeetCode username "${leetcodeUsername}" not found (matchedUser is null).`);
        throw new PlatformUsernameError(
          `LeetCode username "${leetcodeUsername}" not found or invalid.`,
          'leetcode',
          'INVALID_USERNAME'
        );
      }


      // Add null checks for API response data
      const matchedUser = apiData.matchedUser;
      const userContestRanking = apiData.userContestRanking;

      let questionsSolvedByDifficulty = { easy: 0, medium: 0, hard: 0 };
      let totalQuestionsSolved = 0;
      let attendedContestsCount = 0;
      let contestRating = 0;

      if (matchedUser.submitStats && matchedUser.submitStats.acSubmissionNum) {
        questionsSolvedByDifficulty =
          matchedUser.submitStats.acSubmissionNum.reduce(
            (acc, { difficulty, count }) => {
              acc[difficulty.toLowerCase()] = count;
              return acc;
            },
            { easy: 0, medium: 0, hard: 0 }
          );

        totalQuestionsSolved =
          questionsSolvedByDifficulty.easy +
          questionsSolvedByDifficulty.medium +
          questionsSolvedByDifficulty.hard;
      }

      if (userContestRanking) {
        attendedContestsCount = userContestRanking.attendedContestsCount || 0;
        contestRating = Math.floor(userContestRanking.rating || 0);
      }

      return {
        leetcodeUsername,
        totalQuestionsSolved,
        questionsSolvedByDifficulty,
        attendedContestsCount,
        contestRating,
      };
    } catch (error) {
      if (error instanceof PlatformUsernameError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const statusCode = error?.response?.status;
        const isRetryable = RETRYABLE_STATUS_CODES.includes(statusCode);

        console.error(
          `Attempt ${attempt}: LeetCode API error for ${leetcodeUsername}:`,
          statusCode ? `Status ${statusCode}` : error.message
        );

        if (isRetryable && attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY_MS * attempt}ms...`);
          await delay(RETRY_DELAY_MS * attempt);
          continue;
        }

        if (statusCode === 525) {
          throw new Error(`LeetCode SSL connection error. Please try again later.`);
        }

        throw new Error(`Network or server error fetching LeetCode data for ${leetcodeUsername}. ${error.message}`);
      }

      console.error(`Unexpected error fetching LeetCode stats for ${leetcodeUsername}:`, error.message);
      throw error;
    }
  }
};

module.exports = {
  getLeetCodeStats,
};