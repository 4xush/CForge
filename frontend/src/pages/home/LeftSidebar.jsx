import React from 'react';
import { PanelRightIcon, MessageSquareIcon, SettingsIcon, HelpCircleIcon } from 'lucide-react';
import DashboardButton from '../../components/ui/DashboardButtons';
import LeftSlider from './LeftSlider';

const LeftSidebar = ({ isMobileMenuOpen, isRoomsListVisible, setIsRoomsListVisible }) => {
    return (
        <div
            className={`w-full md:w-68 bg-gray-800 p-3 flex flex-col ${isMobileMenuOpen ? 'block' : 'hidden'} md:block border-r border-gray-700 relative`}
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
    );
};

export default LeftSidebar;
