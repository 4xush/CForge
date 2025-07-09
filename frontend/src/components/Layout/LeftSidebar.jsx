import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  PanelRightIcon,
  SettingsIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  MessageCircle,
  TrophyIcon,
  Code2,
} from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import DashboardButton from "../ui/DashboardButtons";
import RoomList from "../Rooms/RoomList";
import UserProfileModal from "./UserMiniProfileModal";
import CreateJoinModal from "../CreateRoom/CreateJoinRoomModal";
import WideMenuIcon from "../ui/WideMenuIcon";
import usePendingReminders from "../../hooks/usePendingReminders";

const LeftSidebar = () => {
  const { logout } = useAuthContext();
  const settingsButtonRef = useRef(null);
  const [isRoomFormVisible, setRoomFormVisible] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount, error } = usePendingReminders();

  const handleLogout = () => {
    logout();
    navigate("/login", {
      replace: true,
      state: {
        message: "You have been logged out successfully",
        type: "success",
      },
    });
  };

  const handleRoomCreatedOrJoined = (roomDetails) => {
    setRoomFormVisible(false);

    if (roomDetails && roomDetails.roomId) {
      // Navigate to the newly created/joined room
      navigate(`/rooms/${roomDetails.roomId}/leaderboard`);
    } else {
      // Fallback: navigate to rooms page
      navigate("/rooms");
    }
  };

  const isActive = (path) => location.pathname.startsWith(path);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        !event.target.closest(".mobile-sidebar") &&
        !event.target.closest(".mobile-menu-button")
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const LogoWithTitle = ({ onClick }) => (
    <div
      className="flex items-center gap-1 cursor-pointer select-none"
      onClick={onClick}
    >
      <img
        src="/cforge.png"
        alt="CForge Icon"
        className="h-5 w-5 sm:h-5.5 sm:w-5.5 rounded-full"
      />
      <span className="text-base font-bold tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
        CForge
      </span>
    </div>
  );

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Top non-scrollable or logo section */}
      {isMobile ? (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
          <LogoWithTitle onClick={() => setMobileMenuOpen(false)} />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          ></button>
        </div>
      ) : (
        <div className="pl-2">
          <LogoWithTitle onClick={() => navigate("/?force=true")} />
          <hr className="my-2 border-t border-gray-700" />
        </div>
      )}

      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <DashboardButton
          icon={LayoutDashboardIcon}
          label="Dashboard"
          isActive={isActive("/dashboard")}
          onClick={() => navigate("/dashboard")}
          className="w-full transition-all duration-300 hover:bg-gray-700"
        />
        <DashboardButton
          icon={Code2}
          label="LeetCode Tracker"
          badge={!error && pendingCount > 0 ? pendingCount : null}
          isActive={isActive("/leetcode-tracker")}
          onClick={() => navigate("/leetcode-tracker")}
          className="w-full transition-all duration-300 hover:bg-gray-700"
        />
        <div>
          <DashboardButton
            icon={PanelRightIcon}
            label="Rooms"
            isActive={isActive("/rooms")}
            onClick={() => navigate("/rooms")}
            className="w-full transition-all duration-300 hover:bg-gray-700"
          />
          <div className="mt-2">
            <RoomList setRoomFormVisible={setRoomFormVisible} />
          </div>
        </div>
        <DashboardButton
          icon={TrophyIcon}
          label="Contest Central"
          isActive={isActive("/contest-central")}
          onClick={() => navigate("/contest-central")}
        />
        <DashboardButton
          ref={settingsButtonRef}
          icon={SettingsIcon}
          label="Settings"
          isActive={isActive("/settings")}
          onClick={() => navigate("/settings")}
          className="w-full transition-all duration-300 hover:bg-gray-700"
        />
        <DashboardButton
          icon={HelpCircleIcon}
          label="Help"
          isActive={isActive("/help")}
          onClick={() => navigate("/help")}
          className="w-full transition-all duration-300 hover:bg-gray-700"
        />
      </div>

      {/* Fixed footer */}
      <div className="pt-2 border-t border-gray-700">
        <div className="mb-2 flex items-center justify-center">
          <button
            onClick={() => navigate("/reviews")}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors focus:outline-none font-medium"
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
            className="mobile-menu-button p-2 rounded-lg  transition-colors"
            aria-label="Open menu"
          >
            <WideMenuIcon className="text-gray-300" isOpen={isMobileMenuOpen} />
          </button>
          <Link
            to="/?force=true"
            className="flex items-center gap-1 group"
            style={{ textDecoration: "none" }}
          >
            <img
              src="/cforge.png"
              alt="CForge Icon"
              className="h-5 w-5 sm:h-6 sm:w-6 rounded-full"
            />
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              CForge
            </span>
          </Link>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="w-[18rem] bg-gray-800 p-3 flex-col justify-between hidden md:flex border-r border-gray-700 relative h-full overflow-y-auto shadow-lg">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay - always rendered for smooth transition */}
      <div
        className={`fixed inset-0 z-50 md:hidden flex transition-opacity duration-300 ${
          isMobileMenuOpen
            ? "bg-black bg-opacity-50 pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{ transitionProperty: "opacity, background-color" }}
      >
        <div
          className={`mobile-sidebar w-80 max-w-[85vw] h-full p-4 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto rounded-r-xl
                        ${
                          isMobileMenuOpen
                            ? "translate-x-0"
                            : "-translate-x-full"
                        }
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
