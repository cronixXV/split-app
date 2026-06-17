import {
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_DESCRIPTION_MIN_LENGTH,
  MAX_EXPENSE_AMOUNT,
  type CreateExpenseDto,
} from '@shared/types';

import type { IExpenseEntity } from '../../domain/entities';
import type {
  IExpenseRepository,
  IMemberRepository,
  IRoomRepository,
} from '../../domain/repositories';

import { hasAtMostTwoDecimalPlaces } from '../../domain/validation/money-validation';
import { inject, injectable } from 'tsyringe';
import { NotFoundError, ValidationError } from '../errors';

@injectable()
export class CreateExpenseUseCase {
  constructor(
    @inject('IExpenseRepository')
    private readonly expenseRepository: IExpenseRepository,

    @inject('IMemberRepository')
    private readonly memberRepository: IMemberRepository,

    @inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository
  ) {}

  async execute(
    roomId: string,
    dto: CreateExpenseDto
  ): Promise<IExpenseEntity> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (!Number.isFinite(dto.amount)) {
      throw new ValidationError('Amount must be a finite number');
    }

    if (dto.amount <= 0) {
      throw new ValidationError('Amount must be positive');
    }

    if (dto.amount > MAX_EXPENSE_AMOUNT) {
      throw new ValidationError(`Amount must not exceed ${MAX_EXPENSE_AMOUNT}`);
    }

    if (!hasAtMostTwoDecimalPlaces(dto.amount)) {
      throw new ValidationError(
        'Amount must contain no more than two decimal places'
      );
    }

    const description = dto.description.trim();

    if (description.length < EXPENSE_DESCRIPTION_MIN_LENGTH) {
      throw new ValidationError(
        `Description must contain at least ${EXPENSE_DESCRIPTION_MIN_LENGTH} characters`
      );
    }

    if (description.length > EXPENSE_DESCRIPTION_MAX_LENGTH) {
      throw new ValidationError(
        `Description must contain no more than ${EXPENSE_DESCRIPTION_MAX_LENGTH} characters`
      );
    }

    if (dto.split.length === 0) {
      throw new ValidationError('Split must include at least one member');
    }

    const uniqueMemberIds = new Set(dto.split);

    if (uniqueMemberIds.size !== dto.split.length) {
      throw new ValidationError('Split members must be unique');
    }

    const members = await this.memberRepository.findByRoomId(roomId);

    const roomMemberIds = new Set(members.map(member => member.id));

    if (!roomMemberIds.has(dto.paidBy)) {
      throw new ValidationError('Payer must be a member of the room');
    }

    const invalidMemberIds = dto.split.filter(
      memberId => !roomMemberIds.has(memberId)
    );

    if (invalidMemberIds.length > 0) {
      throw new ValidationError('All split members must belong to the room', {
        invalidMemberIds,
      });
    }
    return this.expenseRepository.create({
      roomId,
      paidBy: dto.paidBy,
      amount: dto.amount,
      description,
      split: dto.split,
    });
  }
}
