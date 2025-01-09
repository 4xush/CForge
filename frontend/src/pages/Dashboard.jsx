import { Menu } from 'lucide-react';
import InviteModal from '../components/InviteModal';

const Dashboard = () => {
    return (
        <>
            <div className="flex flex-col h-screen bg-gray-900 text-gray-300">
                <InviteModal />
                {/* Top Navigation Bar for mobile */}
                <div className="flex items-center justify-between p-4 bg-gray-800 md:hidden">
                    <button
                        className="text-white"
                    >
                        <Menu size={20} />
                    </button>
                </div>
                {/* Main Layout */}
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 bg-gray-800 flex items-center justify-center">
                        <h2 className="text-sm text-gray-300">Please select a room from the sidebar</h2>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;

