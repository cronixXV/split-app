import { Card, Separator } from '@heroui/react';

import type { Balance, Transfer } from '@shared/types';
import { formatMoney } from '@/shared/lib/format-money';

interface ITransferSummaryProps {
  balances: Balance[];
  transfers: Transfer[];
}

export const TransferSummary = ({
  balances,
  transfers,
}: ITransferSummaryProps) => {
  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="w-full">
        <Card.Header>
          <Card.Title>Балансы</Card.Title>

          <Card.Description>
            Кто должен получить деньги, а кто должен заплатить
          </Card.Description>
        </Card.Header>

        <Card.Content>
          {balances.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-medium">Балансов пока нет</p>

              <p className="mt-1 text-sm text-muted">
                Добавьте участников и расходы, чтобы увидеть расчёт.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {balances.map((balance, index) => (
                <div key={balance.memberId}>
                  {index > 0 && <Separator variant="tertiary" />}

                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="min-w-0 truncate">
                      {balance.memberName}
                    </span>

                    <span
                      className={[
                        'shrink-0 font-semibold',
                        balance.amount < 0
                          ? 'text-danger'
                          : balance.amount > 0
                            ? 'text-success'
                            : 'text-muted',
                      ].join(' ')}
                    >
                      {formatMoney(balance.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      <Card className="w-full">
        <Card.Header>
          <Card.Title>Переводы</Card.Title>

          <Card.Description>
            Минимальный набор переводов для закрытия долгов
          </Card.Description>
        </Card.Header>

        <Card.Content>
          {transfers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-medium">Переводы не требуются</p>

              <p className="mt-1 text-sm text-muted">
                Сейчас никто никому не должен.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {transfers.map((transfer, index) => (
                <div key={[transfer.from, transfer.to, index].join(':')}>
                  {index > 0 && <Separator variant="tertiary" />}

                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {transfer.fromName}
                        {' → '}
                        {transfer.toName}
                      </p>

                      <p className="mt-1 text-sm text-muted">
                        Перевод участнику
                      </p>
                    </div>

                    <span className="shrink-0 font-semibold text-accent">
                      {formatMoney(transfer.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};
