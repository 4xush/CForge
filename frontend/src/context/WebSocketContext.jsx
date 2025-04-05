import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthContext } from './AuthContext';
import PropTypes from 'prop-types';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [pendingRoomJoin, setPendingRoomJoin] = useState(null);
    const { user, authUser } = useAuthContext();
    const activeUser = user || authUser;

    useEffect(() => {
        if (activeUser) {
            
            // Use the exact same origin as the current page to avoid CORS issues
            const origin = window.location.hostname === 'localhost' ? 
                'http://localhost:5000' : 
                window.location.origin;
        
            // Extract token from localStorage if not directly available in the user object
            let token = null;
            if (activeUser.token) {
                token = activeUser.token;
            } else {
                // Try to get token from localStorage as a fallback
                token = localStorage.getItem('app-token');
            }

            if (!token) {
                console.error('No authentication token available for WebSocket');
                return;
            }
            
            
            try {
                const newSocket = io(origin, {
                    withCredentials: true,
                    transports: ['websocket', 'polling'],
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    timeout: 10000,
                    auth: {
                        token: token
                    }
                });

                newSocket.on('connect', () => {
                    setIsConnected(true);
                    setConnectionAttempts(0);
                    
                    // If there was a pending room join, execute it now
                    if (pendingRoomJoin) {
                        console.log(`Executing pending room join for ${pendingRoomJoin}`);
                        newSocket.emit('join_room', { 
                            roomId: pendingRoomJoin, 
                            userId: activeUser._id 
                        });
                        setPendingRoomJoin(null);
                    }
                });

                newSocket.on('connect_error', (error) => {
                    console.error('WebSocket connection error:', error);
                    setIsConnected(false);
                    setConnectionAttempts(prev => prev + 1);
                });
                
                newSocket.on('disconnect', () => {
                    setIsConnected(false);
                });

                setSocket(newSocket);

                return () => {
                    newSocket.disconnect();
                    setIsConnected(false);
                };
            } catch (error) {
                console.error('Error creating socket:', error);
                setIsConnected(false);
            }
        }
    }, [activeUser, connectionAttempts, pendingRoomJoin]);

    // Use useCallback to memoize these functions
    const joinRoom = useCallback((roomId) => {
        if (!roomId) return;
        
        if (socket && isConnected && activeUser) {
            socket.emit('join_room', { roomId, userId: activeUser._id });
        } else {
            console.warn(`Cannot join room ${roomId} immediately: Socket not connected yet. Adding to pending queue.`);
            setPendingRoomJoin(roomId);
        }
    }, [socket, isConnected, activeUser]);

    const leaveRoom = useCallback((roomId) => {
        if (!roomId) return;
        
        if (socket && isConnected) {
            socket.emit('leave_room', { roomId });
            if (pendingRoomJoin === roomId) {
                setPendingRoomJoin(null);
            }
        } else {
            console.warn(`Cannot leave room ${roomId}: Socket not connected`);
        }
    }, [socket, isConnected, pendingRoomJoin]);

    const sendMessage = useCallback((roomId, message) => {
        if (socket && isConnected) {
            console.log(`Sending message to room ${roomId}:`, message);
            socket.emit('send_message', { roomId, message });
            return true;
        } else {
            console.error('Cannot send message: Socket not connected');
            return false;
        }
    }, [socket, isConnected]);

    return (
        <WebSocketContext.Provider value={{ 
            socket, 
            joinRoom, 
            leaveRoom, 
            sendMessage,
            connected: isConnected
        }}>
            {children}
        </WebSocketContext.Provider>
    );
};

WebSocketProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}; 