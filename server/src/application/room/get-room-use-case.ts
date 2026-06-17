import {
  IRoomRepository,
  IMemberRepository,
  IExpenseRepository,
} from '../../domain/repositories';

import { RoomDetails } from '@shared/types';
import {
  calculateBalances,
  minimizeTransfers,
} from '../../domain/services/debt-service';
import { inject, injectable } from 'tsyringe';
import { NotFoundError } from '../errors';

@injectable()
export class GetRoomUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository,
    @inject('IMemberRepository') private memberRepository: IMemberRepository,
    @inject('IExpenseRepository') private expenseRepository: IExpenseRepository
  ) {}

  async execute(roomId: string): Promise<RoomDetails> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const members = await this.memberRepository.findByRoomId(roomId);
    const expenses = await this.expenseRepository.findByRoomId(roomId);

    const balances = calculateBalances(expenses, members);
    const transfers = minimizeTransfers(balances, members);

    return {
      room: {
        id: room.id,
        name: room.name,
        createdAt: room.createdAt.toISOString(),
      },
      members: members.map(m => ({
        id: m.id,
        roomId: m.roomId,
        name: m.name,
      })),
      expenses: expenses.map(e => ({
        id: e.id,
        roomId: e.roomId,
        paidBy: e.paidBy,
        amount: e.amount,
        description: e.description,
        split: e.split,
        createdAt: e.createdAt.toISOString(),
      })),
      balances,
      transfers,
    };
  }
}
