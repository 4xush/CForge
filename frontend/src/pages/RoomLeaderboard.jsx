import React from 'react';
import { useParams } from 'react-router-dom';
import MainContent from '../components/MainContent';
import Leaderboard from '../components/Leaderboard/CodingLeaderboard';
import { useRoomContext } from '../context/RoomContext';

const RoomLeaderboard = () => {
    const { roomId } = useParams();
    const { selectedRoom } = useRoomContext();
    const isMobile = window.innerWidth < 768; // You might want to use a custom hook for this

    return (
        <MainContent>
            <Leaderboard selectedRoom={{ id: roomId }} isMobile={isMobile} />
        </MainContent>
    );
};

export default RoomLeaderboard;

