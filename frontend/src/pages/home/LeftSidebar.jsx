import React, { useState } from 'react';
import { Menu, PanelRightIcon, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import Rooms from '../components/dashboard-buttons/Rooms';
import Messages from '../components/dashboard-buttons/Messages';
import SettingsComponent from '../components/dashboard-buttons/Settings';
import Help from '../components/dashboard-buttons/Help';

const LeftSidebar = React.memo(({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
    const [isRoomsListVisible, setIsRoomsListVisible] = useState(false);

    return (
        <>
            <button
                className="md:hidden p-2 text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <Menu size={20} />
            </button>

            <div
                className={`w-full md:w-64 bg-gray-800 p-3 flex flex-col ${isMobileMenuOpen ? 'block' : 'hidden'} md:block border-r border-gray-700 relative`}
                onMouseEnter={() => setIsRoomsListVisible(true)}
                onMouseLeave={() => setIsRoomsListVisible(false)}
            >
                <h1 className="text-xl font-bold mb-6 text-white">CForge</h1>
                <div className="flex-1">
                    <Rooms />
                    <Messages />
                    <SettingsComponent />
                    <Help />
                </div>
                <RoomsList isVisible={isRoomsListVisible} />
                <ToggleButton
                    isVisible={isRoomsListVisible}
                    onClick={() => setIsRoomsListVisible(!isRoomsListVisible)}
                />
            </div>
        </>
    );
});

const RoomsList = React.memo(({ isVisible }) => (
    <div
        className={`absolute left-full top-0 h-full w-48 bg-gray-800 p-3 transition-transform duration-300 ease-in-out transform ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ boxShadow: isVisible ? '5px 0 10px rgba(0,0,0,0.1)' : 'none' }}
    >
        <h2 className="text-lg mb-3 flex items-center">
            <PanelRightIcon className="mr-2" size={18} />
            Rooms
        </h2>
        {['Room1', 'Room2'].map((name, index) => (
            <div key={index} className="flex items-center mb-2">
                <img src="/api/placeholder/24/24" alt={name} className="w-6 h-6 rounded-full mr-2" />
                <span className="text-sm">{name}</span>
            </div>
        ))}
        <button className="mt-3 flex items-center text-orange-500 text-sm">
            <Plus className="mr-2" size={16} />
            Add Rooms
        </button>
    </div>
));

const ToggleButton = React.memo(({ isVisible, onClick }) => (
    <button
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 bg-gray-700 p-1 rounded-full"
        onClick={onClick}
    >
        {isVisible ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
    </button>
));

export default LeftSidebar;