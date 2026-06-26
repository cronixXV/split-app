import type { Balance } from '../index';

import { fromCents, toCents } from './money';

interface ISettlementMember {
  id: string;
  name: string;
}

interface ISettlementExpense {
  id: string;
  paidBy: string;
  amount: number;
  split: readonly string[];
}

export function calculateBalances(
  expenses: readonly ISettlementExpense[],
  members: readonly ISettlementMember[]
): Balance[] {
  const balancesInCents = new Map<string, number>();

  for (const member of members) {
    balancesInCents.set(member.id, 0);
  }

  for (const expense of expenses) {
    if (expense.split.length === 0) {
      throw new Error(`Expense ${expense.id} has no participants`);
    }

    const payerBalance = balancesInCents.get(expense.paidBy);

    if (payerBalance === undefined) {
      throw new Error(
        `Expense ${expense.id} references unknown payer ${expense.paidBy}`
      );
    }

    const amountInCents = toCents(expense.amount);

    balancesInCents.set(expense.paidBy, payerBalance + amountInCents);

    const baseShare = Math.floor(amountInCents / expense.split.length);

    const remainder = amountInCents % expense.split.length;

    expense.split.forEach((memberId, index) => {
      const memberBalance = balancesInCents.get(memberId);

      if (memberBalance === undefined) {
        throw new Error(
          `Expense ${expense.id} references unknown participant ${memberId}`
        );
      }

      const extraCent = index < remainder ? 1 : 0;

      const share = baseShare + extraCent;

      balancesInCents.set(memberId, memberBalance - share);
    });
  }

  return members.map(member => ({
    memberId: member.id,
    memberName: member.name,
    amount: fromCents(balancesInCents.get(member.id) ?? 0),
  }));
}
