import { apiClient } from '@/shared/api/base-api';
import type { CreateRoomDto, Room, RoomDetails } from '@shared/types';

export const roomApi = {
  async getRoom(roomId: string): Promise<RoomDetails> {
    const response = await apiClient.get<RoomDetails>(`/api/rooms/${roomId}`);

    return response.data;
  },

  async createRoom(dto: CreateRoomDto): Promise<Room> {
    const response = await apiClient.post<Room>('/api/rooms', dto);

    return response.data;
  },
};
