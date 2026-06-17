import { IRoomRepository } from '../../domain/repositories';
import { IRoomEntity } from '../../domain/entities';

import { ROOM_NAME_MAX_LENGTH, ROOM_NAME_MIN_LENGTH } from '@shared/types';
import { inject, injectable } from 'tsyringe';
import { ValidationError } from '../errors';

@injectable()
export class CreateRoomUseCase {
  constructor(
    @inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository
  ) {}

  async execute(name: string): Promise<IRoomEntity> {
    const normalizedName = name.trim();

    if (normalizedName.length < ROOM_NAME_MIN_LENGTH) {
      throw new ValidationError(
        `Name must contain at least ${ROOM_NAME_MIN_LENGTH} characters`
      );
    }

    if (normalizedName.length > ROOM_NAME_MAX_LENGTH) {
      throw new ValidationError(
        `Name must contain no more than ${ROOM_NAME_MAX_LENGTH} characters`
      );
    }

    return this.roomRepository.create(normalizedName);
  }
}
