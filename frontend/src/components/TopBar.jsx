import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, LogOut, X } from 'lucide-react';
import RoomDetails from './RoomDetails';
import ConfirmDialog from './ui/ConfirmDialog';
import ApiService from '../services/ApiService';
import toast from 'react-hot-toast';

const TopBar = ({ roomId }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showRoomDetails, setShowRoomDetails] = useState(false);
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
    const [roomDetails, setRoomDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const menuRef = useRef(null);
    const roomDetailsRef = useRef(null);

    const toggleMenu = () => setShowMenu((prev) => !prev);

    const handleRoomDetailsClick = () => {
        setShowRoomDetails(true);
        setShowMenu(false);
    };

    const handleLeaveRoomClick = () => {
        setShowLeaveConfirmation(true);
        setShowMenu(false);
    };

    const fetchRoomDetails = async (id) => {
        if (!id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await ApiService.get(`/rooms/${id}`);
            setRoomDetails(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch room details.');
            toast.error('Failed to fetch room details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomDetails(roomId);
    }, [roomId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                roomDetailsRef.current &&
                !roomDetailsRef.current.contains(event.target)
            ) {
                setShowRoomDetails(false);
                setShowMenu(false);
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
            // Redirect user after leaving room (you might want to handle this in the parent component)
            window.location.href = '/dashboard';
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to leave room.');
        }
    };

    return (
        <div className="bg-gray-800 py-0.75 px-4 flex items-center justify-between border-b border-gray-700 relative">
            <div>
                <h2 className="text-lg font-bold text-gray-300">
                    {roomDetails?.name || 'Loading...'}
                </h2>
                <p className="text-xs text-gray-500">
                    {roomDetails ? `${roomDetails.members?.length || 0} Members` : 'Loading members...'}
                </p>
            </div>

            {!showRoomDetails && (
                <button onClick={toggleMenu} className="text-gray-300">
                    <MoreVertical size={24} />
                </button>
            )}

            {showMenu && (
                <div ref={menuRef} className="absolute right-4 top-12 w-40 bg-gray-700 text-gray-300 rounded-lg shadow-lg z-10">
                    <ul>
                        <li
                            className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer"
                            onClick={handleRoomDetailsClick}
                        >
                            Room Details
                        </li>
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

            {showRoomDetails && roomDetails && (
                <div
                    ref={roomDetailsRef}
                    className="fixed right-0 top-0 h-full w-64 bg-gray-800 text-gray-300 shadow-lg z-20 transition-transform duration-300 ease-in-out transform translate-x-0"
                >
                    <button
                        onClick={() => setShowRoomDetails(false)}
                        className="absolute top-2 right-2 text-gray-300"
                    >
                        <X size={24} />
                    </button>
                    <RoomDetails roomDetails={roomDetails} loading={loading} error={error} />
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