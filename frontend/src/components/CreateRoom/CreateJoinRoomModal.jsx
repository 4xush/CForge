import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X } from 'lucide-react';
import CreateRoomForm from './CreateRoomForm';
import JoinRoomForm from './JoinRoomForm';

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
};

const RoomModal = ({ onClose, onRoomCreated, onRoomJoined }) => {
    const [activeTab, setActiveTab] = useState('create');
    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={modalVariants}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-md overflow-hidden"
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
                        <div className="flex items-center space-x-2">
                            <Terminal className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                            <h2 className="text-lg sm:text-xl font-bold text-white">Room Management</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-4 sm:p-6">
                        {activeTab !== 'success' && (
                            <div className="flex space-x-2 sm:space-x-4 mb-4 sm:mb-6">
                                <button
                                    className={`flex-1 py-2 px-2 sm:px-4 rounded-lg transition-all transform hover:scale-105 ${activeTab === 'create'
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    onClick={() => setActiveTab('create')}
                                >
                                    Create Room
                                </button>
                                <button
                                    className={`flex-1 py-2 px-2 sm:px-4 rounded-lg transition-all transform hover:scale-105 ${activeTab === 'join'
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    onClick={() => setActiveTab('join')}
                                >
                                    Join Room
                                </button>
                            </div>
                        )}

                        {/* Create Room Form */}
                        {activeTab === 'create' && (
                            <CreateRoomForm
                                onClose={onClose}
                                onRoomCreated={onRoomCreated}
                            />
                        )}

                        {/* Join Room Form */}
                        {activeTab === 'join' && (
                            <JoinRoomForm
                                onClose={onClose}
                                onRoomJoined={onRoomJoined}
                            />
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
export default RoomModal;