import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = ({ onNewAlert }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    if (onNewAlert) {
      socket.on('new-alert', onNewAlert);
    }

    return () => {
      if (onNewAlert) {
        socket.off('new-alert', onNewAlert);
      }

      socket.disconnect();
      socketRef.current = null;
    };
  }, [onNewAlert]);

  return socketRef;
};
