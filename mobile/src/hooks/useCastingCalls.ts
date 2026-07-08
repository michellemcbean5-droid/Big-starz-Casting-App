import { useState, useEffect, useCallback } from 'react';
import { castingService } from '@/services/casting';
import { CastingCall } from '@/types';

export function useCastingCalls() {
  const [castingCalls, setCastingCalls] = useState<CastingCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<{
    type?: string;
    search?: string;
    location?: string;
  }>({});

  const fetchCastingCalls = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (loading && !isRefresh) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await castingService.getCastingCalls({
        page: pageNum,
        limit: 10,
        ...filters,
      });

      if (response.success && response.data) {
        if (isRefresh || pageNum === 1) {
          setCastingCalls(response.data.castingCalls);
        } else {
          setCastingCalls((prev) => [...prev, ...response.data!.castingCalls]);
        }
        setHasMore(response.data.hasMore);
        setPage(pageNum);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch casting calls');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, loading]);

  const refresh = useCallback(() => {
    setPage(1);
    fetchCastingCalls(1, true);
  }, [fetchCastingCalls]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchCastingCalls(page + 1);
    }
  }, [loading, hasMore, page, fetchCastingCalls]);

  const updateFilters = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
    setHasMore(true);
  }, []);

  useEffect(() => {
    fetchCastingCalls(1);
  }, [filters]);

  return {
    castingCalls,
    loading,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    updateFilters,
  };
}
