import React from 'react';
// import { useParams } from 'react-router-dom';
import MainContent from '../components/MainContent';
import ChatWithWebSocket from '../components/Messages/ChatWithWebSocket';

const RoomChat = () => {
    // const { roomId } = useParams();
    
    return (
        <MainContent>
            <ChatWithWebSocket />
        </MainContent>
    );
};

export default RoomChat;

