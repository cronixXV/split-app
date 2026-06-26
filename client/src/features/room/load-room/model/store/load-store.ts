import { expensesReplaced } from '@/entities/expense';
import { membersReplaced } from '@/entities/member';
import { roomApi, roomReceived } from '@/entities/room';

import { getErrorMessage } from '@/shared/lib/get-error-message';
import type { RoomDetails } from '@shared/types';

import { createEffect, createEvent, createStore, sample } from 'effector';

export const loadRoomRequested = createEvent<string>();

export const loadRoomFx = createEffect<string, RoomDetails, Error>(roomId =>
  roomApi.getRoom(roomId)
);

export const $loadRoomPending = loadRoomFx.pending;
export const $loadRoomError = createStore<string | null>(null)
  .on(loadRoomFx.failData, (_, error) => getErrorMessage(error))
  .reset(loadRoomRequested);

sample({
  clock: loadRoomRequested,
  target: loadRoomFx,
});

sample({
  clock: loadRoomFx.doneData,
  fn: details => details.room,
  target: roomReceived,
});

sample({
  clock: loadRoomFx.doneData,
  fn: details => details.members,
  target: membersReplaced,
});

sample({
  clock: loadRoomFx.doneData,
  fn: details => details.expenses,
  target: expensesReplaced,
});
