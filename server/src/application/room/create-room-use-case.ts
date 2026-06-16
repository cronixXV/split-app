import { IRoomRepository } from '../../domain/repositories';
import { IRoomEntity } from '../../domain/entities';
import { inject, injectable } from 'tsyringe';

@injectable()
export class CreateRoomUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository
  ) {}

  async execute(name: string): Promise<IRoomEntity> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Room name is required');
    return this.roomRepository.create(trimmed);
  }
}
