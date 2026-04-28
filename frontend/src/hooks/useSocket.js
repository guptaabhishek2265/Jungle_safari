import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Get the backend URL from environment
        const backendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

        // Create socket connection
        const newSocket = io(backendUrl, {
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        // Connection event listeners
        newSocket.on('connect', () => {
            console.log('Socket.IO connected:', newSocket.id);
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            setConnected(false);
        });

        // Join inventory room for real-time updates
        newSocket.emit('join', 'inventory');

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.close();
        };
    }, []);

    return { socket, connected };
};

export default useSocket;
