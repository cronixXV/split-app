import type { CreateExpenseDto, Expense } from '@shared/types';

import { createEffect, createEvent, createStore, sample } from 'effector';

import {
  expenseApi,
  expenseRemoved,
  expenseUpserted,
  temporaryExpenseReplaced,
} from '@/entities/expense';

interface ISaveExpenseCommand {
  roomId: string;
  dto: CreateExpenseDto;
}

interface ISaveExpenseFxParams extends ISaveExpenseCommand {
  temporaryId: string;
}

export const saveExpenseRequested = createEvent<ISaveExpenseCommand>();
const saveExpensePrepared = createEvent<ISaveExpenseFxParams>();

export const saveExpenseFx = createEffect<ISaveExpenseFxParams, Expense, Error>(
  ({ roomId, dto }) => expenseApi.saveExpense(roomId, dto)
);

export const $saveExpensePending = saveExpenseFx.pending;

export const $saveExpenseError = createStore<string | null>(null)
  .on(saveExpenseFx.failData, (_, error) => error.message)
  .reset(saveExpenseRequested);

sample({
  clock: saveExpenseRequested,
  fn: ({ roomId, dto }): ISaveExpenseFxParams => ({
    roomId,
    dto: {
      ...dto,
      description: dto.description.trim(),
      split: [...dto.split],
    },
    temporaryId: `temp:expense:${crypto.randomUUID()}`,
  }),
  target: saveExpensePrepared,
});

sample({
  clock: saveExpensePrepared,
  fn: ({ roomId, dto, temporaryId }): Expense => ({
    id: temporaryId,
    roomId,
    paidBy: dto.paidBy,
    amount: dto.amount,
    description: dto.description,
    split: [...dto.split],
    createdAt: new Date().toISOString(),
  }),
  target: expenseUpserted,
});

sample({
  clock: saveExpensePrepared,
  target: saveExpenseFx,
});

sample({
  clock: saveExpenseFx.done,
  fn: ({ params, result }) => ({
    temporaryId: params.temporaryId,
    expense: result,
  }),
  target: temporaryExpenseReplaced,
});

sample({
  clock: saveExpenseFx.fail,
  fn: ({ params }) => params.temporaryId,
  target: expenseRemoved,
});
