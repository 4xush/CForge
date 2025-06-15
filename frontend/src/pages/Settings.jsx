import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AddPlatform from '../components/Settings/AddPlatform';
import SocialNetworks from '../components/Settings/SocialNetworksSettings';
import BasicInfo from '../components/Settings/BasicInfoSettings';
import AccountSettings from '../components/Settings/AccountSettings';
import { useAuthContext } from '../context/AuthContext';
import { CheckCircle } from 'lucide-react';

const Settings = () => {
    const { authUser, updateUser, logout, isLoading } = useAuthContext();
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, []);

    const handleProfileUpdate = (updatedData) => {
        const success = updateUser(updatedData);
        if (success) {
            // toast.success('Profile updated successfully');
        } else {
            toast.error('Failed to update profile');
        }
    };

    const handlePlatformsUpdate = (updatedPlatform) => {
        const updatedPlatforms = {
            ...authUser.platforms,
            [updatedPlatform.name]: updatedPlatform,
        };
    
        const updatedData = { ...authUser, platforms: updatedPlatforms };
        const success = updateUser(updatedData);
        if (success) {
            // toast.success('Platform updated successfully');
        } else {
            toast.error('Failed to update platform');
        }
    };

    const handleSocialNetworksUpdate = (socialNetworks) => {
        const updatedData = { ...authUser, socialNetworks };
        const success = updateUser(updatedData);
        if (success) {
            // toast.success('Social networks updated successfully');
        } else {
            toast.error('Failed to update social networks');
        }
    };

    // Show loading state if auth is still loading
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
                Loading...
            </div>
        );
    }

    // Show error state if no user data
    if (!authUser) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Unable to load user data</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-semibold mb-6">Settings</h1>

                {/* Profile Summary */}
                <div className="mb-6 flex items-center gap-4">
                    <img
                        src={authUser?.profilePicture || '/default-avatar.png'}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500"
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium">{authUser?.fullName}</h3>
                            {authUser?.isProfileComplete && (
                                <CheckCircle className="w-5 h-5 text-green-500" title="Profile Complete" />
                            )}
                        </div>
                        <p className="text-gray-400">@{authUser?.username}</p>
                        {!authUser?.isProfileComplete && (
                            <p className="text-sm text-yellow-500">Complete your profile for a professional look!</p>
                        )}
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="flex mb-6">
                    {['basic', 'platforms', 'social', 'account'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 font-medium transition-colors
                                ${activeTab === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab === 'basic' ? 'Basic Info' : tab === 'platforms' ? 'Platforms' : tab === 'social' ? 'Social Networks' : 'Account'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'basic' ? (
                        <BasicInfo profileData={authUser} onProfileUpdate={handleProfileUpdate} />
                    ) : activeTab === 'platforms' ? (
                        <AddPlatform platforms={authUser?.platforms} onPlatformsUpdate={handlePlatformsUpdate} />
                    ) : activeTab === 'social' ? (
                        <SocialNetworks socialNetworks={authUser?.socialNetworks} onSocialNetworksUpdate={handleSocialNetworksUpdate} />
                    ) : (
                        <AccountSettings profileData={authUser} onProfileUpdate={handleProfileUpdate} onLogout={logout} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;