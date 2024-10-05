import React, { useState, useEffect } from 'react';
import { Search, Plus, Menu, PanelRightIcon, MessageSquareIcon, SettingsIcon, HelpCircleIcon } from 'lucide-react';
import profileImage from '../../assets/logo.png';
import Leaderboard from '../../components/Leaderboard';
import Chat from '../../components/Chat';
import DashboardButton from '../../components/ui/DashboardButtons';
import LeftSlider from './LeftSlider';

const CForgeUI = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isRoomsListVisible, setIsRoomsListVisible] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-300">
            {/* Mobile Menu Button */}
            <button
                className="md:hidden p-2 text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <Menu size={20} />
            </button>

            {/* Left Sidebar */}
            <div
                className={`w-full md:w-64 bg-gray-800 p-3 flex flex-col ${isMobileMenuOpen ? 'block' : 'hidden'} md:block border-r border-gray-700 relative`}
                onMouseEnter={() => setIsRoomsListVisible(true)}
                onMouseLeave={() => setIsRoomsListVisible(false)}
            >
                <h1 className="text-xl font-bold mb-6 text-white">CForge</h1>
                <div className="flex-1">
                    <DashboardButton
                        icon={PanelRightIcon}
                        label="Rooms"
                        badge="08"
                    />
                    <DashboardButton
                        icon={MessageSquareIcon}
                        label="Messages"
                        badge="12"
                    />
                    <DashboardButton
                        icon={SettingsIcon}
                        label="Settings"
                    />
                    <DashboardButton
                        icon={HelpCircleIcon}
                        label="Help"
                    />
                </div>

                {/* Left Slider */}
                <LeftSlider isRoomsListVisible={isRoomsListVisible} /> {/* Use LeftSlider component */}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Content Area */}
                <div className="flex-1 flex flex-col md:flex-row">
                    <div className="flex-1 flex flex-col bg-gray-900">
                        <div className="bg-gray-800 py-2 px-4 flex items-center justify-between border-b border-gray-700">
                            <div>
                                <h2 className="text-lg font-bold text-gray-300">CODE SOMETIMES</h2>
                                <p className="text-xs text-gray-500">15 Members</p>
                            </div>
                        </div>
                        <div className="flex border-b border-gray-700">
                            <button
                                className={`px-4 py-1 text-sm ${activeTab === 'leaderboard' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                                onClick={() => setActiveTab('leaderboard')}
                            >
                                Leaderboard
                            </button>
                            <button
                                className={`px-4 py-1 text-sm ${activeTab === 'chat' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
                                onClick={() => setActiveTab('chat')}
                            >
                                Chat
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
                            {activeTab === 'leaderboard' ? <Leaderboard isMobile={isMobile} /> : <Chat />}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    {(!isMobile || isRightSidebarOpen) && activeTab !== 'leaderboard' && (
                        <div className={`w-full md:w-56 bg-gray-800 p-3 border-l border-gray-700 ${isMobile ? 'absolute right-0 top-0 h-full transition-transform duration-300 ease-in-out transform ' + (isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full') : ''}`}>
                            <div className="bg-purple-600 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-3">
                                #
                            </div>
                            <h2 className="text-lg mb-2">Code Sometimes</h2>
                            <p className="text-xs mb-3">15 Members</p>
                            <p className="text-xs mb-3">
                                This channel is your space to collaborate, brainstorm, and discuss all things design-related with your fellow...
                                <span className="text-blue-500 ml-1 cursor-pointer">More</span>
                            </p>
                            <h3 className="text-sm font-semibold mb-2">Group Members</h3>
                            {['Person1', 'Person2'].map((name, index) => (
                                <div key={index} className="flex items-center mb-2">
                                    <img src={profileImage} alt={name} className="w-5 h-5 rounded-full mr-2" />
                                    <span className="text-xs">{name}</span>
                                </div>
                            ))}
                            <button className="mt-3 flex items-center text-orange-500 text-sm">
                                <Plus className="mr-2" size={16} />
                                Invite
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CForgeUI;
