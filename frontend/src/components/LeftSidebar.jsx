import React, { useContext } from 'react';
import { PanelRightIcon, MessageSquareIcon, SettingsIcon, HelpCircleIcon, LogOutIcon } from 'lucide-react';
import DashboardButton from './ui/DashboardButtons';
import LeftSlider from './LeftSlider';
import { DashboardContext } from '../context/DashboardContext';

const LeftSidebar = ({ isMobileMenuOpen, isRoomsListVisible, setIsRoomsListVisible }) => {
    const { activeSection, setActiveSection } = useContext(DashboardContext);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div
            className={`w-full md:w-68 bg-gray-800 p-3 flex flex-col justify-between 
        ${isMobileMenuOpen ? 'block' : 'hidden'} md:block border-r border-gray-700 relative`}
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
                        isActive={activeSection === 'rooms'}
                        onClick={() => setActiveSection('rooms')}
                    />
                    <DashboardButton
                        icon={MessageSquareIcon}
                        label="Messages"
                        badge="12"
                        isActive={activeSection === 'messages'}
                        onClick={() => setActiveSection('messages')}
                    />
                    <DashboardButton
                        icon={SettingsIcon}
                        label="Settings"
                        isActive={activeSection === 'settings'}
                        onClick={() => setActiveSection('settings')}
                    />
                    <DashboardButton
                        icon={HelpCircleIcon}
                        label="Help"
                        isActive={activeSection === 'help'}
                        onClick={() => setActiveSection('help')}
                    />
                </div>
                <LeftSlider isRoomsListVisible={isRoomsListVisible} />
            </div>
            <div className="flex items-center mt-4">
                <DashboardButton
                    icon={LogOutIcon}
                    label="Logout"
                    onClick={handleLogout}
                />
            </div>
        </div>
    );
};

export default LeftSidebar;