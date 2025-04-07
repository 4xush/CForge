import PropTypes from 'prop-types';
import { Star, TrendingUp} from 'lucide-react';

export const TopUserCard = ({ user, index, isHighlighted, onProfileClick, platform }) => {
    const getPlatformStats = () => {
        if (platform === 'leetcode') {
            return {
                mainStat: user.platforms?.leetcode?.totalQuestionsSolved || 0,
                secondaryStat: user.platforms?.leetcode?.contestRating || 0,
                mainLabel: 'Problems Solved',
                secondaryLabel: 'Contest Rating',
                icon: <Star className="h-5 w-5 text-yellow-500" />,
                username: user.platforms?.leetcode?.username || 'Not Connected'
            };
        } else {
            return {
                mainStat: user.platforms?.codeforces?.currentRating || 0,
                secondaryStat: user.platforms?.codeforces?.contribution || 0,
                mainLabel: 'Current Rating',
                secondaryLabel: 'Contribution',
                icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
                username: user.platforms?.codeforces?.username || 'Not Connected'
            };
        }
    };

    const stats = getPlatformStats();
    const rankIcons = ['🥇', '🥈', '🥉'];

    return (
        <div
            className={`relative p-4 rounded-lg ${isHighlighted ? 'ring-2 ring-blue-500' : 'bg-gray-800'}`}
        >
            <div className="absolute top-2 right-2 text-2xl">
                {rankIcons[index]}
            </div>
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    {stats.icon}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        {user.fullName}
                    </h3>
                    <p className={`text-sm ${stats.username === 'Not Connected' ? 'text-gray-400' : 'text-gray-300'}`}>
                        {stats.username}
                    </p>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{stats.mainLabel}</span>
                    <span className="text-lg font-semibold text-white">
                        {stats.mainStat}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{stats.secondaryLabel}</span>
                    <span className="text-lg font-semibold text-white">
                        {stats.secondaryStat}
                    </span>
                </div>
            </div>
            <button
                onClick={() => onProfileClick(user.username)}
                className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
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
