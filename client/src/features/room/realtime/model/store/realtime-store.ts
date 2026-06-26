import type {
  WsEvent,
  WsExpenseAdded,
  WsExpenseDeleted,
  WsMemberAdded,
} from '@shared/types';

import {
  combine,
  createEffect,
  createEvent,
  createStore,
  sample,
  scopeBind,
} from 'effector';

import { expenseRemoved, expenseUpserted } from '@/entities/expense';
import { memberUpserted } from '@/entities/member';

import {
  createSocketClient,
  type TAppSocket,
} from '@/shared/api/socket-client';

interface ISocketConnectedPayload {
  isReconnect: boolean;
}

interface IJoinRoomFxParams {
  socket: TAppSocket;
  roomId: string;
  isReconnect: boolean;
}

export interface IJoinRoomFxResult {
  roomId: string;
  isReconnect: boolean;
}

interface ILeaveRoomFxParams {
  socket: TAppSocket;
  roomId: string;
}

export const roomRealtimeStarted = createEvent<string>();
export const roomRealtimeStopped = createEvent<string>();
export const disconnectSocketRequested = createEvent();
export const remoteEventReceived = createEvent<WsEvent>();
export const roomPresenceReceived = createEvent<{
  count: number;
}>();

export const socketConnected = createEvent<ISocketConnectedPayload>();
export const socketDisconnected = createEvent<string>();
export const socketConnectionFailed = createEvent<Error>();

export const connectSocketFx = createEffect<void, TAppSocket, Error>(() => {
  const emitConnected = scopeBind(socketConnected);
  const emitDisconnected = scopeBind(socketDisconnected);
  const emitConnectionFailed = scopeBind(socketConnectionFailed);
  const emitRemoteEvent = scopeBind(remoteEventReceived);
  const emitPresence = scopeBind(roomPresenceReceived);

  const socket = createSocketClient();

  let hasConnectedBefore = false;

  socket.on('connect', () => {
    emitConnected({
      isReconnect: hasConnectedBefore,
    });

    hasConnectedBefore = true;
  });

  socket.on('disconnect', reason => {
    emitDisconnected(reason);
  });

  socket.on('connect_error', error => {
    emitConnectionFailed(error);
  });

  socket.on('event', event => {
    emitRemoteEvent(event);
  });

  socket.on('room_presence', payload => {
    emitPresence(payload);
  });

  socket.connect();

  return socket;
});

export const joinRoomFx = createEffect<
  IJoinRoomFxParams,
  IJoinRoomFxResult,
  Error
>(
  ({ socket, roomId, isReconnect }) =>
    new Promise((resolve, reject) => {
      const timeoutId = globalThis.setTimeout(() => {
        reject(new Error('join_room acknowledgement timeout'));
      }, 5_000);

      socket.emit('join_room', { roomId }, result => {
        globalThis.clearTimeout(timeoutId);

        if (!result.ok) {
          reject(new Error(result.error));

          return;
        }

        resolve({
          roomId,
          isReconnect,
        });
      });
    })
);

export const leaveRoomFx = createEffect<ILeaveRoomFxParams, void, Error>(
  ({ socket, roomId }) => {
    socket.emit('leave_room', {
      roomId,
    });
  }
);

export const disconnectSocketFx = createEffect<TAppSocket, void, Error>(
  socket => {
    socket.removeAllListeners();
    socket.disconnect();
  }
);

export const $socket = createStore<TAppSocket | null>(null)
  .on(connectSocketFx.doneData, (_, socket) => socket)
  .reset(disconnectSocketFx.done);

export const $activeRoomId = createStore<string | null>(null)
  .on(roomRealtimeStarted, (_, roomId) => roomId)
  .on(roomRealtimeStopped, (activeRoomId, stoppedRoomId) =>
    activeRoomId === stoppedRoomId ? null : activeRoomId
  )
  .reset(disconnectSocketFx.done);

export const $isSocketConnected = createStore(false)
  .on(socketConnected, () => true)
  .on(socketDisconnected, () => false)
  .reset(disconnectSocketFx.done);

export const $onlineCount = createStore(0)
  .on(roomPresenceReceived, (_, { count }) => count)
  .reset([roomRealtimeStopped, socketDisconnected, disconnectSocketFx.done]);

export const $socketError = createStore<string | null>(null)
  .on(socketConnectionFailed, (_, error) => error.message)
  .on(connectSocketFx.failData, (_, error) => error.message)
  .on(joinRoomFx.failData, (_, error) => error.message)
  .reset([roomRealtimeStarted, socketConnected]);

const $connectionState = combine({
  socket: $socket,
  isConnecting: connectSocketFx.pending,
});

sample({
  clock: roomRealtimeStarted,
  source: $connectionState,
  filter: ({ socket, isConnecting }) => socket === null && !isConnecting,
  fn: () => undefined,
  target: connectSocketFx,
});

sample({
  clock: socketConnected,
  source: combine({
    socket: $socket,
    roomId: $activeRoomId,
  }),
  filter: ({ socket, roomId }) => socket !== null && roomId !== null,
  fn: ({ socket, roomId }, { isReconnect }): IJoinRoomFxParams => ({
    socket: socket!,
    roomId: roomId!,
    isReconnect,
  }),

  target: joinRoomFx,
});

sample({
  clock: roomRealtimeStarted,
  source: combine({
    socket: $socket,
    isConnected: $isSocketConnected,
  }),
  filter: ({ socket, isConnected }) => socket !== null && isConnected,
  fn: ({ socket }, roomId): IJoinRoomFxParams => ({
    socket: socket!,
    roomId,
    isReconnect: false,
  }),
  target: joinRoomFx,
});

sample({
  clock: roomRealtimeStopped,
  source: combine({
    socket: $socket,
    isConnected: $isSocketConnected,
  }),
  filter: ({ socket, isConnected }) => socket !== null && isConnected,
  fn: ({ socket }, roomId): ILeaveRoomFxParams => ({
    socket: socket!,
    roomId,
  }),
  target: leaveRoomFx,
});

sample({
  clock: disconnectSocketRequested,
  source: $socket,
  filter: (socket): socket is TAppSocket => socket !== null,
  target: disconnectSocketFx,
});

function isExpenseAdded(event: WsEvent): event is WsExpenseAdded {
  return event.type === 'expense_added';
}

function isExpenseDeleted(event: WsEvent): event is WsExpenseDeleted {
  return event.type === 'expense_deleted';
}

function isMemberAdded(event: WsEvent): event is WsMemberAdded {
  return event.type === 'member_added';
}

sample({
  clock: remoteEventReceived,
  filter: isExpenseAdded,
  fn: event => event.payload,
  target: expenseUpserted,
});

sample({
  clock: remoteEventReceived,
  filter: isExpenseDeleted,
  fn: event => event.payload.id,
  target: expenseRemoved,
});

sample({
  clock: remoteEventReceived,
  filter: isMemberAdded,
  fn: event => event.payload,
  target: memberUpserted,
});
