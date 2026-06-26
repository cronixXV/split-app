import { $expenses } from '@/entities/expense';
import { $members } from '@/entities/member';
import { calculateBalances, minimizeTransfers } from '@shared/types';

import { combine } from 'effector';

export const $balances = combine(
  {
    members: $members,
    expenses: $expenses,
  },

  ({ members, expenses }) => calculateBalances(expenses, members)
);

export const $transfers = $balances.map(balances =>
  minimizeTransfers(balances)
);
