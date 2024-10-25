import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Trophy, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MiniProfileModal = ({ isOpen, onClose, user }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleViewFullProfile = () => {
        onClose();
        navigate('/profile'); // Adjust this route according to your routing setup
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-20">
            <div className="w-80 relative">
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 p-1 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="pt-6">
                        {/* Profile Header */}
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800">
                                {user?.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">
                                        {user?.fullName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">{user?.fullName}</h3>
                                <p className="text-sm text-gray-400">@{user?.username}</p>
                            </div>
                        </div>

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

                        {/* View Full Profile Button */}
                        <button
                            onClick={handleViewFullProfile}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-between transition-colors"
                        >
                            <span>View Full Profile</span>
                            <ChevronRight size={20} />
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MiniProfileModal;