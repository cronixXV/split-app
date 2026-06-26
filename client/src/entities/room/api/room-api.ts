import { apiClient } from '@/shared/api/base-api';
import type { RoomDetails } from '@shared/types';

export const roomApi = {
  async getRoom(roomId: string): Promise<RoomDetails> {
    const response = await apiClient.get<RoomDetails>(`/api/rooms/${roomId}`);

    return response.data;
  },
};
