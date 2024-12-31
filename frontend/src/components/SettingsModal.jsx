import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Key, Trash2, CircleUser, X, ChevronLeft, AlertTriangle } from 'lucide-react';
import ApiService from '../services/api';
import SettingField from './SettingField';

const SettingsModal = ({ isOpen, onClose, triggerRef }) => {
  const navigate = useNavigate();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeTab, setActiveTab] = useState('basic');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.top, left: rect.left });
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (isOpen) {
      fetchProfileData();
    }
  }, [isOpen]);

  const fetchProfileData = async () => {
    try {
      const response = await ApiService.get('users/profile');
      setProfileData(response.data);
    } catch (error) {
      toast.error('Failed to load profile data');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (field, value) => {
    try {
      await ApiService.put(`/users/update/${field}`, { [field]: value });
      await fetchProfileData();
      toast.success(`${field} updated successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to update ${field}`);
      console.error(`Error updating ${field}:`, error);
    }
  };

  const handlePasswordChange = async (passwordData) => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      await ApiService.put('/users/update/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await ApiService.delete('/users/profile'); //delete-profile
      toast.success('Account deleted successfully');
      onClose();
      navigate('/signup');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const DeleteConfirmDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-gray-900 rounded-xl p-6 shadow-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle size={24} />
            <h3 className="text-xl font-semibold">Delete Account</h3>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete:
          </p>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              Your profile and personal information
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              All your saved preferences and settings
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              Your entire activity history
            </li>
          </ul>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDeleteAccount}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Yes, Delete My Account
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const PasswordChangeForm = () => {
    const [localPasswordData, setLocalPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setLocalPasswordData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      handlePasswordChange(localPasswordData);
    };

    return (
      <form onSubmit={handleSubmit}>
        <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <input
            type="password"
            name="currentPassword"
            value={localPasswordData.currentPassword}
            onChange={handleInputChange}
            placeholder="Current Password"
            className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20"
          />
          <input
            type="password"
            name="newPassword"
            value={localPasswordData.newPassword}
            onChange={handleInputChange}
            placeholder="New Password"
            className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20"
          />
          <input
            type="password"
            name="confirmPassword"
            value={localPasswordData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm New Password"
            className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Update Password
          </button>
          <button
            type="button"
            onClick={() => setShowPasswordForm(false)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, clipPath: `circle(0% at ${position.left}px ${position.top}px)` }}
        animate={{
          opacity: isOpen ? 1 : 0,
          clipPath: isOpen
            ? `circle(150% at ${position.left}px ${position.top}px)`
            : `circle(0% at ${position.left}px ${position.top}px)`,
        }}
        transition={{ type: "spring", stiffness: 20, damping: 5 }}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 ${isOpen ? '' : 'pointer-events-none'} overflow-y-auto`}
      >
        {/* Modal Container */}
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="text-gray-400" />
                  </button>
                  <h2 className="text-xl font-semibold text-white">Settings</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="text-gray-400" />
                </button>
              </div>

              {/* Profile Summary */}
              <div className="mt-6 flex items-center gap-4">
                <img
                  src={profileData?.profilePicture || '/default-avatar.png'}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500"
                />
                <div>
                  <h3 className="text-lg font-medium text-white">{profileData?.fullName}</h3>
                  <p className="text-gray-400">@{profileData?.username}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex px-6 pt-4">
              {['basic', 'account'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium transition-colors relative
                    ${activeTab === tab ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
                >
                  {tab === 'basic' ? 'Basic Info' : 'Account'}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'basic' ? (
                <div className="space-y-6">
                  <SettingField
                    icon={<User />}
                    label="Name"
                    value={profileData?.fullName}
                    onEdit={value => handleEdit('fullName', value)}
                  />
                  <SettingField
                    icon={<CircleUser />}
                    label="Username"
                    value={profileData?.username}
                    onEdit={value => handleEdit('username', value)}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <SettingField
                    icon={<User />}
                    label="LeetCode ID"
                    value={profileData?.platforms?.leetcode?.username}
                    onEdit={value => handleEdit('leetcodeUsername', value)}
                  />
                  <SettingField
                    icon={<Mail />}
                    label="Email"
                    value={profileData?.email}
                    onEdit={value => handleEdit('email', value)}
                  />
                  <div className="pt-4 border-t border-gray-700 space-y-4">
                    {!showPasswordForm ? (
                      <button
                        className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                        onClick={() => setShowPasswordForm(true)}
                      >
                        <div className="flex items-center gap-2 text-gray-300">
                          <Key size={18} />
                          <span>Change Password</span>
                        </div>
                        <ChevronLeft className="rotate-180 text-gray-400" />
                      </button>
                    ) : (
                      <PasswordChangeForm />
                    )}

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center justify-between p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 size={18} />
                        <span>Delete Account</span>
                      </div>
                      <ChevronLeft className="rotate-180" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && <DeleteConfirmDialog />}
    </>
  );
};

export default SettingsModal;

