import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 2000,
});

socket.on('connect', () => {
  console.log('[Socket.IO] Connected to FairAI Guardian server');
});

socket.on('disconnect', () => {
  console.log('[Socket.IO] Disconnected from server');
});
