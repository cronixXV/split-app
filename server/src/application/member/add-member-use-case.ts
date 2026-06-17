import { IMemberRepository, IRoomRepository } from '../../domain/repositories';
import { IMemberEntity } from '../../domain/entities';
import { inject, injectable } from 'tsyringe';
import { MEMBER_NAME_MAX_LENGTH, MEMBER_NAME_MIN_LENGTH } from '@shared/types';
import { NotFoundError, ValidationError } from '../errors';

@injectable()
export class AddMemberUseCase {
  constructor(
    @inject('IMemberRepository') private memberRepository: IMemberRepository,
    @inject('IRoomRepository') private roomRepository: IRoomRepository
  ) {}

  async execute(roomId: string, name: string): Promise<IMemberEntity> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const normalizedName = name.trim();

    if (normalizedName.length < MEMBER_NAME_MIN_LENGTH) {
      throw new ValidationError(
        `Name must contain at least ${MEMBER_NAME_MIN_LENGTH} characters`
      );
    }

    if (normalizedName.length > MEMBER_NAME_MAX_LENGTH) {
      throw new ValidationError(
        `Name must contain no more than ${MEMBER_NAME_MAX_LENGTH} characters`
      );
    }

    return this.memberRepository.create(roomId, normalizedName);
  }
}
