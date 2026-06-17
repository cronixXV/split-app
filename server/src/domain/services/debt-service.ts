import { type Balance, type Transfer } from '@shared/types';

import type { IExpenseEntity, IMemberEntity } from '../entities';
import { fromCents, toCents } from './money';

interface IParticipantBalance {
  id: string;
  name: string;
  amountInCents: number;
}

const MAX_EXACT_TRANSFER_PARTICIPANTS = 18;

function findMaximumZeroSumGroups(
  participants: IParticipantBalance[]
): IParticipantBalance[][] {
  const memo = new Map<string, number[][]>();

  function search(remaining: number[]): number[][] {
    if (remaining.length === 0) {
      return [];
    }

    const key = remaining.join(',');
    const cached = memo.get(key);

    if (cached) {
      return cached;
    }

    let bestGroups: number[][] = [[...remaining]];

    const firstIndex = remaining[0];
    const selected = [firstIndex];

    const zeroSumCandidates: number[][] = [];

    function collectGroups(
      startPosition: number,
      currentSumInCents: number
    ): void {
      if (currentSumInCents === 0) {
        zeroSumCandidates.push([...selected]);
        return;
      }

      const usedAmounts = new Set<number>();

      for (
        let position = startPosition;
        position < remaining.length;
        position++
      ) {
        const participantIndex = remaining[position];
        const amountInCents = participants[participantIndex].amountInCents;

        if (usedAmounts.has(amountInCents)) {
          continue;
        }

        usedAmounts.add(amountInCents);
        selected.push(participantIndex);

        collectGroups(position + 1, currentSumInCents + amountInCents);

        selected.pop();
      }
    }

    collectGroups(1, participants[firstIndex].amountInCents);

    for (const group of zeroSumCandidates) {
      if (group.length === remaining.length) {
        continue;
      }

      const groupSet = new Set(group);

      const rest = remaining.filter(
        participantIndex => !groupSet.has(participantIndex)
      );

      const restGroups = search(rest);
      const candidateGroups = [group, ...restGroups];

      if (candidateGroups.length > bestGroups.length) {
        bestGroups = candidateGroups;
      }
    }

    memo.set(key, bestGroups);

    return bestGroups;
  }

  const participantIndexes = participants.map((_, index) => index);

  return search(participantIndexes).map(group =>
    group.map(index => participants[index])
  );
}

function settleGroup(group: IParticipantBalance[]): Transfer[] {
  const creditors = group
    .filter(participant => participant.amountInCents > 0)
    .map(participant => ({
      ...participant,
      remainingInCents: participant.amountInCents,
    }))
    .sort(
      (left, right) =>
        right.remainingInCents - left.remainingInCents ||
        left.id.localeCompare(right.id)
    );

  const debtors = group
    .filter(participant => participant.amountInCents < 0)
    .map(participant => ({
      ...participant,
      remainingInCents: -participant.amountInCents,
    }))
    .sort(
      (left, right) =>
        right.remainingInCents - left.remainingInCents ||
        left.id.localeCompare(right.id)
    );

  const transfers: Transfer[] = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const transferInCents = Math.min(
      creditor.remainingInCents,
      debtor.remainingInCents
    );

    transfers.push({
      from: debtor.id,
      fromName: debtor.name,
      to: creditor.id,
      toName: creditor.name,
      amount: fromCents(transferInCents),
    });

    creditor.remainingInCents -= transferInCents;
    debtor.remainingInCents -= transferInCents;

    if (creditor.remainingInCents === 0) {
      creditorIndex++;
    }

    if (debtor.remainingInCents === 0) {
      debtorIndex++;
    }
  }

  return transfers;
}

export function calculateBalances(
  expenses: IExpenseEntity[],
  members: IMemberEntity[]
): Balance[] {
  const balanceInCents: Record<string, number> = {};

  for (const member of members) {
    balanceInCents[member.id] = 0;
  }

  for (const expense of expenses) {
    const expenseInCents = toCents(expense.amount);
    const participantCount = expense.split.length;

    if (participantCount === 0) {
      throw new Error(`Expense ${expense.id} has no participants`);
    }

    const baseShareInCents = Math.floor(expenseInCents / participantCount);

    const remainderInCents = expenseInCents % participantCount;

    balanceInCents[expense.paidBy] =
      (balanceInCents[expense.paidBy] ?? 0) + expenseInCents;

    expense.split.forEach((memberId, index) => {
      const extraCent = index < remainderInCents ? 1 : 0;

      const shareInCents = baseShareInCents + extraCent;

      balanceInCents[memberId] = (balanceInCents[memberId] ?? 0) - shareInCents;
    });
  }

  return members.map(member => ({
    memberId: member.id,
    memberName: member.name,
    amount: fromCents(balanceInCents[member.id]),
  }));
}

export function minimizeTransfers(
  balances: Balance[],
  members: IMemberEntity[]
): Transfer[] {
  const memberNames = new Map(members.map(member => [member.id, member.name]));

  const participants: IParticipantBalance[] = balances
    .map(balance => ({
      id: balance.memberId,
      name: memberNames.get(balance.memberId) ?? balance.memberName,
      amountInCents: toCents(balance.amount),
    }))
    .filter(participant => participant.amountInCents !== 0)
    .sort(
      (left, right) =>
        Math.abs(right.amountInCents) - Math.abs(left.amountInCents) ||
        left.id.localeCompare(right.id)
    );

  const totalInCents = participants.reduce(
    (sum, participant) => sum + participant.amountInCents,
    0
  );

  if (totalInCents !== 0) {
    throw new Error(`Balances are not settled: total is ${totalInCents} cents`);
  }

  if (participants.length === 0) {
    return [];
  }

  if (participants.length <= MAX_EXACT_TRANSFER_PARTICIPANTS) {
    const groups = findMaximumZeroSumGroups(participants);

    return groups.flatMap(group => settleGroup(group));
  }

  return settleGroup(participants);
}
