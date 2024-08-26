const axios = require("axios");

const getLeetCodeStats = async (leetcodeUsername) => {
  // Updated GraphQL query to include contest data (attendedContestsCount and globalRanking)
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
      globalRanking
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

    console.log("Received response from LeetCode API:", response.data);

    // Extract matchedUser and userContestRanking from the response
    const { matchedUser, userContestRanking } = response.data.data;

    // Return both user submission stats and contest stats
    return {
      submitStats: matchedUser.submitStats,
      attendedContestsCount: userContestRanking.attendedContestsCount,
      globalRanking: userContestRanking.globalRanking,
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