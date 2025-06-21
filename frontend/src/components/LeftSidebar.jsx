import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PanelRightIcon, SettingsIcon, HelpCircleIcon, LayoutDashboardIcon, MenuIcon, XIcon, MessageCircle } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import DashboardButton from './ui/DashboardButtons';
import RoomList from './Rooms/RoomList';
import UserProfileModal from './UserProfileModal';
import CreateJoinModal from './CreateRoom/CreateJoinRoomModal';
import toast from 'react-hot-toast';

const LeftSidebar = () => {
    const { logout } = useAuthContext();
    const settingsButtonRef = useRef(null);
    const [isRoomFormVisible, setRoomFormVisible] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        toast.success('You have been logged out successfully');
        navigate('/login', {
            replace: true,
            state: {
                message: 'You have been logged out successfully',
                type: 'success'
            }
        });
    };

    const handleRoomCreatedOrJoined = () => {
        setRoomFormVisible(false);
        window.location.reload();
    };

    const isActive = (path) => location.pathname.startsWith(path);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobileMenuOpen && !event.target.closest('.mobile-sidebar') && !event.target.closest('.mobile-menu-button')) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const SidebarContent = ({ isMobile = false }) => (
        <div className="flex flex-col h-full">
            {/* Header with close button for mobile */}
            {isMobile && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <Link
                        to="/?force=true"
                        className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent hover:drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] transition-shadow duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        CForge
                    </Link>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        aria-label="Close menu"
                    >
                        <XIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            )}

            {/* Desktop header */}
            {!isMobile && (
                <Link
                    to="/?force=true"
                    className="text-2xl font-bold mb-8 tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent hover:drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] transition-shadow duration-200"
                >
                    CForge
                </Link>
            )}

            <div className="flex-1 space-y-2">
                <DashboardButton
                    icon={LayoutDashboardIcon}
                    label="Dashboard"
                    isActive={isActive('/dashboard')}
                    onClick={() => navigate('/dashboard')}
                    className="w-full transition-all duration-300 hover:bg-gray-700"
                />
                <DashboardButton
                    icon={PanelRightIcon}
                    label="Rooms"
                    isActive={isActive('/rooms')}
                    onClick={() => navigate('/rooms')}
                    className="w-full transition-all duration-300 hover:bg-gray-700"
                />
                <div className="mt-2">
                    <RoomList setRoomFormVisible={setRoomFormVisible} />
                </div>
                <DashboardButton
                    ref={settingsButtonRef}
                    icon={SettingsIcon}
                    label="Settings"
                    isActive={isActive('/settings')}
                    onClick={() => navigate('/settings')}
                    className="w-full transition-all duration-300 hover:bg-gray-700"
                />
                <DashboardButton
                    icon={HelpCircleIcon}
                    label="Help"
                    isActive={isActive('/help')}
                    onClick={() => navigate('/help')}
                    className="w-full transition-all duration-300 hover:bg-gray-700"
                />
            </div>
            <div className="mt-auto pt-4 border-t border-gray-700">
                <div className="mt-4 mb-2 flex items-center justify-center">
                    <button
                        onClick={() => navigate('/reviews')}
                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors focus:outline-none"
                        style={{ fontWeight: 500 }}
                    >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Give us feedback
                    </button>
                </div>
                <UserProfileModal onLogout={handleLogout} />
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Header with Hamburger Menu */}
            <div className="md:hidden bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between w-full z-40">
                <div className="flex items-center gap-2 w-full">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="mobile-menu-button p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        aria-label="Open menu"
                    >
                        <MenuIcon className="w-6 h-6 text-gray-300" />
                    </button>
                    <Link
                        to="/?force=true"
                        className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
                    >
                        CForge
                    </Link>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="w-64 bg-gray-800 p-3 flex-col justify-between hidden md:flex border-r border-gray-700 relative h-full overflow-y-auto shadow-lg">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar Overlay - always rendered for smooth transition */}
            <div
                className={`fixed inset-0 z-50 md:hidden flex transition-opacity duration-300 ${isMobileMenuOpen ? 'bg-black bg-opacity-50 pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
                style={{ transitionProperty: 'opacity, background-color' }}
            >
                <div
                    className={`mobile-sidebar w-80 max-w-[85vw] h-full p-4 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto rounded-r-xl
                        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                        bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800`}
                >
                    <SidebarContent isMobile={true} />
                </div>
            </div>

            {/* Room Creation/Join Modal */}
            {isRoomFormVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="relative w-full max-w-lg mx-4">
                        <CreateJoinModal
                            onClose={() => setRoomFormVisible(false)}
                            onRoomCreated={handleRoomCreatedOrJoined}
                            onRoomJoined={handleRoomCreatedOrJoined}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default LeftSidebar;