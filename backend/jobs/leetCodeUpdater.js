const { getLeetCodeStats } = require("../services/leetcodeService");
const User = require("../models/User");

exports.updateLeetCodeStats = async (req, res) => {
  const { leetcodeUsername } = req.user;
  try {
    const apiResponse = await getLeetCodeStats(leetcodeUsername);

    // Extract relevant data from apiResponse
    const submitStats = apiResponse.submitStats.acSubmissionNum;

    // Process `submitStats` to fit the schema
    const questionsSolvedByDifficulty = {
      easy: submitStats.find((stat) => stat.difficulty === "Easy")?.count || 0,
      medium:
        submitStats.find((stat) => stat.difficulty === "Medium")?.count || 0,
      hard: submitStats.find((stat) => stat.difficulty === "Hard")?.count || 0,
    };

    const statsToUpdate = {
      "platforms.leetcode.totalQuestionsSolved":
        submitStats.find((stat) => stat.difficulty === "All")?.count || 555,
      "platforms.leetcode.questionsSolvedByDifficulty":
        questionsSolvedByDifficulty,
      "platforms.leetcode.attendedContestsCount":
        apiResponse.attendedContestsCount,
      "platforms.leetcode.globalRanking": apiResponse.globalRanking,
    };

    const updatedUser = await User.findOneAndUpdate(
      { leetcodeUsername },
      { $set: statsToUpdate },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "LeetCode stats updated successfully",
      stats: updatedUser,
    });
  } catch (error) {
    console.error("Error updating LeetCode stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
