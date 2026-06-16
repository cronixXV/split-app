import { inject, injectable } from 'tsyringe';
import { IExpenseRepository } from '../../domain/repositories';

@injectable()
export class DeleteExpenseUseCase {
  constructor(
    @inject('IExpenseRepository') private expenseRepository: IExpenseRepository
  ) {}

  async execute(expenseId: string): Promise<void> {
    const expense = await this.expenseRepository.findById(expenseId);
    if (!expense) throw new Error('Expense not found');
    await this.expenseRepository.delete(expenseId);
  }
}
