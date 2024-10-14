import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateRoomForm from './CreateRoomForm';
import JoinRoomForm from './JoinRoomForm';
import { Button } from './ui/Button';

const RoomFormContainer = ({ onClose, onRoomCreated, onRoomJoined }) => {
    const [isCreateForm, setIsCreateForm] = useState(true);
    const [isVisible, setIsVisible] = useState(true); // Track form visibility

    const toggleForm = () => {
        setIsCreateForm(!isCreateForm);
    };

    // Function to handle form close with animation
    const handleClose = () => {
        setIsVisible(false); // Trigger exit animation
        setTimeout(() => {
            onClose(); // Actually close the form after animation completes
        }, 500); // Ensure this timeout matches the animation duration
    };

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    key="formContainer"
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 300, opacity: 0 }} // Slide down animation on exit
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="flex justify-center mb-4">
                        <Button
                            onClick={() => setIsCreateForm(true)}
                            className={`mr-2 px-6 py-2 rounded-full transition-colors duration-300 ${isCreateForm ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Create Room
                        </Button>
                        <Button
                            onClick={() => setIsCreateForm(false)}
                            className={`mr-2 px-6 py-2 rounded-full transition-colors duration-300 ${!isCreateForm ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Join Room
                        </Button>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isCreateForm ? 'create' : 'join'}
                            initial={{ y: 300, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -300, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            {isCreateForm ? (
                                <CreateRoomForm onClose={handleClose} onRoomCreated={onRoomCreated} />
                            ) : (
                                <JoinRoomForm onClose={handleClose} onRoomJoined={onRoomJoined} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RoomFormContainer;
