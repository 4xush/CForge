import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Trophy, Star, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const MiniProfileModal = ({ user, onLogout }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const modalRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleViewFullProfile = (e) => {
        e.stopPropagation();
        navigate('/profile');
    };

    const handleLogoutClick = (e) => {
        e.stopPropagation();
        onLogout();
    };

    return (
        <div
            ref={modalRef}
            className={`
                mt-auto bg-gray-900 rounded-t-xl border-t border-x border-gray-700
                transition-all duration-300 ease-in-out
                ${isExpanded ? 'h-auto' : 'h-16 cursor-pointer'}
            `}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Collapsed View */}
            <div className="flex items-center px-4 h-16">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 mr-3">
                    {user?.profilePicture ? (
                        <img
                            src={user.profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">{user?.fullName}</h3>
                    <p className="text-xs text-gray-400">@{user?.username}</p>
                </div>
                <ChevronRight
                    size={20}
                    className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                />
            </div>

            {/* Expanded Content */}
            <div className={`
                overflow-hidden transition-all duration-300
                ${isExpanded ? 'opacity-100 max-h-[450px]' : 'opacity-0 max-h-0'}
            `}>
                <CardContent className="p-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center justify-center space-x-2 text-yellow-500 mb-1">
                                <Trophy size={16} />
                                <span className="text-sm">LeetCode</span>
                            </div>
                            <p className="text-center text-white font-semibold">
                                {user?.platforms?.leetcode?.totalQuestionsSolved || 0}
                            </p>
                            <p className="text-center text-xs text-gray-400">Problems Solved</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center justify-center space-x-2 text-red-500 mb-1">
                                <Star size={16} />
                                <span className="text-sm">Rating</span>
                            </div>
                            <p className="text-center text-white font-semibold">
                                {user?.platforms?.leetcode?.contestRating || 0}
                            </p>
                            <p className="text-center text-xs text-gray-400">Contest Rating</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <button
                            onClick={handleViewFullProfile}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-between transition-colors"
                        >
                            <span>View Full Profile</span>
                            <ChevronRight size={20} />
                        </button>
                        <button
                            onClick={handleLogoutClick}
                            className="w-full bg-red-900/20 hover:bg-red-900/30 text-red-400 py-2 px-4 rounded-lg flex items-center justify-between transition-colors"
                        >
                            <span className="flex items-center">
                                <LogOut size={18} className="mr-2" />
                                Logout
                            </span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </CardContent>
            </div>
        </div>
    );
};

export default MiniProfileModal;