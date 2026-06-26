import type { Expense } from '@shared/types';

import { createEvent, createStore } from 'effector';

interface IReplaceTemporaryExpensePayload {
  temporaryId: string;
  expense: Expense;
}

export const expensesReplaced = createEvent<Expense[]>();
export const expenseUpserted = createEvent<Expense>();
export const expenseRemoved = createEvent<string>();
export const temporaryExpenseReplaced =
  createEvent<IReplaceTemporaryExpensePayload>();
export const expensesReset = createEvent();

function upsertExpense(
  expenses: Expense[],
  receivedExpense: Expense
): Expense[] {
  const expenseExists = expenses.some(
    expense => expense.id === receivedExpense.id
  );

  if (!expenseExists) {
    return [...expenses, receivedExpense];
  }

  return expenses.map(expense =>
    expense.id === receivedExpense.id ? receivedExpense : expense
  );
}

export const $expenses = createStore<Expense[]>([])
  .on(expensesReplaced, (_, expenses) => [...expenses])
  .on(expenseUpserted, (expenses, expense) => upsertExpense(expenses, expense))
  .on(expenseRemoved, (expenses, expenseId) =>
    expenses.filter(expense => expense.id !== expenseId)
  )
  .on(temporaryExpenseReplaced, (expenses, { temporaryId, expense }) => {
    const withoutTemporary = expenses.filter(
      current => current.id !== temporaryId
    );

    return upsertExpense(withoutTemporary, expense);
  })
  .reset(expensesReset);
