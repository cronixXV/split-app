import type { CreateExpenseDto } from '@shared/types';
import { useEffect } from 'react';
import { useUnit } from 'effector-react';

import { $expenses } from '@/entities/expense';
import { $members } from '@/entities/member';
import { $room } from '@/entities/room';
import { $balances, $transfers } from '@/entities/settlement';

import {
  $isSocketConnected,
  $loadRoomError,
  $loadRoomPending,
  $onlineCount,
  $socketError,
  loadRoomRequested,
} from '@/features/room';
import {
  $addMemberError,
  $addMemberPending,
  addMemberRequested,
} from '@/features/member';
import {
  $deleteExpenseError,
  $deletingExpenseIds,
  $saveExpenseError,
  $saveExpensePending,
  deleteExpenseRequested,
  saveExpenseRequested,
} from '@/features/expense';

import { roomPageMounted, roomPageUnmounted } from '../store/room-page-store';

export const useRoomPage = (roomId: string) => {
  const {
    room,
    members,
    expenses,
    balances,
    transfers,
    isLoading,
    loadError,
    isAddingMember,
    addMemberError,
    isSavingExpense,
    saveExpenseError,
    deletingExpenseIds,
    deleteExpenseError,
    isSocketConnected,
    onlineCount,
    socketError,
    mount,
    unmount,
    reload,
    requestAddMember,
    requestSaveExpense,
    requestDeleteExpense,
  } = useUnit({
    room: $room,
    members: $members,
    expenses: $expenses,
    balances: $balances,
    transfers: $transfers,
    isLoading: $loadRoomPending,
    loadError: $loadRoomError,
    isAddingMember: $addMemberPending,
    addMemberError: $addMemberError,
    isSavingExpense: $saveExpensePending,
    saveExpenseError: $saveExpenseError,
    deletingExpenseIds: $deletingExpenseIds,
    deleteExpenseError: $deleteExpenseError,
    isSocketConnected: $isSocketConnected,
    onlineCount: $onlineCount,
    socketError: $socketError,
    mount: roomPageMounted,
    unmount: roomPageUnmounted,
    reload: loadRoomRequested,
    requestAddMember: addMemberRequested,
    requestSaveExpense: saveExpenseRequested,
    requestDeleteExpense: deleteExpenseRequested,
  });

  useEffect(() => {
    mount(roomId);

    return () => {
      unmount(roomId);
    };
  }, [roomId, mount, unmount]);

  return {
    room,
    members,
    expenses,
    balances,
    transfers,
    isLoading,
    loadError,
    isAddingMember,
    addMemberError,
    isSavingExpense,
    saveExpenseError,
    deletingExpenseIds,
    deleteExpenseError,
    isSocketConnected,
    onlineCount,
    socketError,

    reload() {
      reload(roomId);
    },

    addMember(name: string) {
      requestAddMember({
        roomId,
        dto: {
          name,
        },
      });
    },

    saveExpense(dto: CreateExpenseDto) {
      requestSaveExpense({
        roomId,
        dto,
      });
    },

    deleteExpense(expenseId: string) {
      requestDeleteExpense({
        roomId,
        expenseId,
      });
    },

    isExpenseDeleting(expenseId: string) {
      return deletingExpenseIds.includes(expenseId);
    },
  };
};
