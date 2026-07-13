import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types';

import { io, type Socket } from 'socket.io-client';

export type TAppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const LOCAL_SOCKET_URL = 'http://localhost:3001';

const SOCKET_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_SOCKET_URL ?? LOCAL_SOCKET_URL)
  : window.location.origin;

export function createSocketClient(): TAppSocket {
  return io(SOCKET_URL, {
    path: '/socket.io',
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5_000,
  });
}
