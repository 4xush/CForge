import React, { useContext, useRef, useState } from 'react';
import { PanelRightIcon, SettingsIcon, HelpCircleIcon } from 'lucide-react';
import { DashboardContext } from '../context/DashboardContext';
import { useAuthContext } from '../context/AuthContext';
import { useRoomContext } from '../context/RoomContext';
import DashboardButton from './ui/DashboardButtons';
import RoomList from './RoomList';
import SettingsModal from './SettingsModal';
import MiniProfileModal from './ProfileModal';
import CreateJoinModal from './RoomCreation/CreateJoinRoomModal';

const LeftSidebar = ({ isMobileMenuOpen }) => {
    const { activeSection, setActiveSection, isSettingsOpen, setIsSettingsOpen } = useContext(DashboardContext);
    const { authUser, logout } = useAuthContext();
    const { setSelectedRoom, refreshRoomList } = useRoomContext();
    const settingsButtonRef = useRef(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isRoomFormVisible, setRoomFormVisible] = useState(false);

    const handleSettingsClick = () => {
        setIsProfileOpen(false);
        setIsSettingsOpen(true);
        setActiveSection('settings');
    };

    const handleRoomCreatedOrJoined = () => {
        setRoomFormVisible(false);
        refreshRoomList();
    };

    const handleRoomSelection = (room) => {
        setSelectedRoom(room);
    };

    return (
        <>
            <div
                className={`w-full md:w-64 bg-gray-800 p-3 flex flex-col justify-between
                ${isMobileMenuOpen ? 'block' : 'hidden'} md:block border-r border-gray-700 relative h-screen overflow-y-auto`}
            >
                <div className="flex flex-col h-full">
                    <h1 className="text-xl font-bold mb-6 text-white">CForge</h1>

                    <div className="flex-1">
                        <DashboardButton
                            icon={PanelRightIcon}
                            label="Rooms"
                            isActive={activeSection === 'rooms'}
                            onClick={() => setActiveSection('rooms')}
                        />

                        {/* Always visible RoomList */}
                        <div className="mt-2">
                            <RoomList
                                setRoomFormVisible={setRoomFormVisible}
                                onRoomClick={handleRoomSelection}
                            />
                        </div>

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

            {isRoomFormVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="relative w-full max-w-lg">
                        <CreateJoinModal
                            onClose={() => setRoomFormVisible(false)}
                            onRoomCreated={handleRoomCreatedOrJoined}
                            onRoomJoined={handleRoomCreatedOrJoined}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default LeftSidebar;
