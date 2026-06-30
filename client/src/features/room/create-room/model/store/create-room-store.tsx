import { createEffect, createStore } from 'effector';
import type { CreateRoomDto, Room } from '@shared/types';

import { roomApi } from '@/entities/room';

import { getErrorMessage } from '@/shared/lib/get-error-message';

export const createRoomFx = createEffect<CreateRoomDto, Room, Error>(dto =>
  roomApi.createRoom(dto)
);

export const $createRoomPending = createRoomFx.pending;

export const $createRoomError = createStore<string | null>(null)
  .on(createRoomFx, () => null)
  .on(createRoomFx.failData, (_, error) => getErrorMessage(error));
