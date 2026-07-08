import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { User } from '@/types';

export function useUser() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  const fetchUser = useCallback(async () => {
    if (!authUser?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/users/${authUser.id}`);
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [authUser?.id]);

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    if (!authUser?.id) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch(`/users/${authUser.id}`, profileData);
      if (response.data.success) {
        setUser(response.data.data);
        return response.data.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, [authUser?.id]);

  return { user, loading, error, fetchUser, updateProfile };
}
