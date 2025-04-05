import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainContent from '../components/MainContent';
import ChatWithWebSocket from '../components/Messages/ChatWithWebSocket';
import { useRoomContext } from '../context/RoomContext';

const RoomChat = () => {
    const { roomId } = useParams();
    const { rooms, setSelectedRoom, selectRoom } = useRoomContext();

    useEffect(() => {
        if (roomId) {
            const existingRoom = rooms.find((room) => room.roomId === roomId);

            if (existingRoom) {
                // If room exists in context, set it as selected
                setSelectedRoom(existingRoom);
            } else {
                // Fetch the room data if it doesn't exist in the context
                selectRoom(roomId);
            }
        }
    }, [roomId, rooms, setSelectedRoom, selectRoom]);

    return (
        <MainContent>
            <ChatWithWebSocket />
        </MainContent>
    );
};

export default RoomChat;

