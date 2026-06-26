import type { AddMemberDto, Member } from '@shared/types';

import { createEffect, createEvent, createStore, sample } from 'effector';

import {
  memberApi,
  memberRemoved,
  memberUpserted,
  temporaryMemberReplaced,
} from '@/entities/member';

interface IAddMemberCommand {
  roomId: string;
  dto: AddMemberDto;
}

interface IAddMemberFxParams extends IAddMemberCommand {
  temporaryId: string;
}

export const addMemberRequested = createEvent<IAddMemberCommand>();
const addMemberPrepared = createEvent<IAddMemberFxParams>();

export const addMemberFx = createEffect<IAddMemberFxParams, Member, Error>(
  ({ roomId, dto }) => memberApi.addMember(roomId, dto)
);

export const $addMemberPending = addMemberFx.pending;

export const $addMemberError = createStore<string | null>(null)
  .on(addMemberFx.failData, (_, error) => error.message)
  .reset(addMemberRequested);

sample({
  clock: addMemberRequested,
  fn: ({ roomId, dto }): IAddMemberFxParams => ({
    roomId,
    dto: {
      name: dto.name.trim(),
    },
    temporaryId: `temp:member:${crypto.randomUUID()}`,
  }),
  target: addMemberPrepared,
});

sample({
  clock: addMemberPrepared,
  fn: ({ roomId, dto, temporaryId }): Member => ({
    id: temporaryId,
    roomId,
    name: dto.name,
  }),
  target: memberUpserted,
});

sample({
  clock: addMemberPrepared,
  target: addMemberFx,
});

sample({
  clock: addMemberFx.done,
  fn: ({ params, result }) => ({
    temporaryId: params.temporaryId,
    member: result,
  }),
  target: temporaryMemberReplaced,
});

sample({
  clock: addMemberFx.fail,
  fn: ({ params }) => params.temporaryId,
  target: memberRemoved,
});
