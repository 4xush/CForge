import { useState, useRef, useEffect } from "react";
import { MoreVertical, LogOut, X, Settings } from "lucide-react";
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
    setCurrentRoomDetails
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

  const handleRoomUpdate = async (updatedRoomData) => {
    setUpdatingRoom(true);
    try {
      setCurrentRoomDetails(updatedRoomData);
      setSettingsKey(Date.now());
      toast.success("Room updated successfully");
    } catch (err) {
      console.error("Error updating room display:", err);
      toast.error("Error updating room display");
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

  // Debug code - uncomment if needed to debug state issues
  // const roomDetailsId = currentRoomDetails?._id || currentRoomDetails?.id || 'none';
  // const roomDetailsAdminCount = currentRoomDetails?.admins?.length || 0;
  // console.log(`TopBar rendering for room: ${roomId}, details: ${roomDetailsId}, admins: ${roomDetailsAdminCount}`);

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
          <p className="text-xs text-gray-500">
            {getMemberCountText()}
          </p>
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
                className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer"
                onClick={handleRoomDetailsClick}
              >
                Room Details
              </li>
              {isCurrentUserAdmin && (
                <li
                  className="px-4 py-2 hover:bg-gray-600 rounded cursor-pointer"
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