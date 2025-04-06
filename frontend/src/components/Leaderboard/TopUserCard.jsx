import { UserStats } from './UserStats';
import PropTypes from 'prop-types';
import { ArrowUpRight } from 'lucide-react';
export const TopUserCard = ({ user, index, isHighlighted, onProfileClick }) => {
    return (
        <div className={`bg-gray-800 p-4 rounded-lg flex flex-col items-center transition-colors duration-300
      ${isHighlighted ? 'ring-2 ring-blue-500 bg-gray-700' : ''}`}
        >
            <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center">
                    <div className="relative group" >
                        <img
                            src={user.profilePicture || "/default-avatar.png"}
                            alt={user.fullName}
                            className="w-8 h-8 bg-gray-700 rounded-full mr-3 object-cover cursor-pointer border border-gray-600 group-hover:border-blue-500 transition-all"
                            onClick={() => onProfileClick(user.username)}
                        />
                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="h-3 w-3 text-blue-400" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">
                            {user.fullName}
                        </h3>
                        <p className="text-gray-400 text-xs">@{user.platforms.leetcode.username}</p>
                    </div>
                </div>
                <span className="text-xl font-bold">#{index + 1}</span>
            </div>
            <UserStats user={user} />
        </div>
    );
};

TopUserCard.propTypes = {
    user: PropTypes.shape({
        profilePicture: PropTypes.string,
        fullName: PropTypes.string.isRequired,
        username: PropTypes.string,
        platforms: PropTypes.shape({
            leetcode: PropTypes.shape({
                username: PropTypes.string.isRequired,
            }).isRequired,
        }).isRequired,
    }).isRequired,
    index: PropTypes.number.isRequired,
    isHighlighted: PropTypes.bool,
    onProfileClick: PropTypes.func.isRequired,
};