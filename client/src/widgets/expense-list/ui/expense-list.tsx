import { useMemo } from 'react';

import { Alert, Button, Card, Chip, Separator } from '@heroui/react';

import type { Expense, Member } from '@shared/types';
import { formatMoney } from '@/shared/lib/format-money';

interface IExpenseListProps {
  expenses: Expense[];
  members: Member[];
  deleteExpenseError: string | null;
  isExpenseDeleting: (expenseId: string) => boolean;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpenseList = ({
  expenses,
  members,
  deleteExpenseError,
  isExpenseDeleting,
  onDeleteExpense,
}: IExpenseListProps) => {
  const memberNames = useMemo(
    () => new Map(members.map(member => [member.id, member.name])),
    [members]
  );

  return (
    <Card className="w-full">
      <Card.Header className="flex flex-row items-center justify-between gap-4">
        <div>
          <Card.Title>Расходы</Card.Title>

          <Card.Description>Все расходы этой комнаты</Card.Description>
        </div>

        <Chip data-cy="expense-count" size="sm" variant="soft" color="accent">
          {expenses.length}
        </Chip>
      </Card.Header>

      <Card.Content>
        {expenses.length === 0 ? (
          <div
            data-cy="expenses-empty"
            className="rounded-2xl border border-dashed border-border px-4 py-10 text-center"
          >
            <p className="font-medium">Расходов пока нет</p>

            <p className="mt-1 text-sm text-muted">
              Добавьте первый расход, чтобы увидеть расчёты.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {expenses.map((expense, index) => {
              const isTemporary = expense.id.startsWith('temp:');

              const isDeleting = isExpenseDeleting(expense.id);

              const payerName =
                memberNames.get(expense.paidBy) ?? 'Неизвестный участник';

              return (
                <div
                  key={expense.id}
                  data-cy="expense-item"
                  data-expense-id={expense.id}
                >
                  {index > 0 && <Separator />}

                  <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          data-cy="expense-description"
                          className="truncate font-medium"
                        >
                          {expense.description}
                        </p>

                        {isTemporary && (
                          <Chip size="sm" color="accent" variant="soft">
                            Сохраняется
                          </Chip>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                        <span data-cy="expense-payer">
                          Заплатил: {payerName}
                        </span>

                        <span data-cy="expense-split-count">
                          Участников: {expense.split.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                      <span data-cy="expense-amount" className="font-semibold">
                        {formatMoney(expense.amount)}
                      </span>

                      <Button
                        data-cy="delete-expense-submit"
                        size="sm"
                        variant="danger"
                        isDisabled={isTemporary}
                        isPending={isDeleting}
                        onPress={() => {
                          onDeleteExpense(expense.id);
                        }}
                      >
                        {isDeleting ? 'Удаляем…' : 'Удалить'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {deleteExpenseError && (
          <Alert status="danger" className="mt-4">
            <Alert.Indicator />

            <Alert.Content>
              <Alert.Title>Не удалось удалить расход</Alert.Title>

              <Alert.Description>{deleteExpenseError}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </Card.Content>
    </Card>
  );
};
