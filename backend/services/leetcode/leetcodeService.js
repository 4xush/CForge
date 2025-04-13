const axios = require("axios");
const { PlatformUsernameError } = require('../../utils/customErrors'); // Assuming custom error defined here

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
    const response = await axios.post(
      "https://leetcode.com/graphql",
      {
        query,
        variables,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "cforge-backend", // Use a specific user agent if possible
          // LeetCode might block default Axios user agents sometimes
        },
        // Add timeout
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
     // Re-throw our custom error if it's already the right type
     if (error instanceof PlatformUsernameError) {
        throw error;
     }

     // Handle Axios network/timeout errors etc.
     if (axios.isAxiosError(error)) {
         console.error(
            `Axios error fetching LeetCode stats for ${leetcodeUsername}:`,
             error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message
         );
         throw new Error(`Network or server error fetching LeetCode data for ${leetcodeUsername}. ${error.message}`);
     } else {
         // Handle other errors (like GraphQL errors already thrown, or unexpected ones)
         console.error(`Unexpected error fetching LeetCode stats for ${leetcodeUsername}:`, error.message);
         throw error; // Re-throw
     }
  }
};

module.exports = {
  getLeetCodeStats,
};