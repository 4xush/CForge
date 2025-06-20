import { useState, useRef, useEffect } from "react";
import { MoreVertical, LogOut, X, Settings, Info, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import CenteredRoomDetailsModal from "./CenteredRoomDetailsModal";
import RoomSettings from "./RoomSettings";
import ConfirmDialog from "../ui/ConfirmDialog";
import ApiService from "../../services/ApiService";
import toast from "react-hot-toast";
import { useAuthContext } from "../../context/AuthContext";
import { useRoomContext } from "../../context/RoomContext";
import InviteLinkModal from "../InviteRoomJoin/InviteLinkModal";

const TopBar = ({ roomId }) => {
  const navigate = useNavigate();
  const {
    currentRoomDetails,
    currentRoomLoading,
    currentRoomError,
    setCurrentRoomDetails,
    loadCurrentRoomDetails,
    refreshRoomList
  } = useRoomContext();
  const { authUser } = useAuthContext();

  const [activeComponent, setActiveComponent] = useState(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [updatingRoom, setUpdatingRoom] = useState(false);
  const topBarRef = useRef(null);
  const [settingsKey, setSettingsKey] = useState(Date.now());
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState(null);

  const toggleMenu = () => {
    setActiveComponent(activeComponent === "menu" ? null : "menu");
  };

  const handleRoomDetailsClick = () => {
    setActiveComponent("details");
  };

  const handleRoomSettingsClick = () => {
    setActiveComponent("settings");
  };

  const handleLeaveRoomClick = () => {
    setShowLeaveConfirmation(true);
    setActiveComponent(null);
  };

  const handleRoomUpdate = async () => {
    setUpdatingRoom(true);
    try {
      await loadCurrentRoomDetails(roomId);
      setSettingsKey(Date.now());
      toast.success("Room updated successfully and details refreshed");
    } catch (err) {
      console.error("Error triggering room details refetch after update:", err);
      toast.error("Failed to refresh room details after update.");
    } finally {
      setUpdatingRoom(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        event.target.closest('[role="dialog"]') ||
        event.target.closest(".dialog-content") ||
        event.target.closest('[class*="dialog"]') ||
        event.target.closest('[data-radix-popper-content-wrapper]')
      ) {
        return;
      }

      if (topBarRef.current && !topBarRef.current.contains(event.target)) {
        setActiveComponent(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onLeaveRoom = async () => {
    try {
      const response = await ApiService.delete(`/rooms/${roomId}/leave`);
      setShowLeaveConfirmation(false);
      toast.success(response.data.message || "Successfully left the room");
      setCurrentRoomDetails(null);
      // Update room list and cache after leaving
      await refreshRoomList(true); // force refresh from server if online, else update cache
      navigate("/rooms", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave room.");
    }
  };

  const isCurrentUserAdmin = !currentRoomLoading && currentRoomDetails && authUser && currentRoomDetails.admins?.some(
    (admin) => admin.username === authUser.username
  );

  const handleInviteLinkGenerated = (data) => {
    setInviteData(data);
    setIsInviteModalOpen(true);
    setActiveComponent(null);
  };

  const getRoomName = () => {
    if (currentRoomLoading) return "Loading Room...";
    if (currentRoomError) return "Error Loading Room";
    return currentRoomDetails?.name || "Room";
  };

  const getMemberCountText = () => {
    if (currentRoomLoading) return "Loading members...";
    if (currentRoomError) return "Error";
    return `${currentRoomDetails?.members?.length || 0} Members`;
  };

  const formatLastUpdated = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const lastUpdate = new Date(date);
    const diffInDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor((now - lastUpdate) / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor((now - lastUpdate) / (1000 * 60));
        return `${diffInMinutes}m ago`;
      }
      return `${diffInHours}h ago`;
    }
    return `${diffInDays}d ago`;
  };

  const getPlatformUpdateStatus = () => {
    if (currentRoomLoading) return null;
    if (currentRoomError) return null;

    const leetcodeUpdate = currentRoomDetails?.platformStats?.leetcode;
    const codeforcesUpdate = currentRoomDetails?.platformStats?.codeforces;

    const getStatusBadge = (status) => {
      switch (status) {
        case 'updating':
          return <span className="text-yellow-400 text-[9px] sm:text-[10px] bg-yellow-400/10 px-1 sm:px-1.5 py-0.5 rounded">Updating</span>;
        case 'failed':
          return <span className="text-red-400 text-[9px] sm:text-[10px] bg-red-400/10 px-1 sm:px-1.5 py-0.5 rounded">Failed</span>;
        case 'idle':
          return <span className="text-green-400 text-[9px] sm:text-[10px] bg-green-400/10 px-1 sm:px-1.5 py-0.5 rounded">Idle</span>;
        default:
          return null;
      }
    };

    return (
      <div className="flex flex-row items-center space-x-2 text-[10px] sm:text-xs">
        <div className="flex items-center text-gray-400">
          <Clock size={10} className="mr-1 flex-shrink-0" />
          <span className="mr-1 whitespace-nowrap">Last updated:</span>
        </div>
        <div className="flex items-center flex-shrink-0">
          <span className="text-blue-400 mr-1">LC:</span>
          <span className={`mr-1 ${leetcodeUpdate?.updateStatus === 'failed' ? 'text-red-400' : ''}`}>{formatLastUpdated(leetcodeUpdate?.lastUpdated)}</span>
          {getStatusBadge(leetcodeUpdate?.updateStatus)}
        </div>
        <div className="flex items-center flex-shrink-0">
          <span className="text-orange-400 mr-1">CF:</span>
          <span className={`mr-1 ${codeforcesUpdate?.updateStatus === 'failed' ? 'text-red-400' : ''}`}>{formatLastUpdated(codeforcesUpdate?.lastUpdated)}</span>
          {getStatusBadge(codeforcesUpdate?.updateStatus)}
        </div>
        {/* Warning message - hidden on mobile, shown on larger screens */}
        <div className="hidden lg:flex items-center">
          <AlertTriangle size={12} className="mr-1 flex-shrink-0" />
          <span className="text-red-400 text-xsm whitespace-nowrap">
            Leaderboard updates are restricted to one refresh every two days.
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        ref={topBarRef}
        className="bg-gray-800 py-0.5 sm:py-1 px-1.5 sm:px-3 flex items-center justify-between border-b border-gray-700 relative min-h-[32px] sm:min-h-[44px]"
      >
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex flex-row items-center gap-2">
            <h2
              className="text-md sm:text-lg font-bold text-gray-300 cursor-pointer truncate max-w-[90px] sm:max-w-[200px] md:max-w-sm lg:max-w-md mb-0"
              onClick={handleRoomDetailsClick}
              title={currentRoomDetails?.name || ""}
            >
              {getRoomName()}
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
              {getMemberCountText()}
            </p>
          </div>
          <div className="flex flex-row items-center gap-2 mt-0.5">
            {getPlatformUpdateStatus()}
          </div>
        </div>
        <div className="flex-shrink-0">
          {!activeComponent && (
            <button
              onClick={toggleMenu}
              className="text-gray-300 p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label="Open menu"
            >
              <MoreVertical size={16} className="sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* Mobile-optimized dropdown menu */}
        {activeComponent === "menu" && (
          <div className="absolute right-3 sm:right-4 top-12 sm:top-14 w-44 sm:w-48 bg-gray-700 text-gray-300 rounded-lg shadow-lg z-10 border border-gray-600">
            <ul className="py-1">
              <li
                className="px-4 py-3 hover:bg-gray-600 cursor-pointer flex items-center text-sm transition-colors"
                onClick={handleRoomDetailsClick}
              >
                <Info size={16} className="mr-3 flex-shrink-0" />
                Room Details
              </li>
              {isCurrentUserAdmin && (
                <li
                  className="px-4 py-3 hover:bg-gray-600 cursor-pointer flex items-center text-sm transition-colors"
                  onClick={handleRoomSettingsClick}
                >
                  <Settings size={16} className="mr-3 flex-shrink-0" />
                  Settings
                </li>
              )}
              <li
                className="px-4 py-3 hover:bg-gray-600 cursor-pointer text-red-400 flex items-center text-sm transition-colors border-t border-gray-600"
                onClick={handleLeaveRoomClick}
              >
                <LogOut size={16} className="mr-3 flex-shrink-0" />
                Leave Room
              </li>
            </ul>
          </div>
        )}

        {activeComponent === "details" && currentRoomDetails && (
          <CenteredRoomDetailsModal
            roomDetails={currentRoomDetails}
            loading={currentRoomLoading || updatingRoom}
            error={currentRoomError}
            onClose={() => setActiveComponent(null)}
            onInviteLinkGenerated={handleInviteLinkGenerated}
          />
        )}

        {/* Mobile-responsive settings panel */}
        {activeComponent === "settings" && currentRoomDetails && !updatingRoom && (
          <div className="fixed inset-0 sm:right-0 sm:left-auto top-0 h-full w-full sm:w-96 bg-gray-800 text-gray-300 shadow-lg z-20 transition-transform duration-300 ease-in-out transform translate-x-0 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
              <h2 className="text-lg font-bold">Room Settings</h2>
              <button
                onClick={() => setActiveComponent(null)}
                className="text-gray-300 p-1 hover:bg-gray-700 rounded transition-colors"
                aria-label="Close settings"
              >
                <X size={24} />
              </button>
            </div>
            <RoomSettings
              key={settingsKey}
              room={currentRoomDetails}
              onClose={() => setActiveComponent(null)}
              onUpdate={handleRoomUpdate}
            />
          </div>
        )}

        {/* Mobile-responsive updating state */}
        {activeComponent === "settings" && updatingRoom && (
          <div className="fixed inset-0 sm:right-0 sm:left-auto top-0 h-full w-full sm:w-96 bg-gray-800 text-gray-300 shadow-lg z-20 transition-transform duration-300 ease-in-out transform translate-x-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold">Updating Room...</h2>
              <button
                onClick={() => setActiveComponent(null)}
                className="text-gray-300 p-1 hover:bg-gray-700 rounded transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
                <p className="text-sm">Please wait while room settings are being updated...</p>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={showLeaveConfirmation}
          onClose={() => setShowLeaveConfirmation(false)}
          onConfirm={onLeaveRoom}
          title="Leave Room"
          message="Are you sure you want to leave this room?"
        />
      </div>

      {isInviteModalOpen && (
        <InviteLinkModal
          inviteData={inviteData}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </>
  );
};

TopBar.propTypes = {
  roomId: PropTypes.string.isRequired,
};

export default TopBar;