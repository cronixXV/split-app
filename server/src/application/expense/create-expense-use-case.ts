import {
  IExpenseRepository,
  IMemberRepository,
  IRoomRepository,
} from '../../domain/repositories';
import { CreateExpenseDto } from '@shared/types';
import { IExpenseEntity } from '../../domain/entities';
import { inject, injectable } from 'tsyringe';

@injectable()
export class CreateExpenseUseCase {
  constructor(
    @inject('IExpenseRepository') private expenseRepository: IExpenseRepository,
    @inject('IMemberRepository') private memberRepository: IMemberRepository,
    @inject('IRoomRepository') private roomRepository: IRoomRepository
  ) {}

  async execute(
    roomId: string,
    dto: CreateExpenseDto
  ): Promise<IExpenseEntity> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');

    const members = await this.memberRepository.findByRoomId(roomId);
    const memberIds = members.map(m => m.id);

    if (!memberIds.includes(dto.paidBy)) {
      throw new Error('paidBy member not found in room');
    }

    const invalidMembers = dto.split.filter(id => !memberIds.includes(id));
    if (invalidMembers.length > 0) {
      throw new Error('Some split members not found in room');
    }

    if (dto.amount <= 0) throw new Error('Amount must be positive');
    if (dto.split.length === 0)
      throw new Error('Split must include at least one member');

    return this.expenseRepository.create({
      roomId,
      paidBy: dto.paidBy,
      amount: dto.amount,
      description: dto.description,
      split: dto.split,
    });
  }
}
