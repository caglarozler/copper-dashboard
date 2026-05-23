import { useState, useEffect } from 'react';
import { fetchQuotes, SYMBOLS } from '../api/twelveData';

const DEFAULT_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for live price data.
 * Automatically refetches at the given interval.
 * Returns: { data, loading, error, updatedAt, refresh }
 */
export function useLivePrices(symbols = [SYMBOLS.COPPER, SYMBOLS.GOLD, SYMBOLS.SILVER], refreshMs = DEFAULT_REFRESH_MS) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const prices = await fetchQuotes(symbols);
      if (Object.keys(prices).length === 0) {
        throw new Error('No data returned');
      }
      setData(prices);
      setUpdatedAt(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
      console.error('useLivePrices error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, refreshMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(','), refreshMs]);

  return { data, loading, error, updatedAt, refresh: load };
}
