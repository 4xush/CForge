import React, { useContext } from 'react';
import { PanelRightIcon, MessageSquareIcon, SettingsIcon, HelpCircleIcon, LogOutIcon } from 'lucide-react';
import DashboardButton from './ui/DashboardButtons';
import LeftSlider from './LeftSlider';
import { DashboardContext } from '../context/DashboardContext';

const LeftSidebar = ({ isMobileMenuOpen, isRoomsListVisible, setIsRoomsListVisible }) => {
    const { setActiveSection } = useContext(DashboardContext);

    const handleLogout = () => {
        // Clear any tokens or session data here
        localStorage.removeItem('token');
        window.location.href = '/login'; // Redirect to login page after logout
    };

    return (
        <div
            className={`w-full md:w-68 bg-gray-800 p-3 flex flex-col justify-between ${isMobileMenuOpen ? 'block' : 'hidden'} md:block border-r border-gray-700 relative`}
            onMouseEnter={() => setIsRoomsListVisible(true)}
            onMouseLeave={() => setIsRoomsListVisible(false)}
        >
            <div>
                <h1 className="text-xl font-bold mb-6 text-white">CForge</h1>
                <div className="flex-1">
                    <DashboardButton
                        icon={PanelRightIcon}
                        label="Rooms"
                        badge="08"
                        onClick={() => setActiveSection('rooms')} // Update active section to 'rooms'
                    />
                    <DashboardButton
                        icon={MessageSquareIcon}
                        label="Messages"
                        badge="12"
                        onClick={() => setActiveSection('messages')} // Update active section to 'messages'
                    />
                    <DashboardButton
                        icon={SettingsIcon}
                        label="Settings"
                        onClick={() => setActiveSection('settings')} // Update active section to 'settings'
                    />
                    <DashboardButton
                        icon={HelpCircleIcon}
                        label="Help"
                        onClick={() => setActiveSection('help')} // Update active section to 'help'
                    />
                </div>
                {/* Left Slider */}
                <LeftSlider isRoomsListVisible={isRoomsListVisible} /> {/* Use LeftSlider component */}
            </div>

            {/* Logout button at the bottom */}
            <div className="flex items-center mt-4"> {/* Added margin-top for spacing */}
                <DashboardButton
                    icon={LogOutIcon}
                    label="Logout"
                    onClick={handleLogout} // Attach logout function
                    badge={null} // No badge for logout
                />
            </div>
        </div>
    );
};

export default LeftSidebar;
