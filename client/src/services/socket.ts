import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://fairai-guardian-server-mnadbwxyvq-uc.a.run.app';

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
