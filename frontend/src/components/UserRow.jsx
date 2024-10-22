import React from 'react';

const UserRow = ({ user, index, page, limit }) => (
  <tr className="border-b border-gray-700">
    <td className="p-2">{(page - 1) * limit + index + 1}</td>
    <td className="p-2 flex items-center">
      <div className="w-6 h-6 bg-gray-600 rounded-full mr-2"></div>
      {user.fullName}
    </td>
    <td className="p-2">{user.platforms.leetcode.totalQuestionsSolved}</td>
    <td className="p-2">{user.platforms.leetcode.questionsSolvedByDifficulty.easy}</td>
    <td className="p-2">{user.platforms.leetcode.questionsSolvedByDifficulty.medium}</td>
    <td className="p-2">{user.platforms.leetcode.questionsSolvedByDifficulty.hard}</td>
    <td className="p-2">{user.platforms.leetcode.attendedContestsCount}</td>
    <td className="p-2">{user.platforms.leetcode.contestRating}</td>
  </tr>
);

export default UserRow;