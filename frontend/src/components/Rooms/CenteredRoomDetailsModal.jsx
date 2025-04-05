import { useState } from "react";
import { X } from "lucide-react";
import RoomDetails from "./RoomDetails"; // Adjust the import path as needed
import PropTypes from "prop-types";

const CenteredRoomDetailsModal = ({ roomDetails, loading, error, onClose, onInviteLinkGenerated }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  // Clean and compact professional styling with Tailwind CSS
  const modalStyle = {
    container: "fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-2",
    content: "bg-gray-800 border border-gray-700 rounded-lg px-2 py-4 w-full max-w-lg shadow-lg transform transition-all duration-300 ease-in-out",
    header: "flex justify-between items-center mb-3 border-b border-gray-600 pb-1",
    title: "text-xl font-semibold text-white",
    closeButton: "text-gray-400 hover:text-white transition-colors",
    body: "text-gray-300 space-y-3 overflow-y-auto max-h-[75vh]",
  };

  if (!isOpen) return null;

  return (
    <div className={modalStyle.container}>
      <div className={modalStyle.content}>
        <div className={modalStyle.header}>
          <h2 className={modalStyle.title}>Room Details</h2>
          <button
            onClick={handleClose}
            className={modalStyle.closeButton}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className={modalStyle.body}>
          <RoomDetails
            roomDetails={roomDetails}
            loading={loading}
            error={error}
            onInviteLinkGenerated={onInviteLinkGenerated}
          />
        </div>
      </div>
    </div>
  );
};

CenteredRoomDetailsModal.propTypes = {
  roomDetails: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func,
  onInviteLinkGenerated: PropTypes.func,
};

export default CenteredRoomDetailsModal;