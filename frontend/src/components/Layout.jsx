import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';

const Layout = () => {
    return (
        <div className="flex h-screen bg-gray-900 text-gray-300">
            <LeftSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
