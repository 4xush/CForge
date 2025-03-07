import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, LogOut, X, Settings } from 'lucide-react';
import RoomDetails from './RoomDetails';
import RoomSettings from './RoomSettings';
import ConfirmDialog from '../ui/ConfirmDialog';
import ApiService from '../../services/ApiService';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../context/AuthContext';

const TopBar = ({ roomId }) => {
    const [activeComponent, setActiveComponent] = useState(null); // 'menu', 'details', 'settings'
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
    const [roomDetails, setRoomDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updatingRoom, setUpdatingRoom] = useState(false); // New state for tracking room updates
    const [error, setError] = useState(null);
    const { authUser } = useAuthContext();
    const topBarRef = useRef(null);
    const [settingsKey, setSettingsKey] = useState(Date.now()); // Key for forcing remount

    const toggleMenu = () => {
        setActiveComponent(activeComponent === 'menu' ? null : 'menu');
    };

    const handleRoomDetailsClick = () => {
        setActiveComponent('details');
    };

    const handleRoomSettingsClick = () => {
        setActiveComponent('settings');
    };

    const handleLeaveRoomClick = () => {
        setShowLeaveConfirmation(true);
        setActiveComponent(null);
    };

    const handleRoomUpdate = async (updatedRoom) => {
        setUpdatingRoom(true); // Set updating state to true

        try {
            // You could optionally refetch the room details instead of just setting state
            await fetchRoomDetails(roomId);

            // Or directly update the state
            setRoomDetails(updatedRoom);

            // Force remount of settings component
            setSettingsKey(Date.now());

            toast.success('Room updated successfully');
        } catch (err) {
            toast.error('Error updating room');
        } finally {
            setUpdatingRoom(false); // Reset updating state
        }
    };

    const fetchRoomDetails = async (id) => {
        if (!id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await ApiService.get(`/rooms/${id}`);
            setRoomDetails(response.data);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch room details.');
            toast.error('Failed to fetch room details.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomDetails(roomId);
    }, [roomId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Skip if the click is inside a dialog (has role="dialog" or inside an element with className containing "dialog")
            if (
                event.target.closest('[role="dialog"]') ||
                event.target.closest('.dialog-content') ||
                // Also check for any element with dialog in the class name
                event.target.closest('[class*="dialog"]')
            ) {
                return;
            }

            if (topBarRef.current && !topBarRef.current.contains(event.target)) {
                setActiveComponent(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onLeaveRoom = async () => {
        try {
            const response = await ApiService.delete(`/rooms/${roomId}/leave`);
            setShowLeaveConfirmation(false);
            toast.success(response.data.message || 'Successfully left the room');
            window.location.href = '/rooms';
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to leave room.');
        }
    };

    // Check if the current user is an admin
    const isCurrentUserAdmin = roomDetails?.admins?.some(
        (admin) => admin.username === authUser.username
    );

    return (
        <div ref={topBarRef} className="bg-gray-800 py-0.75 px-4 flex items-center justify-between border-b border-gray-700 relative">
            <div>
                <h2 className="text-lg font-bold text-gray-300">
                    {loading || updatingRoom ? 'Updating...' : roomDetails?.name || 'Loading...'}
                </h2>
                <p className="text-xs text-gray-500">
                    {loading || updatingRoom ? 'Updating members...' :
                        roomDetails ? `${roomDetails.members?.length || 0} Members` : 'Loading members...'}
                </p>
            </div>

            {!activeComponent && (
                <button onClick={toggleMenu} className="text-gray-300">
                    <MoreVertical size={24} />
                </button>
            )}

            {activeComponent === 'menu' && (
                <div className="absolute right-4 top-12 w-40 bg-gray-700 text-gray-300 rounded-lg shadow-lg z-10">
                    <ul>
                        <li
                            className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer"
                            onClick={handleRoomDetailsClick}
                        >
                            Room Details
                        </li>
                        {/* Conditionally render Settings menu item for admins */}
                        {isCurrentUserAdmin && (
                            <li
                                className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer"
                                onClick={handleRoomSettingsClick}
                            >
                                <Settings size={16} className="inline mr-2" />
                                Settings
                            </li>
                        )}
                        <li
                            className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer text-red-400 flex items-center"
                            onClick={handleLeaveRoomClick}
                        >
                            <LogOut size={16} className="mr-2" />
                            Leave Room
                        </li>
                    </ul>
                </div>
            )}

            {activeComponent === 'details' && roomDetails && (
                <div className="fixed right-0 top-0 h-full w-64 bg-gray-800 text-gray-300 shadow-lg z-20 transition-transform duration-300 ease-in-out transform translate-x-0">
                    <button
                        onClick={() => setActiveComponent(null)}
                        className="absolute top-2 right-2 text-gray-300"
                    >
                        <X size={24} />
                    </button>
                    <RoomDetails
                        roomDetails={roomDetails}
                        loading={loading || updatingRoom}
                        error={error}
                    />
                </div>
            )}

            {activeComponent === 'settings' && roomDetails && !updatingRoom && (
                <div className="fixed right-0 top-0 h-full w-auto bg-gray-800 text-gray-300 shadow-lg z-20 transition-transform duration-300 ease-in-out transform translate-x-0">
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h2 className="text-lg font-bold">Room Settings</h2>
                        <button
                            onClick={() => setActiveComponent(null)}
                            className="text-gray-300"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <RoomSettings
                        key={settingsKey} // Force remount when this key changes
                        room={roomDetails}
                        onClose={() => setActiveComponent(null)}
                        onUpdate={handleRoomUpdate}
                    />
                </div>
            )}

            {/* Show loading state during update */}
            {activeComponent === 'settings' && updatingRoom && (
                <div className="fixed right-0 top-0 h-full w-auto bg-gray-800 text-gray-300 shadow-lg z-20 transition-transform duration-300 ease-in-out transform translate-x-0">
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h2 className="text-lg font-bold">Updating Room...</h2>
                        <button
                            onClick={() => setActiveComponent(null)}
                            className="text-gray-300"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-4">
                        <p>Please wait while room settings are being updated...</p>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={showLeaveConfirmation}
                onClose={() => setShowLeaveConfirmation(false)}
                onConfirm={onLeaveRoom}
                title="Leave Room"
                message="Are you sure you want to leave this room?"
            />
        </div>
    );
};

export default TopBar;