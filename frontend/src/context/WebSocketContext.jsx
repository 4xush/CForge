import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthContext } from './AuthContext';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [pendingRoomJoin, setPendingRoomJoin] = useState(null);
    const { user, authUser } = useAuthContext();
    const activeUser = user || authUser;
    const [currentRoomDetails, setCurrentRoomDetails] = useState(null);

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

            // Debug log the token and user
            console.log('Socket connection attempt:', {
                userId: activeUser._id,
                hasToken: !!token,
                tokenPreview: token.substring(0, 10) + '...',
                user: {
                    id: activeUser._id,
                    username: activeUser.username,
                    email: activeUser.email
                }
            });
            
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
                    console.log('Socket connected successfully:', {
                        userId: activeUser._id,
                        socketId: newSocket.id,
                        user: {
                            id: activeUser._id,
                            username: activeUser.username
                        }
                    });
                    setIsConnected(true);
                    setConnectionAttempts(0);
                    
                    // If there was a pending room join, execute it now
                    if (pendingRoomJoin) {
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
                    console.log('Socket disconnected, attempting to reconnect...');
                    setIsConnected(false);
                });

                newSocket.on('reconnect', (attemptNumber) => {
                    console.log('Socket reconnected after', attemptNumber, 'attempts');
                    setIsConnected(true);
                    setConnectionAttempts(0);
                    
                    // Rejoin the current room after reconnection
                    if (currentRoomDetails?._id) {
                        newSocket.emit('join_room', {
                            roomId: currentRoomDetails._id,
                            userId: activeUser._id
                        });
                    }
                });

                newSocket.on('reconnect_error', (error) => {
                    console.error('Socket reconnection error:', error);
                });

                newSocket.on('reconnect_failed', () => {
                    console.error('Socket reconnection failed after all attempts');
                    toast.error('Failed to reconnect to the server. Please refresh the page.');
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
    }, [activeUser, connectionAttempts, pendingRoomJoin, currentRoomDetails]);

    // Use useCallback to memoize these functions
    const joinRoom = useCallback((roomId) => {
        if (!roomId) return;
        
        if (socket && isConnected && activeUser) {
            console.log('Joining room:', { roomId, userId: activeUser._id });
            socket.emit('join_room', { roomId, userId: activeUser._id });
        } else {
            console.warn(`Cannot join room ${roomId} immediately: Socket not connected yet. Adding to pending queue.`);
            setPendingRoomJoin(roomId);
        }
    }, [socket, isConnected, activeUser]);

    const leaveRoom = useCallback((roomId) => {
        if (!roomId) return;
        
        if (socket && isConnected) {
            console.log('Leaving room:', roomId);
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
            socket.emit('send_message', { roomId, message });
            return true;
        } else {
            console.error('Cannot send message: Socket not connected');
            return false;
        }
    }, [socket, isConnected]);

    const editMessage = useCallback((roomId, messageId, newContent) => {
        if (!socket?.connected) {
            toast.error('Not connected to server');
            return false;
        }

        if (!roomId || !messageId || !newContent) {
            toast.error('Missing required fields');
            return false;
        }

        try {
            socket.emit('edit_message', { roomId, messageId, newContent });
            return true;
        } catch (error) {
            console.error('Error sending edit message:', error);
            toast.error('Failed to send edit request');
            return false;
        }
    }, [socket]);

    useEffect(() => {
        if (socket) {
            const handleMessageUpdated = (updatedMessage) => {
                // Emit acknowledgment
                socket.emit('message_update_received', updatedMessage);
                
                // Update the message in the local state through MessageContext
                if (window.messageContext) {
                    window.messageContext.updateMessage(updatedMessage);
                }
            };

            const handleEditSuccess = ({ messageId }) => {
                console.log('Message edit successful:', messageId);
            };

            const handleMessageError = (error) => {
                console.error('Message error:', error);
                toast.error(error.error || 'Failed to update message');
            };

            socket.on('message_updated', handleMessageUpdated);
            socket.on('edit_success', handleEditSuccess);
            socket.on('message_error', handleMessageError);

            return () => {
                socket.off('message_updated', handleMessageUpdated);
                socket.off('edit_success', handleEditSuccess);
                socket.off('message_error', handleMessageError);
            };
        }
    }, [socket]);

    // Make the socket instance available globally for message context
    useEffect(() => {
        if (socket) {
            window.messageContext = {
                updateMessage: (updatedMessage) => {
                    // This will be called by the MessageContext
                    if (window.messageContext?.onMessageUpdate) {
                        window.messageContext.onMessageUpdate(updatedMessage);
                    }
                }
            };
        }
        return () => {
            window.messageContext = null;
        };
    }, [socket]);

    return (
        <WebSocketContext.Provider value={{ 
            socket, 
            joinRoom, 
            leaveRoom, 
            sendMessage,
            editMessage,
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