import React, { useState, useEffect, useContext } from 'react';
import { Menu, X } from 'lucide-react';
import LeftSidebar from './LeftSidebar';
import MainContent from './MainContent';
import { RoomContext } from '../context/RoomContext';
import { DashboardContext } from '../context/DashboardContext';
import HelpFAQ from './HelpFAQ';
import InviteModal from './InviteModal';

const CForgeUI = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [isMobile, setIsMobile] = useState(false);
    const [isRoomsListVisible, setIsRoomsListVisible] = useState(false);
    const { selectedRoom, refreshRoomList } = useContext(RoomContext);
    const { activeSection } = useContext(DashboardContext);

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
    return (
        <>
            <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-300">

                <InviteModal />
                {/* Top Navigation Bar */}
                <div className="flex items-center justify-between p-4 bg-gray-800 md:hidden">
                    <button
                        className="text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu size={20} />
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
        </>
    );
};

export default CForgeUI;