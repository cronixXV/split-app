import type { Expense, Member } from '@shared/types';

import type { IExpenseEntity, IMemberEntity } from '../../domain/entities';

export function toExpenseContract(expense: IExpenseEntity): Expense {
  return {
    id: expense.id,
    roomId: expense.roomId,
    paidBy: expense.paidBy,
    amount: expense.amount,
    description: expense.description,
    split: expense.split,
    createdAt: expense.createdAt.toISOString(),
  };
}

export function toMemberContract(member: IMemberEntity): Member {
  return {
    id: member.id,
    roomId: member.roomId,
    name: member.name,
  };
}
