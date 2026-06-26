import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRoomPage } from '../model/hooks/use-room-page';

interface RoomPageProps {
  roomId: string;
}

export function RoomPage({ roomId }: RoomPageProps) {
  const page = useRoomPage(roomId);

  const [memberName, setMemberName] = useState('');

  const [description, setDescription] = useState('');

  const [amount, setAmount] = useState('');

  const [paidBy, setPaidBy] = useState('');

  const [split, setSplit] = useState<string[]>([]);

  /**
   * Временные optimistic-участники ещё не существуют
   * на сервере, поэтому их нельзя указывать в расходе.
   */
  const confirmedMembers = useMemo(
    () => page.members.filter(member => !member.id.startsWith('temp:')),
    [page.members]
  );

  useEffect(() => {
    const confirmedMemberIds = new Set(
      confirmedMembers.map(member => member.id)
    );

    if (!confirmedMemberIds.has(paidBy)) {
      setPaidBy(confirmedMembers[0]?.id ?? '');
    }

    setSplit(currentSplit => {
      const existingIds = currentSplit.filter(id => confirmedMemberIds.has(id));

      return existingIds.length > 0
        ? existingIds
        : confirmedMembers.map(member => member.id);
    });
  }, [confirmedMembers, paidBy]);

  function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    page.addMember(memberName);
    setMemberName('');
  }

  function handleSaveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    page.saveExpense({
      paidBy,
      amount: Number(amount),
      description,
      split,
    });

    setDescription('');
    setAmount('');
  }

  function toggleSplitMember(memberId: string) {
    setSplit(currentSplit =>
      currentSplit.includes(memberId)
        ? currentSplit.filter(id => id !== memberId)
        : [...currentSplit, memberId]
    );
  }

  if (page.isLoading && page.room === null) {
    return <p>Загрузка комнаты…</p>;
  }

  if (page.loadError && page.room === null) {
    return (
      <main>
        <p>Ошибка загрузки: {page.loadError}</p>

        <button type="button" onClick={page.reload}>
          Повторить
        </button>
      </main>
    );
  }

  if (!page.room) {
    return <p>Комната не найдена</p>;
  }

  return (
    <main>
      <header>
        <h1>{page.room.name}</h1>

        <p>Socket: {page.isSocketConnected ? 'подключён' : 'отключён'}</p>

        <p>Онлайн: {page.onlineCount}</p>

        {page.socketError && <p>Socket error: {page.socketError}</p>}
      </header>

      <hr />

      <section>
        <h2>Добавить участника</h2>

        <form onSubmit={handleAddMember}>
          <input
            value={memberName}
            placeholder="Имя"
            onChange={event => {
              setMemberName(event.target.value);
            }}
          />

          <button type="submit" disabled={page.isAddingMember}>
            {page.isAddingMember ? 'Добавление…' : 'Добавить'}
          </button>
        </form>

        {page.addMemberError && <p>Ошибка: {page.addMemberError}</p>}

        <ul>
          {page.members.map(member => (
            <li key={member.id}>
              {member.name}

              {member.id.startsWith('temp:') && ' — optimistic'}
            </li>
          ))}
        </ul>
      </section>

      <hr />

      <section>
        <h2>Добавить расход</h2>

        {confirmedMembers.length === 0 ? (
          <p>Сначала добавь хотя бы одного участника.</p>
        ) : (
          <form onSubmit={handleSaveExpense}>
            <div>
              <label>
                Описание{' '}
                <input
                  value={description}
                  onChange={event => {
                    setDescription(event.target.value);
                  }}
                />
              </label>
            </div>

            <div>
              <label>
                Сумма{' '}
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={event => {
                    setAmount(event.target.value);
                  }}
                />
              </label>
            </div>

            <div>
              <label>
                Кто заплатил{' '}
                <select
                  value={paidBy}
                  onChange={event => {
                    setPaidBy(event.target.value);
                  }}
                >
                  {confirmedMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset>
              <legend>Кто участвует</legend>

              {confirmedMembers.map(member => (
                <label
                  key={member.id}
                  style={{
                    display: 'block',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={split.includes(member.id)}
                    onChange={() => {
                      toggleSplitMember(member.id);
                    }}
                  />

                  {member.name}
                </label>
              ))}
            </fieldset>

            <button type="submit" disabled={page.isSavingExpense}>
              {page.isSavingExpense ? 'Сохранение…' : 'Добавить расход'}
            </button>
          </form>
        )}

        {page.saveExpenseError && <p>Ошибка: {page.saveExpenseError}</p>}
      </section>

      <hr />

      <section>
        <h2>Расходы</h2>

        {page.expenses.length === 0 && <p>Расходов пока нет</p>}

        <ul>
          {page.expenses.map(expense => {
            const isTemporary = expense.id.startsWith('temp:');

            const isDeleting = page.isExpenseDeleting(expense.id);

            return (
              <li key={expense.id}>
                {expense.description}
                {' — '}
                {expense.amount}
                {isTemporary && ' — optimistic'}{' '}
                <button
                  type="button"
                  disabled={isTemporary || isDeleting}
                  onClick={() => {
                    page.deleteExpense(expense.id);
                  }}
                >
                  {isDeleting ? 'Удаление…' : 'Удалить'}
                </button>
              </li>
            );
          })}
        </ul>

        {page.deleteExpenseError && <p>Ошибка: {page.deleteExpenseError}</p>}
      </section>

      <hr />

      <section>
        <h2>Балансы</h2>

        <ul>
          {page.balances.map(balance => (
            <li key={balance.memberId}>
              {balance.memberName}: {balance.amount}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Переводы</h2>

        {page.transfers.length === 0 && <p>Переводы не требуются</p>}

        <ul>
          {page.transfers.map((transfer, index) => (
            <li key={[transfer.from, transfer.to, index].join(':')}>
              {transfer.fromName}
              {' → '}
              {transfer.toName}
              {': '}
              {transfer.amount}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
