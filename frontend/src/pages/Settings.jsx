import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ApiService from '../services/ApiService';
import AddPlatform from '../components/AddPlatform';
import SocialNetworks from '../components/Settings/SocialNetworksSettings';
import BasicInfo from '../components/Settings/BasicInfoSettings';
import AccountSettings from '../components/Settings/AccountSettings';
import { useAuthContext } from '../context/AuthContext';
import { CheckCircle, ArrowRight, Info } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { authUser, updateUser, logout } = useAuthContext();
    const [activeTab, setActiveTab] = useState('basic');
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLeetCodePrompt, setShowLeetCodePrompt] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
            
            // Check if user was redirected from signup
            const fromSignup = params.get('newUser');
            if (fromSignup === 'true' && tabParam === 'platforms') {
                setIsNewUser(true);
                setShowLeetCodePrompt(true);
            }
        }
    }, []);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const response = await ApiService.get('users/profile');
            setProfileData(response.data);
            updateUser(response.data);
            
            // Show LeetCode prompt if on platforms tab and LeetCode is not connected
            if (activeTab === 'platforms' && 
                (!response.data.platforms || !response.data.platforms.leetcode)) {
                setShowLeetCodePrompt(true);
            }
        } catch (error) {
            toast.error('Failed to load profile data');
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = (updatedData) => {
        setProfileData(updatedData);
        updateUser(updatedData);
    };

    const handlePlatformsUpdate = (platforms) => {
        const updatedData = { ...profileData, platforms };
        setProfileData(updatedData);
        updateUser(updatedData);
        
        // Hide the prompt if LeetCode is now connected
        if (platforms && platforms.leetcode) {
            setShowLeetCodePrompt(false);

            // Check for pending invite code in sessionStorage
            const pendingInviteCode = sessionStorage.getItem('app-pendingInviteCode');
            if (pendingInviteCode) {
                sessionStorage.removeItem('app-pendingInviteCode');
                navigate(`/rooms/join/${pendingInviteCode}`);
            }
        }
    };

    const handleSocialNetworksUpdate = (socialNetworks) => {
        const updatedData = { ...profileData, socialNetworks };
        setProfileData(updatedData);
        updateUser(updatedData);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
                Loading...
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
                        src={profileData?.profilePicture || '/default-avatar.png'}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500"
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium">{profileData?.fullName}</h3>
                            {profileData?.isProfileComplete && (
                                <CheckCircle className="w-5 h-5 text-green-500" title="Profile Complete" />
                            )}
                        </div>
                        <p className="text-gray-400">@{profileData?.username}</p>
                        {!profileData?.isProfileComplete && (
                            <p className="text-sm text-yellow-500">Complete your profile for a professional look!</p>
                        )}
                    </div>
                </div>

                {/* LeetCode Connect Prompt */}
                {showLeetCodePrompt && activeTab === 'platforms' && (
                    <div className={`mb-6 p-4 rounded-lg ${isNewUser ? 'bg-blue-600/20 border border-blue-500' : 'bg-gray-700'}`}>
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-white">
                                    {isNewUser ? 'Welcome to CodeForge! 🎉' : 'Connect your LeetCode account'}
                                </h3>
                                <p className="text-gray-300 text-sm mt-1">
                                    {isNewUser 
                                        ? 'Start by connecting your LeetCode account to track your progress and participate in coding rooms.' 
                                        : 'Connecting your LeetCode account helps you track your progress and collaborate with others.'}
                                </p>
                                <div className="mt-2 flex items-center text-blue-400 text-sm">
                                    <span>Enter your LeetCode username below</span>
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                        <BasicInfo profileData={profileData} onProfileUpdate={handleProfileUpdate} />
                    ) : activeTab === 'platforms' ? (
                        <AddPlatform platforms={profileData?.platforms} onPlatformsUpdate={handlePlatformsUpdate} />
                    ) : activeTab === 'social' ? (
                        <SocialNetworks socialNetworks={profileData?.socialNetworks} onSocialNetworksUpdate={handleSocialNetworksUpdate} />
                    ) : (
                        <AccountSettings profileData={profileData} onProfileUpdate={handleProfileUpdate} onLogout={logout} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;