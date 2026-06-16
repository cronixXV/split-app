import { IExpenseEntity, IMemberEntity } from '../entities';
import { Balance, Transfer } from '@shared/types';

export function calculateBalances(
  expenses: IExpenseEntity[],
  members: IMemberEntity[]
): Balance[] {
  const balanceMap: Record<string, number> = {};

  for (const member of members) {
    balanceMap[member.id] = 0;
  }

  for (const expense of expenses) {
    const share = expense.amount / expense.split.length;
    balanceMap[expense.paidBy] =
      (balanceMap[expense.paidBy] ?? 0) + expense.amount;
    for (const memberId of expense.split) {
      balanceMap[memberId] = (balanceMap[memberId] ?? 0) - share;
    }
  }

  return members.map(member => ({
    memberId: member.id,
    memberName: member.name,
    amount: Math.round(balanceMap[member.id] * 100) / 100,
  }));
}

export function minimizeTransfers(
  balances: Balance[],
  members: IMemberEntity[]
): Transfer[] {
  const memberMap = Object.fromEntries(members.map(m => [m.id, m.name]));

  const pos = balances
    .filter(b => b.amount > 0.01)
    .map(b => ({ id: b.memberId, amount: b.amount }))
    .sort((a, b) => b.amount - a.amount);

  const neg = balances
    .filter(b => b.amount < -0.01)
    .map(b => ({ id: b.memberId, amount: b.amount }))
    .sort((a, b) => a.amount - b.amount);

  const transfers: Transfer[] = [];
  let i = 0,
    j = 0;

  while (i < pos.length && j < neg.length) {
    const amount = Math.min(pos[i].amount, -neg[j].amount);
    amount > 0.01 &&
      transfers.push({
        from: neg[j].id,
        fromName: memberMap[neg[j].id],
        to: pos[i].id,
        toName: memberMap[pos[i].id],
        amount: Math.round(amount * 100) / 100,
      });
    pos[i].amount -= amount;
    neg[j].amount += amount;
    if (pos[i].amount < 0.01) i++;
    if (neg[j].amount > -0.01) j++;
  }

  return transfers;
}
