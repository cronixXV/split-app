import { IExpenseRepository } from '../../domain/repositories';
import { IExpenseEntity } from '../../domain/entities';
import { Expense } from '../database/models';
import { injectable } from 'tsyringe';

@injectable()
export class ExpenseRepository implements IExpenseRepository {
  async create(
    data: Omit<IExpenseEntity, 'id' | 'createdAt'>
  ): Promise<IExpenseEntity> {
    const expense = await Expense.create({
      roomId: data.roomId,
      paidBy: data.paidBy,
      amount: data.amount,
      description: data.description,
      split: data.split,
    });
    return this.toEntity(expense);
  }

  async findByRoomId(roomId: string): Promise<IExpenseEntity[]> {
    const expenses = await Expense.findAll({
      where: { roomId },
      order: [['createdAt', 'ASC']],
    });
    return expenses.map(e => this.toEntity(e));
  }

  async findById(id: string): Promise<IExpenseEntity | null> {
    const expense = await Expense.findByPk(id);
    return expense ? this.toEntity(expense) : null;
  }

  async delete(id: string): Promise<void> {
    await Expense.destroy({ where: { id } });
  }

  private toEntity(expense: Expense): IExpenseEntity {
    return {
      id: expense.id,
      roomId: expense.roomId,
      paidBy: expense.paidBy,
      amount: Number(expense.amount),
      description: expense.description,
      split: expense.split,
      createdAt: expense.createdAt,
    };
  }
}
