const axios = require("axios");

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

  try {
    console.log(
      "Sending request to LeetCode API with username:",
      leetcodeUsername
    );
    const response = await axios.post(
      "https://leetcode.com/graphql",
      {
        query,
        variables,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "axios/1.7.4",
        },
      }
    );

    console.log(
      "Received response from LeetCode API"
    );

    const { matchedUser, userContestRanking } = response.data.data;

    // Process the submission stats
    const questionsSolvedByDifficulty =
      matchedUser.submitStats.acSubmissionNum.reduce(
        (acc, { difficulty, count }) => {
          acc[difficulty.toLowerCase()] = count;
          return acc;
        },
        { easy: 0, medium: 0, hard: 0 }
      );

    // Calculate total questions solved
    const totalQuestionsSolved =
      questionsSolvedByDifficulty.easy +
      questionsSolvedByDifficulty.medium +
      questionsSolvedByDifficulty.hard;

    // Handle null userContestRanking
    const attendedContestsCount =
      userContestRanking?.attendedContestsCount || 0;
    const contestRating = userContestRanking?.rating || 0;

    return {
      leetcodeUsername,
      totalQuestionsSolved,
      questionsSolvedByDifficulty,
      attendedContestsCount,
      contestRating,
    };
  } catch (error) {
    console.error(
      "Error fetching LeetCode stats:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

module.exports = {
  getLeetCodeStats,
};
