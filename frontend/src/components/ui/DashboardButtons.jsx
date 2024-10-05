// import React from 'react';
// import { PanelRightIcon } from 'lucide-react';

// const Rooms = () => {
//     return (
//         <div className="flex items-center mb-3 text-purple-500">
//             <PanelRightIcon className="mr-2" size={18} />
//             <span className="text-sm">Rooms</span>
//             <span className="ml-auto bg-green-200 text-xs px-2 rounded-full">08</span>
//         </div>
//     );
// };

// export default Rooms;
// src/components/dashboard-buttons/DashboardButton.jsx
import React from 'react';

const DashboardButton = ({ icon: Icon, label, badge }) => {
    return (
        <div className="flex items-center mb-3 text-blue-200">
            {Icon && <Icon className="mr-2" size={18} />}
            <span className="text-sm">{label}</span>
            {badge && <span className="ml-auto bg-pink-500 text-xs px-2 rounded-full">{badge}</span>}
        </div>
    );
};

export default DashboardButton;

