import { IRoomEntity } from '../entities';

export interface IRoomRepository {
  create(name: string): Promise<IRoomEntity>;
  findById(id: string): Promise<IRoomEntity | null>;
}
