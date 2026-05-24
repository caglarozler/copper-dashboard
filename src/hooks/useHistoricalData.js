import { useState, useEffect, useCallback } from 'react';
import { fetchHistoryBatch } from '../api/historyApi';
import { SYMBOLS } from '../api/priceApi';

const DEFAULT_SYMBOLS = [SYMBOLS.COPPER, SYMBOLS.GOLD, SYMBOLS.SILVER];

/**
 * Hook for historical price + ratio data.
 *
 * Returns:
 *   priceHistory   — array of { date, price, low, high } for COPPER (newest format compatible)
 *   ratioHistory   — array of { date, cgRatio, csRatio } from real data
 *   loading        — true during initial fetch
 *   error          — error message
 *   updatedAt      — Date of last successful load (from cache OR fresh)
 *   fromCache      — whether the displayed data is from cache
 *   refresh()      — force refetch (bypass cache)
 */
export function useHistoricalData(symbols = DEFAULT_SYMBOLS, range = '1y', interval = '1wk') {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const symbolsKey = symbols.join(',');

  const load = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const result = await fetchHistoryBatch(symbols, range, interval, { forceRefresh });

      const ok = Object.values(result).some(v => v && !v.error);
      if (!ok) throw new Error('No historical data');

      setRaw(result);

      // Determine cache freshness from the first non-error entry
      const first = Object.values(result).find(v => v && !v.error);
      if (first) {
        setFromCache(first.fromCache);
        setUpdatedAt(new Date(first.savedAt));
      }
      setError(null);
    } catch (e) {
      setError(e.message);
      console.warn('useHistoricalData:', e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, range, interval]);

  useEffect(() => {
    load(false);
  }, [load]);

  // Derive structured outputs from raw OHLC
  const priceHistory = raw?.[SYMBOLS.COPPER] && !raw[SYMBOLS.COPPER].error
    ? raw[SYMBOLS.COPPER].data.map(d => ({
        date: formatDate(d.datetime),
        rawDate: d.datetime,
        price: d.close,
        low: d.low,
        high: d.high,
      }))
    : null;

  const ratioHistory = (
    raw?.[SYMBOLS.COPPER] && !raw[SYMBOLS.COPPER].error &&
    raw?.[SYMBOLS.GOLD]   && !raw[SYMBOLS.GOLD].error &&
    raw?.[SYMBOLS.SILVER] && !raw[SYMBOLS.SILVER].error
  ) ? alignAndComputeRatios(
        raw[SYMBOLS.COPPER].data,
        raw[SYMBOLS.GOLD].data,
        raw[SYMBOLS.SILVER].data,
      )
    : null;

  return {
    raw,
    priceHistory,
    ratioHistory,
    loading,
    error,
    updatedAt,
    fromCache,
    refresh: () => load(true),
  };
}

/**
 * Convert ISO datetime "2026-05-23" to short Russian-style label "Май'26 н3".
 * For weekly intervals — uses week number within month.
 */
function formatDate(iso) {
  const d = new Date(iso);
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const m = months[d.getUTCMonth()];
  const yr = String(d.getUTCFullYear()).slice(-2);
  const week = Math.ceil(d.getUTCDate() / 7); // n1..n5
  return `${m}'${yr} н${week}`;
}

/**
 * Align three OHLC arrays by date and compute ratios.
 * Yahoo returns oldest→newest.
 */
function alignAndComputeRatios(cu, au, ag) {
  // Build maps by date
  const auMap = new Map(au.map(d => [d.datetime, d.close]));
  const agMap = new Map(ag.map(d => [d.datetime, d.close]));

  return cu
    .filter(d => auMap.has(d.datetime) && agMap.has(d.datetime))
    .map(d => {
      const cuPrice = d.close;
      const auPrice = auMap.get(d.datetime);
      const agPrice = agMap.get(d.datetime);
      return {
        date: formatDate(d.datetime),
        rawDate: d.datetime,
        cu: cuPrice,
        gold: auPrice,
        silver: agPrice,
        cgRatio: parseFloat((cuPrice * 1000 / auPrice).toFixed(4)),
        csRatio: parseFloat((cuPrice / agPrice).toFixed(4)),
      };
    });
}
