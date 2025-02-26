import React, { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PanelRightIcon, SettingsIcon, HelpCircleIcon, LayoutDashboardIcon } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import DashboardButton from './ui/DashboardButtons';
import RoomList from './Rooms/RoomList';
import UserProfileModal from './ProfileModal';
import CreateJoinModal from './CreateRoom/CreateJoinRoomModal';

const LeftSidebar = () => {
    const { logout } = useAuthContext();
    const settingsButtonRef = useRef(null);
    const [isRoomFormVisible, setRoomFormVisible] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleRoomCreatedOrJoined = () => {
        setRoomFormVisible(false);
        window.location.reload();
    };

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <>
            <div className="w-full md:w-64 bg-gray-800 p-3 flex flex-col justify-between hidden md:block border-r border-gray-700 relative h-screen overflow-y-auto shadow-lg">
                <div className="flex flex-col h-full">
                    <Link
                        to="/dashboard"
                        className="text-2xl font-bold mb-8 text-white tracking-tight transition-colors hover:text-gray-300"
                    >
                        CForge
                    </Link>
                    <div className="flex-1 space-y-2">
                        <DashboardButton
                            icon={LayoutDashboardIcon}
                            label="Dashboard"
                            isActive={isActive('/dashboard')}
                            onClick={() => navigate('/dashboard')}
                            className="w-full transition-all duration-300 hover:bg-gray-700"
                        />
                        <DashboardButton
                            icon={PanelRightIcon}
                            label="Rooms"
                            isActive={isActive('/rooms')}
                            onClick={() => navigate('/rooms')}
                            className="w-full transition-all duration-300 hover:bg-gray-700"
                        />
                        <div className="mt-2">
                            <RoomList setRoomFormVisible={setRoomFormVisible} />
                        </div>
                        <DashboardButton
                            ref={settingsButtonRef}
                            icon={SettingsIcon}
                            label="Settings"
                            isActive={isActive('/settings')}
                            onClick={() => window.location.replace('/settings')}
                            className="w-full transition-all duration-300 hover:bg-gray-700"
                        />
                        <DashboardButton
                            icon={HelpCircleIcon}
                            label="Help"
                            isActive={isActive('/help')}
                            onClick={() => navigate('/help')}
                            className="w-full transition-all duration-300 hover:bg-gray-700"
                        />
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-700">
                        <UserProfileModal onLogout={logout} />
                    </div>
                </div>
            </div>
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