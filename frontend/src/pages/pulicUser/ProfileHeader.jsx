import React from 'react';
import { Camera, Mail, GitBranch, User, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SocialLinks from '@/components/Profile/SocialLinks';

const getUserTag = (totalQuestions) => {
    if (totalQuestions >= 1000) {
        return { label: 'Master', color: 'text-red-500' };
    } else if (totalQuestions >= 500) {
        return { label: 'Pro', color: 'text-cyan-300' };
    } else if (totalQuestions >= 100) {
        return { label: 'Intermediate', color: 'text-yellow-300' };
    } else if (totalQuestions >= 10) {
        return { label: 'Newbie', color: 'text-green-300' };
    } else {
        return { label: 'Beginner', color: 'text-gray-300' };
    }
};

export const ProfileHeader = ({ user }) => {
    const leetcodeTotalQuestions = user?.platforms.leetcode.totalQuestionsSolved || 0;
    const userTag = getUserTag(leetcodeTotalQuestions);

    return (
        <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 p-1">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                {user?.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Camera className="h-12 w-12 text-gray-400" />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-bold text-gray-900">{user?.fullName || 'Unknown User'}</h2>
                                    <div className={`bg-blue-500/10 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-400/30 flex items-center ${userTag.color}`}>
                                        <Zap className={`h-3.5 w-3.5 mr-1.5 ${userTag.color}`} />
                                        <span className={`text-xs font-medium ${userTag.color}`}>{userTag.label}</span>
                                    </div>
                                    <SocialLinks socialNetworks={user?.socialNetworks} />
                                </div>
                                <p className="text-gray-500 mt-1">@{user?.username || 'N/A'}</p>
                            </div>
                            <div className="text-right text-gray-600 flex items-center gap-2">
                                <GitBranch className="h-4 w-4 text-gray-500" />
                                <span>
                                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown Date'}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center space-x-4 text-gray-600">
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{user?.email || ''}</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-blue-500/10 backdrop-blur-sm px-3 py-0.5 rounded-full border border-white/10">
                                <User className="h-4 w-4 text-blue-300" />
                                <span className="text-sm">{user?.gender || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};