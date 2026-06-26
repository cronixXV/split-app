import { apiClient } from '@/shared/api/base-api';
import type { CreateExpenseDto, Expense } from '@shared/types';

export const expenseApi = {
  async saveExpense(roomId: string, dto: CreateExpenseDto): Promise<Expense> {
    const response = await apiClient.post<Expense>(
      `/api/rooms/${roomId}/expenses`,
      dto
    );

    return response.data;
  },

  async deleteExpense(roomId: string, expenseId: string): Promise<void> {
    await apiClient.delete(`/api/rooms/${roomId}/expenses/${expenseId}`);
  },
};
