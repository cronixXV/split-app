import { IMemberEntity } from '../entities';

export interface IMemberRepository {
  create(roomId: string, name: string): Promise<IMemberEntity>;
  findByRoomId(roomId: string): Promise<IMemberEntity[]>;
}
