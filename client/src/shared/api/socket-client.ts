import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types';

import { io, type Socket } from 'socket.io-client';

export type TAppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3001';

export function createSocketClient(): TAppSocket {
  return io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5_000,
  });
}
