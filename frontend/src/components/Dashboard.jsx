import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import LeftSidebar from './LeftSidebar';
import MainContent from './MainContent';
import RightSidebar from './RightSidebar';

const CForgeUI = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('leaderboard'); // Default is 'leaderboard'
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
            <LeftSidebar
                isMobileMenuOpen={isMobileMenuOpen}
                isRoomsListVisible={isRoomsListVisible}
                setIsRoomsListVisible={setIsRoomsListVisible}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row">
                <MainContent
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isMobile={isMobile}
                />

                {/* Right Sidebar only when "chat" tab is selected */}
                {activeTab === 'chat' && (
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
