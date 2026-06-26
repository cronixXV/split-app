import type { Member } from '@shared/types';

import { createEvent, createStore } from 'effector';

interface ReplaceTemporaryMemberPayload {
  temporaryId: string;
  member: Member;
}

export const membersReplaced = createEvent<Member[]>();
export const memberUpserted = createEvent<Member>();
export const memberRemoved = createEvent<string>();
export const temporaryMemberReplaced =
  createEvent<ReplaceTemporaryMemberPayload>();
export const membersReset = createEvent();

function upsertMember(members: Member[], receivedMember: Member): Member[] {
  const memberExists = members.some(member => member.id === receivedMember.id);

  if (!memberExists) {
    return [...members, receivedMember];
  }

  return members.map(member =>
    member.id === receivedMember.id ? receivedMember : member
  );
}

export const $members = createStore<Member[]>([])
  .on(membersReplaced, (_, members) => [...members])
  .on(memberUpserted, (members, member) => upsertMember(members, member))
  .on(memberRemoved, (members, memberId) =>
    members.filter(member => member.id !== memberId)
  )
  .on(temporaryMemberReplaced, (members, { temporaryId, member }) => {
    const withoutTemporary = members.filter(
      current => current.id !== temporaryId
    );

    return upsertMember(withoutTemporary, member);
  })
  .reset(membersReset);
