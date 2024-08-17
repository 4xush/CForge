// This file will contain the logic to interact with the LeetCode API using axios. It will include a function that takes a user's LeetCode username, queries the LeetCode GraphQL API, and returns their statistics.

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
      contestBadge {
        name
      }
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
    return response.data.data.matchedUser;
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

// GraphQL Query: We define a query that retrieves the user's submission statistics (submitStatsGlobal) and their contest participation data (contestRanking).
// Axios POST Request: We make a POST request to the LeetCode GraphQL API endpoint with this query to retrieve the data.
// Data Processing: The data returned is processed to calculate the total number of questions solved, contests attended, and a breakdown of questions solved by difficulty.
