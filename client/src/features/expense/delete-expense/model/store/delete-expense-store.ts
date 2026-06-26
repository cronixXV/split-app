import type { Expense } from '@shared/types';

import { createEffect, createEvent, createStore, sample } from 'effector';

import {
  $expenses,
  expenseApi,
  expenseRemoved,
  expenseUpserted,
} from '@/entities/expense';

interface IDeleteExpenseCommand {
  roomId: string;
  expenseId: string;
}

interface IDeleteExpenseFxParams {
  roomId: string;
  expense: Expense;
}

export const deleteExpenseRequested = createEvent<IDeleteExpenseCommand>();
const deleteExpensePrepared = createEvent<IDeleteExpenseFxParams>();

export const deleteExpenseFx = createEffect<
  IDeleteExpenseFxParams,
  void,
  Error
>(({ roomId, expense }) => expenseApi.deleteExpense(roomId, expense.id));

export const $deleteExpensePending = deleteExpenseFx.pending;

export const $deleteExpenseError = createStore<string | null>(null)
  .on(deleteExpenseFx.failData, (_, error) => error.message)
  .reset(deleteExpenseRequested);

export const $deletingExpenseIds = createStore<string[]>([])
  .on(deleteExpensePrepared, (ids, { expense }) => {
    if (ids.includes(expense.id)) {
      return ids;
    }

    return [...ids, expense.id];
  })
  .on(deleteExpenseFx.finally, (ids, { params }) =>
    ids.filter(id => id !== params.expense.id)
  );

sample({
  clock: deleteExpenseRequested,
  source: $expenses,
  filter: (expenses, { expenseId }) =>
    expenses.some(expense => expense.id === expenseId),
  fn: (expenses, { roomId, expenseId }): IDeleteExpenseFxParams => {
    const expense = expenses.find(current => current.id === expenseId);

    if (!expense) {
      throw new Error('Expense not found in store');
    }

    return {
      roomId,
      expense,
    };
  },
  target: deleteExpensePrepared,
});

sample({
  clock: deleteExpensePrepared,
  fn: ({ expense }) => expense.id,
  target: expenseRemoved,
});

sample({
  clock: deleteExpensePrepared,
  target: deleteExpenseFx,
});

sample({
  clock: deleteExpenseFx.fail,
  fn: ({ params }) => params.expense,
  target: expenseUpserted,
});
