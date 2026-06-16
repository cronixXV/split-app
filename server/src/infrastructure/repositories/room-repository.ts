import { IRoomEntity } from '../../domain/entities';
import { IRoomRepository } from '../../domain/repositories';
import { Room } from '../database/models';

export class RoomRepository implements IRoomRepository {
  async create(name: string): Promise<IRoomEntity> {
    const room = await Room.create({ name });
    return this.toEntity(room);
  }

  async findById(id: string): Promise<IRoomEntity | null> {
    const room = await Room.findByPk(id);
    return room ? this.toEntity(room) : null;
  }

  private toEntity(room: Room): IRoomEntity {
    return {
      id: room.id,
      name: room.name,
      createdAt: room.createdAt,
    };
  }
}
