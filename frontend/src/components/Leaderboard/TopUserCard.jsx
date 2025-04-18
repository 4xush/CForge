import PropTypes from 'prop-types';
import { Star, TrendingUp } from 'lucide-react';

export const TopUserCard = ({ user, index, isHighlighted, onProfileClick, platform }) => {
    const getPlatformStats = () => {
        if (platform === 'leetcode') {
            return {
                mainStat: user.platforms?.leetcode?.totalQuestionsSolved || 0,
                secondaryStat: user.platforms?.leetcode?.contestRating || 0,
                tertiaryStat: user.platforms?.leetcode?.attendedContestsCount || 0,
                mainLabel: 'Problems Solved',
                secondaryLabel: 'Contest Rating',
                tertiaryLabel: 'Contests',
                icon: <Star className="h-4 w-4 text-yellow-500" />,
                username: user.platforms?.leetcode?.username || 'Not Connected'
            };
        } else {
            return {
                mainStat: user.platforms?.codeforces?.currentRating || 0,
                secondaryStat: user.platforms?.codeforces?.contribution || 0,
                tertiaryStat: user.platforms?.codeforces?.maxRating || 0,
                mainLabel: 'Current Rating',
                secondaryLabel: 'Contribution',
                tertiaryLabel: 'Max Rating',
                icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
                username: user.platforms?.codeforces?.username || 'Not Connected'
            };
        }
    };

    const stats = getPlatformStats();
    const rankIcons = ['🥇', '🥈', '🥉'];

    return (
        <div
            className={`relative p-3 rounded-lg ${isHighlighted ? 'ring-2 ring-blue-500' : 'bg-gray-800'}`}
        >
            <div className="absolute top-1 right-1 text-xl">
                {rankIcons[index]}
            </div>
            <div className="flex items-center space-x-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    {stats.icon}
                </div>
                <div>
                    <h3 className="text-base font-semibold text-white">
                        {user.fullName}
                    </h3>
                    <p className={`text-xs ${stats.username === 'Not Connected' ? 'text-gray-400' : 'text-gray-300'}`}>
                        {stats.username}
                    </p>
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">{stats.mainLabel}</span>
                    <span className="text-base font-semibold text-white">
                        {stats.mainStat}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">{stats.secondaryLabel}</span>
                    <span className="text-base font-semibold text-white">
                        {stats.secondaryStat}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">{stats.tertiaryLabel}</span>
                    <span className="text-base font-semibold text-white">
                        {stats.tertiaryStat}
                    </span>
                </div>
            </div>
            <button
                onClick={() => onProfileClick(user.username)}
                className="mt-3 w-full py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-xs transition-colors"
            >
                View Profile
            </button>
        </div>
    );
};

TopUserCard.propTypes = {
    user: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    isHighlighted: PropTypes.bool,
    onProfileClick: PropTypes.func.isRequired,
    platform: PropTypes.oneOf(['leetcode', 'codeforces']).isRequired
};