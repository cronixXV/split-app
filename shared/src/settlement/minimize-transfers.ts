import type { Balance, Transfer } from '../index';

import { fromCents, toCents } from './money';

interface IParticipantBalance {
  id: string;
  name: string;
  amountInCents: number;
}

export const MAX_EXACT_TRANSFER_PARTICIPANTS = 18;

function findMaximumZeroSumGroups(
  participants: readonly IParticipantBalance[]
): IParticipantBalance[][] {
  const memo = new Map<string, number[][]>();

  function search(remainingIndexes: number[]): number[][] {
    if (remainingIndexes.length === 0) {
      return [];
    }

    const key = remainingIndexes.join(',');

    const cached = memo.get(key);

    if (cached !== undefined) {
      return cached;
    }

    /*
     * Базовый вариант:
     * все оставшиеся участники — одна группа.
     */
    let bestGroups: number[][] = [[...remainingIndexes]];

    const firstIndex = remainingIndexes[0];

    const selectedIndexes = [firstIndex];

    const zeroSumGroups: number[][] = [];

    function collectGroups(
      startPosition: number,
      currentSumInCents: number
    ): void {
      if (currentSumInCents === 0) {
        zeroSumGroups.push([...selectedIndexes]);

        return;
      }

      const usedAmounts = new Set<number>();

      for (
        let position = startPosition;
        position < remainingIndexes.length;
        position += 1
      ) {
        const participantIndex = remainingIndexes[position];

        const amountInCents = participants[participantIndex].amountInCents;

        /*
         * Участники с одинаковыми балансами
         * эквивалентны внутри этой ветки.
         */
        if (usedAmounts.has(amountInCents)) {
          continue;
        }

        usedAmounts.add(amountInCents);

        selectedIndexes.push(participantIndex);

        collectGroups(position + 1, currentSumInCents + amountInCents);

        selectedIndexes.pop();
      }
    }

    collectGroups(1, participants[firstIndex].amountInCents);

    for (const groupIndexes of zeroSumGroups) {
      if (groupIndexes.length === remainingIndexes.length) {
        continue;
      }

      const groupIndexSet = new Set(groupIndexes);

      const restIndexes = remainingIndexes.filter(
        participantIndex => !groupIndexSet.has(participantIndex)
      );

      const restGroups = search(restIndexes);

      const candidateGroups = [groupIndexes, ...restGroups];

      if (candidateGroups.length > bestGroups.length) {
        bestGroups = candidateGroups;
      }
    }

    memo.set(key, bestGroups);

    return bestGroups;
  }

  const allIndexes = participants.map((_, index) => index);

  return search(allIndexes).map(groupIndexes =>
    groupIndexes.map(index => participants[index])
  );
}

/**
 * Создаёт переводы внутри нулевой группы.
 */
function settleGroup(group: readonly IParticipantBalance[]): Transfer[] {
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
      creditorIndex += 1;
    }

    if (debtor.remainingInCents === 0) {
      debtorIndex += 1;
    }
  }

  return transfers;
}

export function minimizeTransfers(balances: readonly Balance[]): Transfer[] {
  const participants = balances
    .map(balance => ({
      id: balance.memberId,
      name: balance.memberName,
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

  /*
   * Для больших комнат используем
   * детерминированный greedy fallback.
   */
  return settleGroup(participants);
}
