import React from 'react';
import { Search, PanelRightIcon } from 'lucide-react';

const TopBar = React.memo(({ isMobile, isRightSidebarOpen, setIsRightSidebarOpen }) => {
    return (
        <div className="bg-gray-800 py-2 px-4 flex items-center justify-between border-b border-gray-700">
            <div className="flex-1 mx-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-gray-700 text-white px-4 py-1 rounded-full text-sm"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
            </div>
            <div className="flex items-center">
                <img src="/api/placeholder/32/32" alt="User" className="w-8 h-8 rounded-full" />
                <span className="ml-2 hidden md:inline text-sm">Mark Wood</span>
            </div>
            {isMobile && (
                <PanelRightIcon
                    className="text-gray-500 cursor-pointer ml-4"
                    onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                    size={18}
                />
            )}
        </div>
    );
});

export default TopBar;