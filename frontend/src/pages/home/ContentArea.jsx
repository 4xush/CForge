import React from 'react';
import { Search } from 'lucide-react';
import Leaderboard from '../../components/Leaderboard';
import Chat from '../components/dashboard-buttons/Chat';

const ContentArea = React.memo(({ activeTab, setActiveTab, isMobile }) => {
    return (
        <div className="flex-1 flex flex-col bg-gray-900">
            <Header isMobile={isMobile} />
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <Content activeTab={activeTab} isMobile={isMobile} />
        </div>
    );
});
const Header = React.memo(({ isMobile }) => (
    <div className="bg-gray-800 py-2 px-4 flex items-center justify-between border-b border-gray-700">
        <div>
            <h2 className="text-lg font-bold text-gray-300">CODE SOMETIMES</h2>
            <p className="text-xs text-gray-500">15 Members</p>
        </div>
        <div className="flex items-center">
            <Search className="mr-4 text-gray-500" size={18} />
        </div>
    </div>
));

const Tabs = React.memo(({ activeTab, setActiveTab }) => (
    <div className="flex border-b border-gray-700">
        <TabButton
            label="Leaderboard"
            isActive={activeTab === 'leaderboard'}
            onClick={() => setActiveTab('leaderboard')}
        />
        <TabButton
            label="Chat"
            isActive={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
        />
    </div>
));

const TabButton = React.memo(({ label, isActive, onClick }) => (
    <button
        className={`px-4 py-1 text-sm ${isActive ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
        onClick={onClick}
    >
        {label}
    </button>
));

const Content = React.memo(({ activeTab, isMobile }) => (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
        {activeTab === 'leaderboard' ? <Leaderboard isMobile={isMobile} /> : <Chat />}
    </div>
));

export default ContentArea;