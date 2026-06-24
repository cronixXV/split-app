import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types';

import { io, type Socket } from 'socket.io-client';

export type TAppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const socket: TAppSocket = io('http://localhost:3001', {
  autoConnect: false,
});
