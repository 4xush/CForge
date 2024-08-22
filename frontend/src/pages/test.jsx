import React, { useState } from 'react';
import { AlertCircle, Plus, Users, LogOut } from 'lucide-react';
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
      console.log('Success:', data);
    } catch (error) {
      setError(error.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col p-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-purple-500">CForge</h1>
          <LogOut className="text-purple-500 h-6 w-6" />
        </div>
        <p className="text-gray-400 mt-2">Empowering Coders, Connecting Minds, Ranking Excellence</p>
      </header>

      <main className="flex-grow flex">
        {/* Left section */}
        <div className="w-1/2 pr-8">
        {/* SVG Graphics */}
            <div className="flex justify-between">
              <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
            </div>
        </div>

        {/* Right section - Sign up form */}
        <div className="w-1/2">
          <div className="bg-gray-800 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Log in' : 'Sign Up'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300">Name</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              {!isLogin && (
                <div>
                  <label htmlFor="leetcodeUsername" className="block text-sm font-medium text-gray-300">LeetCode Username</label>
                  <input
                    type="text"
                    id="leetcodeUsername"
                    name="leetcodeUsername"
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    required
                    value={formData.leetcodeUsername}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              {error && <CustomAlert message={error} />}
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {isLogin ? 'Log in' : 'Sign up with email'}
              </button>
            </form>
            <div className="mt-4">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Log in'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PixelatedAuth;