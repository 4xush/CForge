import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext.jsx';

const API_URL = "http://localhost:5000/api";

const SettingsOverlay = ({ isOpen, onClose, triggerRef }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { user, setUser } = useAuthContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    leetcodeUsername: user?.platforms?.leetcode?.username || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    profilePicture: user?.profilePicture || '',
  });

  useEffect(() => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.top, left: rect.left });
    }
  }, [isOpen, triggerRef]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateProfile = async (type, data) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/settings/${type}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      setUser(result.data.user);
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    switch (activeTab) {
      case 'profile':
        await updateProfile('username', { username: formData.username });
        await updateProfile('email', { email: formData.email });
        break;
      case 'security':
        if (formData.newPassword !== formData.confirmPassword) {
          return toast.error('Passwords do not match');
        }
        await updateProfile('password', {
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        });
        break;
      case 'integrations':
        await updateProfile('leetcode', { leetcodeUsername: formData.leetcodeUsername });
        break;
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_URL}/users/profile`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          localStorage.removeItem('token');
          setUser(null);
          navigate('/');
          toast.success('Account deleted successfully');
          onClose();
        }
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, clipPath: `circle(0% at ${position.left}px ${position.top}px)` }}
      animate={{
        opacity: isOpen ? 1 : 0,
        clipPath: isOpen
          ? `circle(150% at ${position.left}px ${position.top}px)`
          : `circle(0% at ${position.left}px ${position.top}px)`,
      }}
      transition={{ type: "spring", stiffness: 20, damping: 3 }}
      className={`fixed inset-0 bg-[#101723] bg-opacity-95 z-50 ${isOpen ? '' : 'pointer-events-none'} overflow-y-auto`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-[#1C2333] rounded-lg shadow-lg">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="border-b border-gray-700">
            <nav className="flex">
              {['profile', 'security', 'integrations'].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 text-sm font-medium ${activeTab === tab
                    ? 'border-b-2 border-purple-500 text-purple-500'
                    : 'text-gray-400 hover:text-white'
                    }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {activeTab === 'profile' && (
              <>
                <Input
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  minLength={3}
                  required
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Profile Picture URL"
                  name="profilePicture"
                  type="url"
                  value={formData.profilePicture}
                  onChange={handleInputChange}
                />
              </>
            )}

            {activeTab === 'security' && (
              <>
                <Input
                  label="Current Password"
                  name="oldPassword"
                  type="password"
                  value={formData.oldPassword}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  minLength={8}
                  required
                />
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  minLength={8}
                  required
                />
              </>
            )}

            {activeTab === 'integrations' && (
              <Input
                label="LeetCode Username"
                name="leetcodeUsername"
                value={formData.leetcodeUsername}
                onChange={handleInputChange}
                required
              />
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>

            {activeTab === 'security' && (
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Account
              </button>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      className="w-full px-3 py-2 bg-[#2A3447] text-white rounded-md border border-gray-600 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
      {...props}
    />
  </div>
);

export default SettingsOverlay;