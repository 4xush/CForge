import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Key, Trash2, CircleUser, AlertTriangle } from 'lucide-react';
import ApiService from '../services/ApiService';
import SettingField from '../components/SettingField';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

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
      await ApiService.delete('/users/profile');
      toast.success('Account deleted successfully');
      navigate('/signup');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const DeleteConfirmDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md bg-gray-900 rounded-xl p-6 shadow-2xl">
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
      </div>
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
    return <div className="text-white text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>

        {/* Profile Summary */}
        <div className="mb-6 flex items-center gap-4">
          <img
            src={profileData?.profilePicture || '/default-avatar.png'}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500"
          />
          <div>
            <h3 className="text-lg font-medium">{profileData?.fullName}</h3>
            <p className="text-gray-400">@{profileData?.username}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-6">
          {['basic', 'account'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors
                ${activeTab === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
            >
              {tab === 'basic' ? 'Basic Info' : 'Account'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'basic' ? (
            <>
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
            </>
          ) : (
            <>
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
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && <DeleteConfirmDialog />}
    </div>
  );
};

export default Settings;

