const axios = require("axios");
const { PlatformUsernameError } = require('../../utils/customErrors');

// Add retry constants
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = [502, 503, 504, 525];

const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Fetch recent submissions from LeetCode GraphQL API
 * @param {string} leetcodeUsername - LeetCode username
 * @param {number} limit - Number of recent submissions to fetch (default: 10)
 * @returns {Promise<Array>} Array of recent submission objects
 */
const getRecentSubmissions = async (leetcodeUsername, limit = 20) => {
  const query = `
    query getRecentSubmissions($username: String!, $limit: Int!) {
      recentSubmissionList(username: $username, limit: $limit) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
        url
      }
    }
  `;

  const variables = {
    username: leetcodeUsername,
    limit: limit,
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 15000, // 15 seconds timeout
        }
      );

      // Check for GraphQL errors in the response body
      if (response.data.errors) {
        console.error(`GraphQL error fetching LeetCode submissions for ${leetcodeUsername}:`, response.data.errors);
        const isUserNotFound = response.data.errors.some(err => 
          err.message?.includes("User matching query does not exist") ||
          err.message?.includes("User not found")
        );
        if (isUserNotFound) {
          throw new PlatformUsernameError(
            `LeetCode username "${leetcodeUsername}" not found or invalid.`,
            'leetcode',
            'INVALID_USERNAME'
          );
        }
        throw new Error(`GraphQL error fetching LeetCode submissions for ${leetcodeUsername}.`);
      }

      const apiData = response.data.data;
      
      // Check if recentSubmissionList is null or empty
      if (!apiData || !apiData.recentSubmissionList) {
        console.warn(`No recent submissions found for LeetCode username "${leetcodeUsername}".`);
        return [];
      }

      // Filter only accepted submissions and format the data
      const acceptedSubmissions = apiData.recentSubmissionList
        .filter(submission => submission.statusDisplay === "Accepted")
        .map(submission => ({
          title: submission.title,
          titleSlug: submission.titleSlug,
          timestamp: parseInt(submission.timestamp) * 1000, // Convert to milliseconds
          url: `https://leetcode.com/problems/${submission.titleSlug}/`,
          lang: submission.lang,
          solvedAt: new Date(parseInt(submission.timestamp) * 1000),
        }));

      return acceptedSubmissions;

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

        throw new Error(`Network or server error fetching LeetCode submissions for ${leetcodeUsername}. ${error.message}`);
      }

      console.error(`Unexpected error fetching LeetCode submissions for ${leetcodeUsername}:`, error.message);
      throw error;
    }
  }
};

/**
 * Get problem details from LeetCode GraphQL API
 * @param {string} titleSlug - Problem title slug
 * @returns {Promise<Object>} Problem details object
 */
const getProblemDetails = async (titleSlug) => {
  const query = `
    query getProblemDetails($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        titleSlug
        difficulty
        content
        topicTags {
          name
        }
      }
    }
  `;

  const variables = {
    titleSlug: titleSlug,
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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      }
    );

    if (response.data.errors) {
      console.error(`GraphQL error fetching problem details for ${titleSlug}:`, response.data.errors);
      throw new Error(`Error fetching problem details for ${titleSlug}.`);
    }

    const question = response.data.data?.question;
    if (!question) {
      throw new Error(`Problem not found: ${titleSlug}`);
    }

    return {
      leetcodeId: question.titleSlug,
      title: question.title,
      difficulty: question.difficulty,
      url: `https://leetcode.com/problems/${question.titleSlug}/`,
      questionId: question.questionId,
      topicTags: question.topicTags?.map(tag => tag.name) || [],
    };

  } catch (error) {
    console.error(`Error fetching problem details for ${titleSlug}:`, error.message);
    throw error;
  }
};

module.exports = {
  getRecentSubmissions,
  getProblemDetails,
};