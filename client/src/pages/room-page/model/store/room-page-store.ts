import { createEvent, sample } from 'effector';

import { expensesReset } from '@/entities/expense';

import { membersReset } from '@/entities/member';

import { roomReset } from '@/entities/room';
import {
  joinRoomFx,
  loadRoomRequested,
  roomRealtimeStarted,
  roomRealtimeStopped,
} from '@/features/room';

export const roomPageMounted = createEvent<string>();
export const roomPageUnmounted = createEvent<string>();

sample({
  clock: roomPageMounted,
  target: [loadRoomRequested, roomRealtimeStarted],
});

sample({
  clock: joinRoomFx.doneData,
  filter: ({ isReconnect }) => isReconnect,
  fn: ({ roomId }) => roomId,
  target: loadRoomRequested,
});

sample({
  clock: roomPageUnmounted,
  target: roomRealtimeStopped,
});

sample({
  clock: roomPageUnmounted,
  fn: () => undefined,
  target: [roomReset, membersReset, expensesReset],
});
