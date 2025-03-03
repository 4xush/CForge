import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Trophy, Star, LogOut } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { useAuthContext } from '../context/AuthContext';

const UserProfileModal = ({ onLogout }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const modalRef = useRef(null);
    const { authUser } = useAuthContext();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleLogoutClick = (e) => {
        e.stopPropagation();
        onLogout();
    };

    return (
        <div
            ref={modalRef}
            className={`
                mt-auto bg-gray-900 rounded-xl border border-gray-700
                transition-all duration-300 ease-in-out 
                ${isExpanded ? 'h-auto' : 'h-16'}
                hover:bg-gray-800 cursor-pointer
            `}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Collapsed View */}
            <div className="flex items-center px-4 h-16 mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 mr-3 ring-2 ring-gray-700 transition-all hover:ring-gray-600">
                    {authUser?.profilePicture ? (
                        <img
                            src={authUser.profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            {authUser?.fullName?.charAt(0) || 'U'}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white transition-colors hover:text-gray-300">
                        {authUser?.fullName}
                    </h3>
                    <p className="text-xs text-gray-400">@{authUser?.username}</p>
                </div>
                <ChevronRight
                    size={20}
                    className={`
                        text-gray-400 transition-transform duration-300 
                        ${isExpanded ? 'rotate-90' : ''}
                    `}
                />
            </div>

            {/* Expanded Content */}
            <div className={`
                overflow-hidden transition-all duration-300
                ${isExpanded ? 'opacity-100 max-h-[450px]' : 'opacity-0 max-h-0'}
            `}>
                <CardContent className="p-4">
                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <button
                            onClick={handleLogoutClick}
                            className="
                                w-full bg-red-900/20 hover:bg-red-900/30 
                                text-red-400 py-2 px-4 rounded-lg 
                                flex items-center justify-between 
                                transition-colors group
                            "
                        >
                            <span className="flex items-center transition-colors group-hover:text-red-300">
                                <LogOut size={18} className="mr-2" />
                                Logout
                            </span>
                            <ChevronRight
                                size={20}
                                className="transition-transform group-hover:translate-x-1"
                            />
                        </button>
                    </div>
                </CardContent>
            </div>
        </div>
    );
};

export default UserProfileModal;