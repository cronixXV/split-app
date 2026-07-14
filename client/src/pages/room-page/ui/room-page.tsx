import { useNavigate } from '@tanstack/react-router';

import { Alert, Button, Card, Spinner, Tabs } from '@heroui/react';

import { useMediaQuery } from '@/shared/lib/use-media-query';

import { ExpenseList } from '@/widgets/expense-list';
import { MemberBar } from '@/widgets/member-bar';
import { TransferSummary } from '@/widgets/transfer-summary';

import { useRoomPage } from '../model/hooks/use-room-page';
import { ExpenseForm } from '@/features/expense';
import {
  $detectedAmount,
  ReceiptUpload,
  scanReceiptReset,
} from '@/features/scan-receipt';
import { useUnit } from 'effector-react';
import { useEffect, useRef } from 'react';

interface IRoomPageProps {
  roomId: string;
}

export const RoomPage = ({ roomId }: IRoomPageProps) => {
  const page = useRoomPage(roomId);
  const navigate = useNavigate();

  const isDesktop = useMediaQuery('(min-width: 768px)');

  const { detectedAmount, resetReceiptScan } = useUnit({
    detectedAmount: $detectedAmount,
    resetReceiptScan: scanReceiptReset,
  });

  const wasSavingExpenseRef = useRef(false);

  useEffect(() => {
    const wasSaving = wasSavingExpenseRef.current;

    const isSuccessfullySaved =
      wasSaving && !page.isSavingExpense && page.saveExpenseError === null;

    if (isSuccessfullySaved) {
      resetReceiptScan();
    }

    wasSavingExpenseRef.current = page.isSavingExpense;
  }, [page.isSavingExpense, page.saveExpenseError, resetReceiptScan]);

  if (page.isLoading && page.room === null) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="xl" color="accent" />

          <p className="text-sm text-muted">Загружаем комнату…</p>
        </div>
      </main>
    );
  }

  if (page.loadError && page.room === null) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <Card.Header>
            <Card.Title>Не удалось загрузить комнату</Card.Title>

            <Card.Description>{page.loadError}</Card.Description>
          </Card.Header>

          <Card.Footer className="flex flex-wrap gap-3">
            <Button variant="primary" onPress={page.reload}>
              Повторить
            </Button>

            <Button
              variant="secondary"
              onPress={() => {
                void navigate({
                  to: '/',
                });
              }}
            >
              На главную
            </Button>
          </Card.Footer>
        </Card>
      </main>
    );
  }

  if (!page.room) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <Card.Header>
            <Card.Title>Комната не найдена</Card.Title>

            <Card.Description>
              Возможно, ссылка устарела или комната была удалена.
            </Card.Description>
          </Card.Header>

          <Card.Footer>
            <Button
              variant="primary"
              onPress={() => {
                void navigate({
                  to: '/',
                });
              }}
            >
              На главную
            </Button>
          </Card.Footer>
        </Card>
      </main>
    );
  }

  const expensesContent = (
    <ExpenseList
      expenses={page.expenses}
      members={page.members}
      deleteExpenseError={page.deleteExpenseError}
      isExpenseDeleting={page.isExpenseDeleting}
      onDeleteExpense={page.deleteExpense}
    />
  );

  const summaryContent = (
    <TransferSummary balances={page.balances} transfers={page.transfers} />
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-5 sm:px-6 md:gap-6 md:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button
              size="sm"
              variant="ghost"
              className="-ml-3 mb-2"
              onPress={() => {
                void navigate({
                  to: '/',
                });
              }}
            >
              ← На главную
            </Button>

            <h1
              data-cy="room-title"
              className="text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {page.room.name}
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
              Добавляйте участников и распределяйте общие расходы.
            </p>
          </div>

          <Button
            variant="secondary"
            isPending={page.isLoading}
            onPress={page.reload}
          >
            {page.isLoading ? 'Обновляем…' : 'Обновить'}
          </Button>
        </header>

        {page.socketError && (
          <Alert status="warning">
            <Alert.Indicator />

            <Alert.Content>
              <Alert.Title>Проблема с realtime-соединением</Alert.Title>

              <Alert.Description>{page.socketError}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        <MemberBar
          members={page.members}
          onlineCount={page.onlineCount}
          isSocketConnected={page.isSocketConnected}
          isAddingMember={page.isAddingMember}
          addMemberError={page.addMemberError}
          onAddMember={page.addMember}
        />

        <ReceiptUpload />

        <ExpenseForm
          members={page.members}
          detectedAmount={detectedAmount}
          isSaving={page.isSavingExpense}
          saveExpenseError={page.saveExpenseError}
          onSaveExpense={page.saveExpense}
        />

        {isDesktop ? (
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6">
            {expensesContent}

            {summaryContent}
          </div>
        ) : (
          <Tabs className="w-full" defaultSelectedKey="expenses">
            <Tabs.ListContainer>
              <Tabs.List aria-label="Разделы комнаты" className="w-full">
                <Tabs.Tab id="expenses" className="flex-1">
                  <Tabs.Indicator />
                  Расходы
                </Tabs.Tab>

                <Tabs.Tab id="summary" className="flex-1">
                  <Tabs.Indicator />
                  Итоги
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            <Tabs.Panel id="expenses" className="pt-4">
              {expensesContent}
            </Tabs.Panel>

            <Tabs.Panel id="summary" className="pt-4">
              {summaryContent}
            </Tabs.Panel>
          </Tabs>
        )}
      </div>
    </main>
  );
};
