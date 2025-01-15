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


// import React, { useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import MainContent from '../components/MainContent';
// import Chat from '../components/Messages/Chat';
// import { useRoomContext } from '../context/RoomContext';

// const RoomChat = () => {
//     const { roomId } = useParams();
//     const { selectRoom } = useRoomContext();
//     console.log(roomId);

//     useEffect(() => {
//         selectRoom(roomId);
//     }, [roomId, selectRoom]);

//     return (
//         <MainContent>
//             <Chat roomId={roomId} />
//         </MainContent>
//     );
// };

// export default RoomChat;

