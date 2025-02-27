import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Github, ExternalLink, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import ApiService from '../services/ApiService';

const PublicUserProfileModal = ({ username, isOpen, onClose }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && username) {
            setLoading(true);
            ApiService.get(`/u/${username}`)
                .then(response => {
                    setUser(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Failed to fetch user profile:", error);
                    setUser({ username, error: "Failed to load profile" });
                    setLoading(false);
                });
        } else {
            setUser(null);
        }
    }, [isOpen, username]);

    if (!isOpen || !username) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <Card className="w-full max-w-md bg-gray-900 text-gray-100 rounded-lg shadow-lg p-6 text-center">
                    <p>Loading profile...</p>
                </Card>
            </div>
        );
    }

    if (!user) return null;

    const handleViewProfile = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/u/${user.username}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <Card className="w-full max-w-md bg-gray-900 text-gray-100 rounded-lg shadow-xl border border-gray-700 relative">
                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                <CardHeader className="flex flex-col items-center p-6">
                    <div className="relative mb-4">
                        <Avatar className="h-20 w-20 ring-2 ring-blue-500">
                            <img
                                src={user.profilePicture || '/default-avatar.png'}
                                alt={user.username}
                                className="h-full w-full object-cover rounded-full"
                            />
                        </Avatar>
                        {user.rank && (
                            <Badge className="absolute -bottom-2 -right-2 bg-yellow-500 text-gray-900 font-semibold">
                                {user.rank}
                            </Badge>
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-white">{user.displayName || user.username}</h2>
                    <p className="text-gray-400">@{user.username}</p>
                    {user.bio && <p className="text-sm text-center mt-2 text-gray-300">{user.bio}</p>}
                </CardHeader>

                <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-yellow-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-yellow-500/20">
                            <div className="flex justify-center">
                                <Code2 className="text-yellow-400" size={20} />
                            </div>
                            <p className="text-xs mt-1 text-gray-400">LeetCode</p>
                            <p className="font-bold text-white">{user.platforms.leetcode?.totalQuestionsSolved || '0'}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-red-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-red-500/20">
                            <div className="flex justify-center">
                                <Code2 className="text-red-400" size={20} />
                            </div>
                            <p className="text-xs mt-1 text-gray-400">Codeforces</p>
                            <p className="font-bold text-white">{user.platforms.codeforces?.maxRating || '0'}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-gray-400/20">
                            <div className="flex justify-center">
                                <Github className="text-gray-300" size={20} />
                            </div>
                            <p className="text-xs mt-1 text-gray-400">GitHub</p>
                            <p className="font-bold text-white">{user.platforms.github?.publicRepos || '0'}</p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-6 pt-4 flex justify-center bg-gray-900">
                    <Button
                        onClick={handleViewProfile}
                        type="button"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                    >
                        View Full Profile
                        <ExternalLink className="ml-2" size={16} />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default PublicUserProfileModal;