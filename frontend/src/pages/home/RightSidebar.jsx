import React from 'react';
import { Plus } from 'lucide-react';

const RightSidebar = React.memo(({ isMobile, isRightSidebarOpen }) => {
    if (isMobile && !isRightSidebarOpen) return null;

    return (
        <div className={`w-full md:w-56 bg-gray-800 p-3 border-l border-gray-700 ${isMobile ? 'absolute right-0 top-0 h-full transition-transform duration-300 ease-in-out transform ' + (isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full') : ''}`}>
            <ChannelInfo />
            <GroupMembers />
        </div>
    );
});

const ChannelInfo = React.memo(() => (
    <>
        <div className="bg-purple-600 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-3">
            #
        </div>
        <h2 className="text-lg mb-2">Code Sometimes</h2>
        <p className="text-xs mb-3">15 Members</p>
        <p className="text-xs mb-3">
            This channel is your space to collaborate, brainstorm, and discuss all things design-related with your fellow...
            <span className="text-blue-500 ml-1 cursor-pointer">More</span>
        </p>
    </>
));

const GroupMembers = React.memo(() => (
    <>
        <h3 className="text-sm font-semibold mb-2">Group Members</h3>
        {['Person1', 'Person2'].map((name, index) => (
            <div key={index} className="flex items-center mb-2">
                <img src="/api/placeholder/20/20" alt={name} className="w-5 h-5 rounded-full mr-2" />
                <span className="text-xs">{name}</span>
            </div>
        ))}
        <button className="mt-3 flex items-center text-orange-500 text-sm">
            <Plus className="mr-2" size={16} />
            Invite
        </button>
    </>
));

export default RightSidebar;