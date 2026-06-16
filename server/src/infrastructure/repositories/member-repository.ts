import { IMemberRepository } from '../../domain/repositories';
import { IMemberEntity } from '../../domain/entities';
import { Member } from '../database/models';

export class MemberRepository implements IMemberRepository {
  async create(roomId: string, name: string): Promise<IMemberEntity> {
    const member = await Member.create({ roomId, name });
    return this.toEntity(member);
  }

  async findByRoomId(roomId: string): Promise<IMemberEntity[]> {
    const members = await Member.findAll({ where: { roomId } });
    return members.map(this.toEntity);
  }

  private toEntity(member: Member): IMemberEntity {
    return {
      id: member.id,
      roomId: member.roomId,
      name: member.name,
    };
  }
}
