import { useState } from "react";
import {
  Plus,
  Users,
  Calendar,
  Lock,
  Unlock,
} from "lucide-react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import ApiService from "../../services/ApiService.js";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

const RoomDetails = ({ roomDetails, loading, error, onInviteLinkGenerated }) => {
  const { authUser } = useAuthContext();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  const handleInviteClick = async () => {
    try {
      setIsGeneratingLink(true);
      const response = await ApiService.post(
        `/rooms/admin/${roomDetails.roomId}/invite`
      );

      if (response.data.success) {
        onInviteLinkGenerated(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to generate invite link");
      }
    } catch (error) {
      console.error("Error generating invite link:", error);
      toast.error("Failed to generate invite link. Please try again.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="text-gray-300 p-3">Loading...</div>;
  if (error) return <div className="text-red-500 p-3">{error}</div>;
  if (!roomDetails)
    return <div className="text-gray-300 p-3">No room details available</div>;

  const isCurrentUserAdmin = roomDetails.admins.some(
    (admin) => admin.username === authUser.username
  );

  // Combine admins and members, prioritizing admins
  const allMembers = [
    ...roomDetails.admins.map((admin) => ({ ...admin, isAdmin: true })),
    ...roomDetails.members
      .filter((member) => !roomDetails.admins.some((admin) => admin._id === member._id))
      .map((member) => ({ ...member, isAdmin: false })),
  ];
  const displayMembers = showAllMembers ? allMembers : allMembers.slice(0, 5);

  return (
    <div className="p-5 h-full overflow-y-auto">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-3 mb-3">
        <div className="bg-white bg-opacity-20 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold mb-2 mx-auto">
          #
        </div>
        <h2 className="text-xl font-bold text-center mb-1">
          {roomDetails.name}
        </h2>
        <p className="text-sm font-bold text-center">@{roomDetails.roomId}</p>
        <p className="text-sm text-center mb-2">{roomDetails.description}</p>
        <div className="flex justify-center items-center">
          {roomDetails.isPublic ? (
            <span className="flex items-center text-xs bg-green-500 text-white px-2 py-1 rounded">
              <Unlock size={12} className="mr-1" /> Public
            </span>
          ) : (
            <span className="flex items-center text-xs bg-yellow-500 text-white px-2 py-1 rounded">
              <Lock size={12} className="mr-1" /> Private
            </span>
          )}
        </div>
      </div>

      <div className="bg-gray-700 rounded-lg p-3 mb-3">
        <h3 className="text-md font-semibold mb-2 flex items-center">
          <Calendar size={16} className="mr-2" /> Created
        </h3>
        <p className="text-sm">{formatDate(roomDetails.createdAt)}</p>
        <p className="text-sm mt-1">by {roomDetails.createdBy}</p>
      </div>

      <div className="bg-gray-700 rounded-lg p-3 mb-3">
        <h3 className="text-md font-semibold mb-2 flex items-center">
          <Users size={16} className="mr-2" /> Members ({allMembers.length})
        </h3>
        <div className="space-y-2">
          {displayMembers.map((member) => (
            <div key={member._id} className="flex items-center">
              <img
                src={member.profilePicture || "/placeholder.svg"}
                alt={member.username}
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="text-sm">
                {member.username} {member.isAdmin && <span className="text-xs text-blue-400">(Admin)</span>}
              </span>
            </div>
          ))}
          {allMembers.length > 5 && !showAllMembers && (
            <button
              onClick={() => setShowAllMembers(true)}
              className="text-sm text-blue-400 hover:text-blue-300 mt-2"
            >
              View All
            </button>
          )}
          {showAllMembers && (
            <button
              onClick={() => setShowAllMembers(false)}
              className="text-sm text-blue-400 hover:text-blue-300 mt-2"
            >
              Show Less
            </button>
          )}
        </div>
      </div>

      {isCurrentUserAdmin && (
        <div className="space-y-2 mt-3">
          <button
            onClick={handleInviteClick}
            disabled={isGeneratingLink}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-not-allowed text-white font-bold py-2 px-2 rounded flex items-center justify-center transition duration-300"
          >
            {isGeneratingLink ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </span>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Invite Link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

RoomDetails.propTypes = {
  roomDetails: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onInviteLinkGenerated: PropTypes.func,
};

export default RoomDetails;