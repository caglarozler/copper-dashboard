import { useState, useEffect, useCallback } from 'react';
import { fetchAnalysis, refreshAnalysis } from '../api/analysisApi';

/**
 * Hook v2 for AI analysis.
 *
 * Returns:
 *   analysis      — current analysis JSON or null
 *   loading       — true on first load
 *   refreshing    — true while regenerating
 *   refreshProgress — number 0-100 estimated progress during refresh
 *   error         — error string or null
 *   generatedAt   — Date when analysis was generated
 *   ageHours      — age in hours
 *   isStale       — true if > 24h old
 *   refresh(force?) — regenerate; if force=true, bypasses all caches
 *   reload()      — re-fetch from server bypassing local cache
 */
export function useAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [error, setError] = useState(null);

  const load = useCallback(async (bypassLocal = false) => {
    try {
      setLoading(true);
      const data = await fetchAnalysis({
        bypassLocalCache: bypassLocal,
        bypassCdnCache: bypassLocal,
      });
      setAnalysis(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    let progressTimer;
    try {
      setRefreshing(true);
      setRefreshProgress(5);

      // Simulate progress (real backend doesn't stream)
      // Yahoo fetch ~3sec, Claude API ~5sec, total ~8sec
      progressTimer = setInterval(() => {
        setRefreshProgress(p => Math.min(p + 7, 90));
      }, 800);

      const data = await refreshAnalysis();
      setRefreshProgress(100);
      setAnalysis(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setRefreshing(false);
      setTimeout(() => setRefreshProgress(0), 800);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  const generatedAt = analysis?._meta?.generated_at
    ? new Date(analysis._meta.generated_at)
    : null;
  const ageMs = generatedAt ? Date.now() - generatedAt.getTime() : null;
  const ageHours = ageMs ? ageMs / (3600 * 1000) : null;
  const isStale = ageHours != null && ageHours > 24;

  return {
    analysis,
    loading,
    refreshing,
    refreshProgress,
    error,
    generatedAt,
    ageHours,
    isStale,
    refresh,
    reload: () => load(true),
  };
}
