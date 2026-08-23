import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          window.location.href = "/login";
          return Promise.reject(error);
        }
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken } = res.data;
        localStorage.setItem("accessToken", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);


// Skill API
export const skillApi = {
  // Get all skills
  list: (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/skills', { params }),
  
  // Get all skill categories
  listCategories: () => api.get('/skills/categories'),
  
  // Get a specific skill
  getById: (id: string) => api.get(`/skills/${id}`),
  
  // Search skills
  search: (query: string) => api.get('/skills/search', { params: { q: query } }),
  
  // Get skills for a talent
  getByTalent: (talentId: string) => api.get(`/skills/talent/${talentId}`),
  
  // Get skills for a casting call
  getByCastingCall: (callId: string) => api.get(`/skills/casting-call/${callId}`),
  
  // Create a skill (admin)
  create: (data: {
    name: string;
    description?: string;
    category: string;
    tags?: string[];
  }) => api.post('/skills', data),
  
  // Update a skill (admin)
  update: (id: string, data: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    isActive?: boolean;
  }) => api.put(`/skills/${id}`, data),
  
  // Delete a skill (admin)
  delete: (id: string) => api.delete(`/skills/${id}`),
  
  // Add skill to talent
  addToTalent: (data: {
    talentProfileId: string;
    skillId: string;
    proficiency?: string;
    yearsExperience?: number;
  }) => api.post('/skills/talent-skill', data),
  
  // Remove skill from talent
  removeFromTalent: (id: string) => api.delete(`/skills/talent-skill/${id}`),
  
  // Match talent to casting call
  matchTalentToCastingCall: (data: {
    castingCallId: string;
    limit?: number;
  }) => api.post('/skills/match/talent', data),
  
  // Match casting calls to talent
  matchCastingCallToTalent: (data: {
    talentId: string;
    limit?: number;
  }) => api.post('/skills/match/casting-call', data),
};
