import React from 'react';
import { useParams } from 'react-router-dom';
import MainContent from '../components/MainContent';
import Leaderboard from '../components/Leaderboard/CodingLeaderboard';

const RoomLeaderboard = () => {
    const { roomId } = useParams();
    return (
        <MainContent>
            <Leaderboard selectedRoom={{ id: roomId }} />
        </MainContent>
    );
};

export default RoomLeaderboard;

