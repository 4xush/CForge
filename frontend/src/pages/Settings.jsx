import React from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-gray-800 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <section className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
            {/* Add your settings form here */}
          </section>

          {/* Notification Settings */}
          <section className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
            {/* Add notification settings here */}
          </section>

          {/* Account Settings */}
          <section className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            {/* Add account settings here */}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;