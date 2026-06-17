import { inject, injectable } from 'tsyringe';

import type { IExpenseRepository } from '../../domain/repositories';
import { NotFoundError } from '../errors';

@injectable()
export class DeleteExpenseUseCase {
  constructor(
    @inject('IExpenseRepository')
    private readonly expenseRepository: IExpenseRepository
  ) {}

  async execute(roomId: string, expenseId: string): Promise<void> {
    const wasDeleted = await this.expenseRepository.deleteByIdAndRoomId(
      expenseId,
      roomId
    );

    if (!wasDeleted) {
      throw new NotFoundError('Expense not found');
    }
  }
}
