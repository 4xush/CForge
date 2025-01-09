import React, { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PanelRightIcon, SettingsIcon, HelpCircleIcon } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import DashboardButton from './ui/DashboardButtons';
import RoomList from './RoomList';
import UserProfileModal from './ProfileModal';
import CreateJoinModal from './CreateRoom/CreateJoinRoomModal';

const LeftSidebar = () => {
    const { authUser, logout } = useAuthContext();
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
            <div
                className={`w-full md:w-64 bg-gray-800 p-3 flex flex-col justify-between 'hidden' md:block border-r border-gray-700 relative h-screen overflow-y-auto`}
            >
                <div className="flex flex-col h-full">
                    <Link to="/dashboard" className="text-xl font-bold mb-6 text-white">CForge</Link>

                    <div className="flex-1">
                        <DashboardButton
                            icon={PanelRightIcon}
                            label="Rooms"
                            isActive={isActive('/rooms')}
                            onClick={() => navigate('/dashboard')}
                        />

                        {/* Always visible RoomList */}
                        <div className="mt-2">
                            <RoomList
                                setRoomFormVisible={setRoomFormVisible}
                            />
                        </div>

                        <DashboardButton
                            ref={settingsButtonRef}
                            icon={SettingsIcon}
                            label="Settings"
                            isActive={isActive('/settings')}
                            onClick={() => navigate('/settings')}
                        />

                        <DashboardButton
                            icon={HelpCircleIcon}
                            label="Help"
                            isActive={isActive('/help')}
                            onClick={() => navigate('/help')}
                        />
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-700">
                        <UserProfileModal
                            user={authUser}
                            onLogout={logout}
                        />
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

