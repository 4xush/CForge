import React from 'react';
import { useParams } from 'react-router-dom';
import MainContent from '../components/MainContent';
import Chat from '../components/Messages/Chat';

const RoomChat = () => {
    const { roomId } = useParams();

    return (
        <MainContent>
            <Chat roomId={roomId} />
        </MainContent>
    );
};

export default RoomChat;