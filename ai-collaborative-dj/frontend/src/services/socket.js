import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to real-time server with id:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });
  }
  return socketInstance;
};
