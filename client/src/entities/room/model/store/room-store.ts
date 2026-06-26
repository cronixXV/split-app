import type { Room } from '@shared/types';

import { createEvent, createStore } from 'effector';

export const roomReceived = createEvent<Room>();
export const roomReset = createEvent();

export const $room = createStore<Room | null>(null)
  .on(roomReceived, (_, room) => room)
  .reset(roomReset);
