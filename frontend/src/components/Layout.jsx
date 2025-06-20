import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';

const Layout = () => {
    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-300">
            {/* Sidebar Component */}
            <LeftSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Main content with proper top spacing for mobile header */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 pt-0 md:pt-0">
                    <div className="h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;