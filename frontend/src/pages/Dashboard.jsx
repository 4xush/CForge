import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { RoomContext } from '../context/RoomContext';
import InviteModal from '../components/InviteModal';

const Dashboard = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { selectedRoom, refreshRoomList } = useContext(RoomContext);
    const navigate = useNavigate();

    useEffect(() => {
        refreshRoomList();
    }, [refreshRoomList]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (selectedRoom) {
            navigate(`/rooms/${selectedRoom._id}/leaderboard`);
        }
    }, [selectedRoom, navigate]);

    return (
        <>
            <div className="flex flex-col h-screen bg-gray-900 text-gray-300">
                <InviteModal />
                {/* Top Navigation Bar for mobile */}
                <div className="flex items-center justify-between p-4 bg-gray-800 md:hidden">
                    <button
                        className="text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu size={20} />
                    </button>
                </div>
                {/* Main Layout */}
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 bg-gray-800 flex items-center justify-center">
                        <h2 className="text-sm text-gray-300">Please select a room from the sidebar</h2>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;

