import React, { useState, useEffect, useContext } from 'react';
import { Menu } from 'lucide-react';
import LeftSidebar from './LeftSidebar';
import MainContent from './MainContent';
import RightSidebar from './RightSidebar';
import { RoomContext } from '../context/RoomContext'; // Access RoomContext
import { DashboardContext } from '../context/DashboardContext'; // Import DashboardContext
import UserSettings from './UserSettings'; // Import UserSettings overlay component
import HelpFAQ from './HelpFAQ';

const CForgeUI = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('leaderboard'); // Default to 'leaderboard'
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isRoomsListVisible, setIsRoomsListVisible] = useState(false);

    // Access selectedRoom and refreshRoomList from RoomContext
    const { selectedRoom, refreshRoomList } = useContext(RoomContext);

    // Access activeSection from DashboardContext to manage sections
    const { activeSection } = useContext(DashboardContext);

    // Trigger room list fetching when the component mounts
    useEffect(() => {
        refreshRoomList();  // Fetch room list when the dashboard is loaded
    }, [refreshRoomList]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

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
            <LeftSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                isRoomsListVisible={isRoomsListVisible}
                setIsRoomsListVisible={setIsRoomsListVisible}
            />

            {/* Main Layout */}
            <div className="flex-1 flex flex-col md:flex-row">
                {/* Conditional Rendering based on active section */}
                {/* {activeSection === 'settings' ? (
                    <UserSettings />
                ) : activeSection === 'help' ? ( */}
                {activeSection === 'help' ? (
                    <HelpFAQ /> // Render HelpFAQ when active section is 'help'
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

                {/* Right Sidebar only when "chat" tab is selected and a room is active */}
                {activeTab === 'chat' && selectedRoom && (
                    <RightSidebar
                        isMobile={isMobile}
                        isRightSidebarOpen={isRightSidebarOpen}
                        activeTab={activeTab}
                    />
                )}
            </div>
        </div>
    );
};

export default CForgeUI;
