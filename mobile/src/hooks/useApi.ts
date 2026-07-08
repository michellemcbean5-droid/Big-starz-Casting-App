import { useState, useCallback } from 'react';
import api from '@/services/api';
import { ApiResponse } from '@/types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async <R = T>(
    apiCall: () => Promise<{ data: ApiResponse<R> }>
  ): Promise<R | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiCall();
      if (response.data.success) {
        setState({ data: response.data.data as unknown as T, loading: false, error: null });
        return response.data.data as unknown as R;
      } else {
        throw new Error(response.data.message || 'Request failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
