import { useState, useEffect, useCallback } from 'react';
import { fetchQuotes, SYMBOLS } from '../api/priceApi';

const DEFAULT_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

// Full macro context: metals + energy + DXY
const DEFAULT_SYMBOLS = [
  SYMBOLS.COPPER,
  SYMBOLS.GOLD,
  SYMBOLS.SILVER,
  SYMBOLS.NATGAS,
  SYMBOLS.WTI,
  SYMBOLS.DXY,
];

export function useLivePrices(symbols = DEFAULT_SYMBOLS, refreshMs = DEFAULT_REFRESH_MS) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const symbolsKey = symbols.join(',');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchQuotes(symbols);
      const hasAnyData = Object.values(result).some(v => v && !v.error);
      if (!hasAnyData) {
        throw new Error('No live data available');
      }
      setData(result);
      setUpdatedAt(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
      console.warn('useLivePrices:', e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  useEffect(() => {
    load();
    const interval = setInterval(load, refreshMs);
    return () => clearInterval(interval);
  }, [load, refreshMs]);

  return { data, loading, error, updatedAt, refresh: load };
}
