import { IMemberRepository, IRoomRepository } from '../../domain/repositories';
import { IMemberEntity } from '../../domain/entities';
import { inject, injectable } from 'tsyringe';

@injectable()
export class AddMemberUseCase {
  constructor(
    @inject('IMemberRepository') private memberRepository: IMemberRepository,
    @inject('IRoomRepository') private roomRepository: IRoomRepository
  ) {}

  async execute(roomId: string, name: string): Promise<IMemberEntity> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');

    const trimmed = name.trim();
    if (!trimmed) throw new Error('Member name is required');

    return this.memberRepository.create(roomId, trimmed);
  }
}
