import api from './api';
import { CastingCall, Application, ApiResponse } from '@/types';

export const castingService = {
  async getCastingCalls(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    location?: string;
  }): Promise<ApiResponse<{ castingCalls: CastingCall[]; total: number; hasMore: boolean }>> {
    const response = await api.get('/casting', { params });
    return response.data;
  },

  async getCastingCall(id: string): Promise<ApiResponse<CastingCall>> {
    const response = await api.get(`/casting/${id}`);
    return response.data;
  },

  async applyToCasting(castingCallId: string, applicationData: {
    message?: string;
    videoUrl?: string;
    portfolioUrl?: string;
  }): Promise<ApiResponse<Application>> {
    const response = await api.post(`/casting/${castingCallId}/apply`, applicationData);
    return response.data;
  },

  async getMyApplications(): Promise<ApiResponse<Application[]>> {
    const response = await api.get('/casting/applications/my');
    return response.data;
  },

  async searchCastingCalls(query: string, filters?: Record<string, string>): Promise<ApiResponse<CastingCall[]>> {
    const response = await api.get('/casting/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  },
};
