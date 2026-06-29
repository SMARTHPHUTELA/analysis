import { useState, useEffect, useCallback } from 'react';
import { analyticsApi }   from '@/services/api';
import {
  BudgetSummary, DailySpend,
  FeatureBreakdown, ModelBreakdown, UsageLog,
} from '@/types';

export function useSummary(orgId: string) {
  const [data,    setData]    = useState<{
    current_month: BudgetSummary | null;
    history: BudgetSummary[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsApi.summary(orgId);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useDailySpend(orgId: string, days = 30) {
  const [data,    setData]    = useState<DailySpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsApi.daily(orgId, days);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId, days]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useFeatureBreakdown(orgId: string, days = 30) {
  const [data,    setData]    = useState<FeatureBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsApi.features(orgId, days);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId, days]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useModelBreakdown(orgId: string, days = 30) {
  const [data,    setData]    = useState<ModelBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsApi.models(orgId, days);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId, days]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// export function useUsageLogs(orgId: string, limit = 100) {
//   const [data,    setData]    = useState<UsageLog[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error,   setError]   = useState<string | null>(null);
//   const [offset,  setOffset]  = useState(0);

//   const fetch = useCallback(async (newOffset = 0) => {
//     if (!orgId) return;
//     try {
//       setLoading(true);
//       setError(null);
//       const result = await analyticsApi.logs(orgId, limit, newOffset);
//       setData(result);
//       setOffset(newOffset);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [orgId, limit]);

//   useEffect(() => { fetch(0); }, [fetch]);

//   return {
//     data, loading, error, offset,
//     nextPage: () => fetch(offset + limit),
//     prevPage: () => fetch(Math.max(0, offset - limit)),
//     refetch:  () => fetch(offset),
//   };
// }
export function useUsageLogs(orgId: string, limit = 100, autoRefreshMs = 15000) {
  const [data,    setData]    = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [offset,  setOffset]  = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetch = useCallback(async (newOffset = 0) => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsApi.logs(orgId, limit, newOffset);
      setData(result);
      setOffset(newOffset);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId, limit]);

  // Initial fetch
  useEffect(() => { fetch(0); }, [fetch]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefreshMs || !orgId) return;
    const interval = setInterval(() => fetch(offset), autoRefreshMs);
    return () => clearInterval(interval);
  }, [fetch, offset, autoRefreshMs, orgId]);

  return {
    data,
    loading,
    error,
    offset,
    lastUpdated,
    nextPage: () => fetch(offset + limit),
    prevPage: () => fetch(Math.max(0, offset - limit)),
    refetch:  () => fetch(offset),
  };
}