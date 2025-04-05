import React from 'react';
import { WebSocketProvider } from '../../context/WebSocketContext';
import Chat from './Chat';

const ChatWithWebSocket = () => {
  return (
    <WebSocketProvider>
      <Chat />
    </WebSocketProvider>
  );
};

export default ChatWithWebSocket; 