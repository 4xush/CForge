import { useState, useRef, useEffect } from "react";
import { MoreVertical, LogOut, X, Settings, Info, Clock } from "lucide-react";
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
    loadCurrentRoomDetails
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
          return <span className="text-yellow-400 text-[10px] bg-yellow-400/10 px-1.5 py-0.5 rounded">Updating</span>;
        case 'failed':
          return <span className="text-red-400 text-[10px] bg-red-400/10 px-1.5 py-0.5 rounded">Failed</span>;
        case 'idle':
          return <span className="text-green-400 text-[10px] bg-green-400/10 px-1.5 py-0.5 rounded">Idle</span>;
        default:
          return null;
      }
    };
    
    return (
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center text-gray-400">
          <Clock size={12} className="mr-1" />
          <span className="mr-1">Last updated :</span>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-blue-400 mr-1">LC:</span>
              <span className={leetcodeUpdate?.updateStatus === 'failed' ? 'text-red-400' : ''}>
                {formatLastUpdated(leetcodeUpdate?.lastUpdated)}
              </span>
              {getStatusBadge(leetcodeUpdate?.updateStatus)}
            </div>
            <div className="flex items-center">
              <span className="text-orange-400 mr-1">CF:</span>
              <span className={codeforcesUpdate?.updateStatus === 'failed' ? 'text-red-400' : ''}>
                {formatLastUpdated(codeforcesUpdate?.lastUpdated)}
              </span>
              {getStatusBadge(codeforcesUpdate?.updateStatus)}
            </div>
            <div className="flex items-center">
              <span className="mr-1"> Update Stats (only if last update is older than 2 days)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        ref={topBarRef}
        className="bg-gray-800 py-0.75 px-4 flex items-center justify-between border-b border-gray-700 relative"
      >
        <div>
          <h2
            className="text-lg font-bold text-gray-300 cursor-pointer truncate max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md"
            onClick={handleRoomDetailsClick}
            title={currentRoomDetails?.name || ""}
          >
            {getRoomName()}
          </h2>
          <div className="flex items-center space-x-4">
            <p className="text-xs text-gray-500">
              {getMemberCountText()}
            </p>
            {getPlatformUpdateStatus()}
          </div>
        </div>

        {!activeComponent && (
          <button onClick={toggleMenu} className="text-gray-300">
            <MoreVertical size={24} />
          </button>
        )}

        {activeComponent === "menu" && (
          <div className="absolute right-4 top-12 w-40 bg-gray-700 text-gray-300 rounded-lg shadow-lg z-10">
            <ul>
              <li
                className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer flex items-center"
                onClick={handleRoomDetailsClick}
              >
                <Info size={16} className="inline mr-2" />
                Room Details
              </li>
              {isCurrentUserAdmin && (
                <li
                  className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer flex items-center"
                  onClick={handleRoomSettingsClick}
                >
                  <Settings size={16} className="inline mr-2" />
                  Settings
                </li>
              )}
              <li
                className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer text-red-400 flex items-center"
                onClick={handleLeaveRoomClick}
              >
                <LogOut size={16} className="mr-2" />
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

        {activeComponent === "settings" && currentRoomDetails && !updatingRoom && (
          <div className="fixed right-0 top-0 h-full w-auto bg-gray-800 text-gray-300 shadow-lg z-20 transition-transform duration-300 ease-in-out transform translate-x-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold">Room Settings</h2>
              <button
                onClick={() => setActiveComponent(null)}
                className="text-gray-300"
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

        {activeComponent === "settings" && updatingRoom && (
          <div className="fixed right-0 top-0 h-full w-auto bg-gray-800 text-gray-300 shadow-lg z-20 transition-transform duration-300 ease-in-out transform translate-x-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold">Updating Room...</h2>
              <button
                onClick={() => setActiveComponent(null)}
                className="text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <p>Please wait while room settings are being updated...</p>
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