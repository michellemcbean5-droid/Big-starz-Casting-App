import api from './api';
import { AiGeneration, ApiResponse } from '@/types';

export const aiService = {
  async generateScene(params: {
    prompt: string;
    style?: string;
    duration?: number;
  }): Promise<ApiResponse<AiGeneration>> {
    const response = await api.post('/ai/generate/scene', params);
    return response.data;
  },

  async generateReel(params: {
    clips: string[];
    style?: string;
    music?: string;
  }): Promise<ApiResponse<AiGeneration>> {
    const response = await api.post('/ai/generate/reel', params);
    return response.data;
  },

  async generateMusicVideo(params: {
    songUrl: string;
    visuals: string;
    style?: string;
  }): Promise<ApiResponse<AiGeneration>> {
    const response = await api.post('/ai/generate/music-video', params);
    return response.data;
  },

  async generateDigitalTwin(params: {
    images: string[];
    consent: boolean;
  }): Promise<ApiResponse<AiGeneration>> {
    const response = await api.post('/ai/generate/digital-twin', params);
    return response.data;
  },

  async getGenerationStatus(id: string): Promise<ApiResponse<AiGeneration>> {
    const response = await api.get(`/ai/generations/${id}`);
    return response.data;
  },

  async getMyGenerations(): Promise<ApiResponse<AiGeneration[]>> {
    const response = await api.get('/ai/generations/my');
    return response.data;
  },

  async cancelGeneration(id: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/ai/generations/${id}/cancel`);
    return response.data;
  },
};
