import React, { useState, useEffect, useContext } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import LeftSidebar from './LeftSidebar';
import MainContent from './MainContent';
import { RoomContext } from '../context/RoomContext';
import { DashboardContext } from '../context/DashboardContext';
import HelpFAQ from './HelpFAQ';
import UserInfo from './User';


const CForgeUI = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [isMobile, setIsMobile] = useState(false);
    const [isRoomsListVisible, setIsRoomsListVisible] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const { selectedRoom, refreshRoomList } = useContext(RoomContext);
    const { activeSection } = useContext(DashboardContext);
    const { authUser } = useAuthContext();

    useEffect(() => {
        refreshRoomList();
    }, [refreshRoomList]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Profile Modal Component
    const ProfileModal = ({ isOpen, onClose, children }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                    {children}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-300">
                {/* Top Navigation Bar */}
                <div className="flex items-center justify-between p-4 bg-gray-800 md:hidden">
                    <button
                        className="text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu size={20} />
                    </button>

                    {/* User Profile Button - Mobile */}
                    <button
                        onClick={() => setIsProfileOpen(true)}
                        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 rounded-full px-3 py-1"
                    >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600">
                            {authUser?.profilePicture ? (
                                <img
                                    src={authUser.profilePicture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    {authUser?.fullName?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[100px]">
                            {authUser?.fullName}
                        </span>
                    </button>
                </div>

                {/* Left Sidebar */}
                <LeftSidebar
                    isMobileMenuOpen={isMobileMenuOpen}
                    isRoomsListVisible={isRoomsListVisible}
                    setIsRoomsListVisible={setIsRoomsListVisible}
                />

                {/* Main Layout */}
                <div className="flex-1 flex flex-col md:flex-row relative">
                    {/* Desktop User Profile Button */}
                    <div className="hidden md:block absolute top-4 right-4 z-10">
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 rounded-full px-4 py-2 transition-all duration-200 ease-in-out"
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                                {authUser?.profilePicture ? (
                                    <img
                                        src={authUser.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                                        {authUser?.fullName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-medium text-white">
                                    {authUser?.fullName}
                                </span>
                                <span className="text-xs text-gray-400">View Profile</span>
                            </div>
                        </button>
                    </div>

                    {activeSection === 'help' ? (
                        <HelpFAQ />
                    ) : selectedRoom ? (
                        <MainContent
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            isMobile={isMobile}
                        />
                    ) : (
                        <div className="flex-1 bg-gray-800 flex items-center justify-center">
                            <h2 className="text-sm text-gray-700">Please select a room</h2>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Modal */}
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)}>
                <UserInfo />
            </ProfileModal>
        </>
    );
};

export default CForgeUI;