import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    socket = io(`http://${window.location.hostname}:3001`);
  }
  return socket;
};
