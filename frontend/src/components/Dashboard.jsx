import React, { useState, useEffect, useContext } from 'react';
import { Menu } from 'lucide-react';
import LeftSidebar from './LeftSidebar';
import MainContent from './MainContent';
import RightSidebar from './RightSidebar';
import { RoomContext } from '../context/RoomContext';  // Use RoomContext to access selectedRoom

const CForgeUI = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('leaderboard'); // Default is 'leaderboard'
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isRoomsListVisible, setIsRoomsListVisible] = useState(false);

    // Access selectedRoom from RoomContext instead of DashboardContext
    const { selectedRoom } = useContext(RoomContext);

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
            <LeftSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                isRoomsListVisible={isRoomsListVisible}
                setIsRoomsListVisible={setIsRoomsListVisible}
            />

            {/* Main Content is conditionally rendered based on selectedRoom */}
            <div className="flex-1 flex flex-col md:flex-row">
                {selectedRoom ? (
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

                {/* Right Sidebar only when "chat" tab is selected and room is selected */}
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
