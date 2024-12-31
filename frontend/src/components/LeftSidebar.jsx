import React, { useContext, useRef, useState } from 'react';
import { PanelRightIcon, MessageSquareIcon, SettingsIcon, HelpCircleIcon } from 'lucide-react';
import DashboardButton from './ui/DashboardButtons';
import LeftSlider from './LeftSlider';
import { DashboardContext } from '../context/DashboardContext';
import { useAuthContext } from '../context/AuthContext';
import SettingsModal from './SettingsModal';
import MiniProfileModal from './ProfileModal';

const LeftSidebar = ({ isMobileMenuOpen, isRoomsListVisible, setIsRoomsListVisible }) => {
    const { activeSection, setActiveSection, isSettingsOpen, setIsSettingsOpen } = useContext(DashboardContext);
    const { authUser, logout } = useAuthContext();
    const settingsButtonRef = useRef(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleSettingsClick = () => {
        setIsProfileOpen(false);
        setIsSettingsOpen(true);
        setActiveSection('settings');
    };

    return (
        <>
            <div
                className={`w-full md:w-80 bg-gray-800 p-3 flex flex-col justify-between
                ${isMobileMenuOpen ? 'block' : 'hidden'} md:block border-r border-gray-700 relative h-screen`}
                onMouseEnter={() => setIsRoomsListVisible(true)}
                onMouseLeave={() => setIsRoomsListVisible(false)}
            >
                <div className="flex flex-col h-full">
                    {/* Top section with logo */}
                    <h1 className="text-xl font-bold mb-6 text-white">CForge</h1>

                    {/* Main navigation buttons */}
                    <div className="flex-1">
                        <DashboardButton
                            icon={PanelRightIcon}
                            label="Rooms"
                            badge="08"
                            isActive={activeSection === 'rooms'}
                            onClick={() => setActiveSection('rooms')}
                        />
                        <DashboardButton
                            ref={settingsButtonRef}
                            icon={SettingsIcon}
                            label="Settings"
                            isActive={activeSection === 'settings'}
                            onClick={handleSettingsClick}
                        />
                        <DashboardButton
                            icon={HelpCircleIcon}
                            label="Help"
                            isActive={activeSection === 'help'}
                            onClick={() => setActiveSection('help')}
                        />
                    </div>

                    {/* LeftSlider component */}
                    <LeftSlider isRoomsListVisible={isRoomsListVisible} />

                    {/* Help button at bottom */}
                    <div className="mt-auto pt-4 border-t border-gray-700">
                        <MiniProfileModal
                            user={authUser}
                            onLogout={logout}
                        />
                    </div>
                </div>
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                triggerRef={settingsButtonRef}
            />
        </>
    );
};

export default LeftSidebar;
