import { forwardRef } from 'react';
import PropTypes from 'prop-types';

const DashboardButton = forwardRef(({ icon: Icon, label, badge, isActive, onClick }, ref) => {
    return (
        <button
            ref={ref}
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-4 rounded-lg transition-colors duration-200 
        ${isActive
                    ? 'bg-gray-700 text-purple-400'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{label}</span>
                </div>
                {badge && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded-full">
                        {badge}
                    </span>
                )}
            </div>
        </button>
    );
});
DashboardButton.displayName = 'DashboardButton';

DashboardButton.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isActive: PropTypes.bool,
    onClick: PropTypes.func,
};

export default DashboardButton;