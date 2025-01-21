import React, { useState } from 'react';
import { Github, Terminal, Code2 } from 'lucide-react';
import ApiService from '../services/ApiService';
import { toast } from 'react-hot-toast';

const AddPlatform = ({ onPlatformsUpdate, platforms }) => {
  const [formData, setFormData] = useState({
    leetcodeUsername: platforms?.leetcode?.username || '',
    githubUsername: platforms?.github?.username || '',
    codeforcesUsername: platforms?.codeforces?.username || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only include platforms that have values
    const platformData = {};
    if (formData.leetcodeUsername) platformData.leetcodeUsername = formData.leetcodeUsername;
    if (formData.githubUsername) platformData.githubUsername = formData.githubUsername;
    if (formData.codeforcesUsername) platformData.codeforcesUsername = formData.codeforcesUsername;

    try {
      const response = await ApiService.post('/users/setup-platforms', platformData);
      toast.success('Platforms updated successfully');
      if (onPlatformsUpdate) {
        onPlatformsUpdate(response.data.user.platforms);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update platforms');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6 bg-gray-800/50 p-6 rounded-xl">
      <h3 className="text-lg font-medium text-white">Platform Integration</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {/* LeetCode Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Terminal className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="leetcodeUsername"
              value={formData.leetcodeUsername}
              onChange={handleChange}
              placeholder="LeetCode Username"
              className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
            />
          </div>

          {/* GitHub Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Github className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="githubUsername"
              value={formData.githubUsername}
              onChange={handleChange}
              placeholder="GitHub Username"
              className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
            />
          </div>

          {/* Codeforces Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Code2 className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="codeforcesUsername"
              value={formData.codeforcesUsername}
              onChange={handleChange}
              placeholder="Codeforces Username"
              className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Update Platforms
        </button>
      </form>
    </div>
  );
};

export default AddPlatform;