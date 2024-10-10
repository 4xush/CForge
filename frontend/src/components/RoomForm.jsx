import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateRoomForm from './CreateRoomForm';
import JoinRoomForm from './JoinRoomForm';
import { Button } from './ui/Button';

const RoomFormContainer = ({ onClose, onRoomCreated, onRoomJoined }) => {
    const [isCreateForm, setIsCreateForm] = useState(true);

    const toggleForm = () => {
        setIsCreateForm(!isCreateForm);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex justify-center mb-4">
                <Button
                    onClick={() => setIsCreateForm(true)}
                    className={`mr-2 ${isCreateForm ? 'bg-green-500' : 'bg-gray-500'}`}
                >
                    Create Room
                </Button>
                <Button
                    onClick={() => setIsCreateForm(false)}
                    className={`ml-2 ${!isCreateForm ? 'bg-green-500' : 'bg-gray-500'}`}
                >
                    Join Room
                </Button>
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={isCreateForm ? 'create' : 'join'}
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {isCreateForm ? (
                        <CreateRoomForm onClose={onClose} onRoomCreated={onRoomCreated} />
                    ) : (
                        <JoinRoomForm onClose={onClose} onRoomJoined={onRoomJoined} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default RoomFormContainer;