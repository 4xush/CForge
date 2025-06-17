import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
                    setUser(response.data.user); // extract nested user
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
                <Card className="w-full max-w-md bg-gray-900/80 text-gray-100 rounded-xl shadow-2xl p-6 text-center border border-gray-700/30">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-300 font-medium">Loading profile...</p>
                    </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300">
            <Card className="w-full max-w-md bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-lg text-gray-100 rounded-2xl shadow-2xl border border-gray-700/30 overflow-hidden relative">
                {/* Subtle glowing accent */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800/50 transition-all duration-200"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                <CardHeader className="flex flex-col items-center p-8 pb-6">
                    <div className="relative mb-4">
                        <Avatar className="h-24 w-24 ring-2 ring-blue-500/70 shadow-lg shadow-blue-500/20">
                            <img
                                src={user.profilePicture || '/default-avatar.png'}
                                alt={user.username}
                                className="h-full w-full object-cover rounded-full"
                            />
                        </Avatar>
                        {user.platforms.leetcode && (
                            <Badge className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-semibold px-3 py-1 shadow-lg">
                                {user.platforms.leetcode?.contestRating || '0'}
                            </Badge>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-white mt-2">{user.displayName || user.username}</h2>
                    <p className="text-blue-400 font-medium">@{user.username}</p>
                    {/* 
                    {user.bio && (
                        <div className="mt-4 px-6 py-3 bg-gray-800/50 border border-gray-700/30 rounded-lg text-sm text-gray-300 italic">
                            "{user.bio}"
                        </div>
                    )} */}
                </CardHeader>

                <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/30 hover:border-yellow-400/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-yellow-500/10 group">
                            <div className="flex justify-center">
                                <Code2 className="text-yellow-400 group-hover:text-yellow-300 transition-colors" size={22} />
                            </div>
                            <p className="text-xs mt-2 text-gray-400 group-hover:text-gray-300">LeetCode</p>
                            <p className="font-bold text-lg text-white mt-1">{user.platforms.leetcode?.totalQuestionsSolved || '0'}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/30 hover:border-red-400/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-red-500/10 group">
                            <div className="flex justify-center">
                                <Code2 className="text-red-400 group-hover:text-red-300 transition-colors" size={22} />
                            </div>
                            <p className="text-xs mt-2 text-gray-400 group-hover:text-gray-300">Codeforces</p>
                            <p className="font-bold text-lg text-white mt-1">{user.platforms.codeforces?.maxRating || '0'}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/30 hover:border-gray-300/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-gray-400/10 group">
                            <div className="flex justify-center">
                                <Github className="text-gray-300 group-hover:text-white transition-colors" size={22} />
                            </div>
                            <p className="text-xs mt-2 text-gray-400 group-hover:text-gray-300">GitHub</p>
                            <p className="font-bold text-lg text-white mt-1">{user.platforms.github?.publicRepos || '0'}</p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-6 pt-4 bg-gray-900/20 backdrop-blur-sm rounded-b-xl">
                    <Button
                        onClick={handleViewProfile}
                        type="button"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                    >
                        View Full Profile
                        <ExternalLink className="ml-2" size={18} />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};
PublicUserProfileModal.propTypes = {
    username: PropTypes.string,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default PublicUserProfileModal;