import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { login, register } from '../api'; // Adjust the path if needed

const CustomAlert = ({ message }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <div className="flex">
      <AlertCircle className="h-5 w-5 mr-2" />
      <span>{message}</span>
    </div>
  </div>
);

const PixelatedAuth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    leetcodeUsername: '',
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData);
      // Handle successful login/registration (e.g., store token, redirect)
      console.log('Success:', data);
    } catch (error) {
      setError(error.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-gray-900">
      {/* Left Section - Company Name and Tagline */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center " style={{ fontFamily: "'Press Start 2P', cursive" }}>
          Cforge
        </h1>
        <p className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 italic">
          Empowering Coders, Connecting Minds, Ranking Excellence
        </p>
      </div>

      {/* Right Section - Login/Signup Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              {isLogin ? 'Login' : 'Sign Up'}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              {!isLogin && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300">Name</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder=""
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder=""
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder=""
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              {!isLogin && (
                <div>
                  <label htmlFor="leetcode-username" className="block text-sm font-medium text-gray-300">
                    LeetCode Username
                  </label>
                  <input
                    id="leetcode-username"
                    name="leetcodeUsername"
                    type="text"
                    required
                    className="appearance-none rounded-md bg-gray-700 relative block w-full px-3 py-1 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder=""
                    value={formData.leetcodeUsername}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>

            {error && <CustomAlert message={error} />}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </form>
          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-purple-400 hover:text-purple-500"
            >
              {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PixelatedAuth;