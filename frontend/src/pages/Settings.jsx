import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ApiService from '../services/ApiService';
import AddPlatform from '../components/Settings/AddPlatform';
import SocialNetworks from '../components/Settings/SocialNetworksSettings';
import BasicInfo from '../components/Settings/BasicInfoSettings';
import AccountSettings from '../components/Settings/AccountSettings';
import { useAuthContext } from '../context/AuthContext';
import { CheckCircle} from 'lucide-react';
const Settings = () => {
    const { updateUser, logout } = useAuthContext();
    const [activeTab, setActiveTab] = useState('basic');
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
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

    const handlePlatformsUpdate = (updatedPlatform) => {
        const updatedPlatforms = {
            ...profileData.platforms,
            [updatedPlatform.name]: updatedPlatform,
        };
    
        const updatedData = { ...profileData, platforms: updatedPlatforms };
        setProfileData(updatedData);
        updateUser(updatedData);
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