import type { IExpenseEntity } from '../entities';

export interface IExpenseRepository {
  create(
    data: Omit<IExpenseEntity, 'id' | 'createdAt'>
  ): Promise<IExpenseEntity>;
  findByRoomId(roomId: string): Promise<IExpenseEntity[]>;
  findById(id: string): Promise<IExpenseEntity | null>;
  deleteByIdAndRoomId(expenseId: string, roomId: string): Promise<boolean>;
}
