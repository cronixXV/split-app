import { apiClient } from '@/shared/api/base-api';
import type { AddMemberDto, Member } from '@shared/types';

export const memberApi = {
  async addMember(roomId: string, dto: AddMemberDto): Promise<Member> {
    const response = await apiClient.post<Member>(
      `/api/rooms/${roomId}/members`,
      dto
    );

    return response.data;
  },
};
