
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
            <CardContent className="pt-4 sm:pt-6 pb-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="relative group flex-shrink-0">
                        <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 p-0.5 sm:p-1">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                {user?.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Camera className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                            <div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 break-all">{user?.fullName || 'Unknown User'}</h2>
                                    <div className={`bg-blue-500/10 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-blue-400/30 flex items-center ${userTag.color}`}>
                                        <Zap className={`h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 ${userTag.color}`} />
                                        <span className={`text-xs font-medium ${userTag.color}`}>{userTag.label}</span>
                                    </div>
                                    <div className="mt-1 sm:mt-0"><SocialLinks socialNetworks={user?.socialNetworks} /></div>
                                </div>
                                <p className="text-xs sm:text-base text-gray-500 mt-1 break-all">@{user?.username || 'N/A'}</p>
                            </div>
                            <div className="text-left sm:text-right text-gray-600 flex items-center gap-1 sm:gap-2 mt-2 sm:mt-0">
                                <GitBranch className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                <span className="text-xs sm:text-base">
                                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown Date'}
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-gray-600">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                <span className="text-xs sm:text-base break-all">{user?.email || ''}</span>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 bg-blue-500/10 backdrop-blur-sm px-2 sm:px-3 py-0.5 rounded-full border border-white/10">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-300" />
                                <span className="text-xs sm:text-sm">{user?.gender || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};