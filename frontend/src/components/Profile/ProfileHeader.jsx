import { Mail, GitBranch, User, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SocialLinks from './SocialLinks.jsx';


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
        <Card className="w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-700 shadow-xl border-0 overflow-hidden relative">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-0 left-0 w-12 h-12 sm:w-20 sm:h-20 bg-cyan-400 rounded-full filter blur-xl animate-pulse"></div>
                    <div className="absolute top-24 sm:top-40 right-8 sm:right-20 w-16 h-16 sm:w-32 sm:h-32 bg-purple-500 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute bottom-4 sm:bottom-10 left-1/4 sm:left-1/3 w-12 h-12 sm:w-24 sm:h-24 bg-blue-400 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>

            <CardContent className="pt-4 sm:pt-8 pb-4 sm:pb-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-8">
                    <div className="relative group">
                        <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 p-0.5 sm:p-1 shadow-lg shadow-blue-500/30 transition-transform duration-300 hover:scale-105">
                            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden border-2 border-white/20">
                                {user?.profilePicture && (
                                    <img
                                        src={user.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full text-white">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 sm:gap-4 md:gap-0">
                            <div>
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <h2 className="text-lg sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300">
                                        {user?.fullName || 'Unknown User'}
                                    </h2>
                                    <div className={`bg-blue-500/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-blue-400/30 flex items-center ${userTag.color}`}>
                                        <Zap className={`h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 ${userTag.color}`} />
                                        <span className={`text-xs font-medium ${userTag.color}`}>{userTag.label}</span>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-blue-300 sm:mt-1 font-medium">cforge : @{user?.username || 'N/A'}</p>
                            </div>
                            <div className="text-right text-blue-200/80 flex items-center gap-1 sm:gap-2 bg-white/5 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-white/10">
                                <GitBranch className="h-3 w-3 sm:h-4 w-4 text-blue-300" />
                                <span className="text-xs sm:text-sm">
                                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown Date'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-2 sm:mt-4">
                            <SocialLinks socialNetworks={user?.socialNetworks} />
                        </div>
                        <div className="mt-3 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-4 text-gray-200">
                            <div className="flex items-center space-x-1 sm:space-x-2 bg-white/5 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-white/10">
                                <Mail className="h-3 w-3 sm:h-4 w-4 text-blue-300" />
                                <span className="text-xs sm:text-sm">{user?.email || ''}</span>
                            </div>

                            <div className="flex items-center space-x-1 sm:space-x-2 bg-white/5 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-white/10">
                                <User className="h-3 w-3 sm:h-4 w-4 text-blue-300" />
                                <span className="text-xs sm:text-sm">{user?.gender || 'Not specified'}</span>
                            </div>
                        </div>

                    </div>
                </div>
            </CardContent>
        </Card>
    );
};