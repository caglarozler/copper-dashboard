/**
 * Historical data fetching + localStorage caching.
 *
 * Strategy:
 *  - Cache TTL: 24 hours (history doesn't change intraday for daily bars)
 *  - On first load: try cache → fall back to fetch → fall back to static data
 *  - Manual refresh: bypass cache, force refetch
 *  - Storage key per symbol+range+interval combination
 */

const CACHE_PREFIX = 'copperdash:history:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'https://copper-api.caglarozler.workers.dev';

function cacheKey(symbol, range, interval) {
  return `${CACHE_PREFIX}${symbol}:${range}:${interval}`;
}

function readCache(symbol, range, interval) {
  try {
    const raw = localStorage.getItem(cacheKey(symbol, range, interval));
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    const age = Date.now() - savedAt;
    if (age > CACHE_TTL_MS) return null;
    return { data, savedAt, age };
  } catch {
    return null;
  }
}

function writeCache(symbol, range, interval, data) {
  try {
    localStorage.setItem(
      cacheKey(symbol, range, interval),
      JSON.stringify({ data, savedAt: Date.now() })
    );
  } catch (e) {
    console.warn('Cache write failed (quota?):', e.message);
  }
}

export function clearHistoryCache() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

/**
 * Fetch historical OHLC for a symbol via worker proxy.
 *
 * @param {string} symbol      Yahoo symbol (e.g., 'HG=F')
 * @param {string} range       '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y'
 * @param {string} interval    '1d' | '1wk' | '1mo'
 * @param {object} options     { forceRefresh: bool }
 * @returns {Promise<{data: Array, fromCache: boolean, savedAt: number}>}
 */
export async function fetchHistory(symbol, range = '1y', interval = '1d', options = {}) {
  if (!options.forceRefresh) {
    const cached = readCache(symbol, range, interval);
    if (cached) {
      return { data: cached.data, fromCache: true, savedAt: cached.savedAt };
    }
  }

  const url = `${PROXY_URL}/yahoo/history?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`History fetch ${symbol}: HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`History ${symbol}: ${data.error}`);

  writeCache(symbol, range, interval, data);
  return { data, fromCache: false, savedAt: Date.now() };
}

/**
 * Fetch history for multiple symbols in parallel.
 * Returns: { 'HG=F': {data, fromCache, savedAt}, ... }
 * Failed symbols return { error: '...' }.
 */
export async function fetchHistoryBatch(symbols, range = '1y', interval = '1d', options = {}) {
  const results = await Promise.allSettled(
    symbols.map(s => fetchHistory(s, range, interval, options).then(r => [s, r]))
  );
  const out = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      out[r.value[0]] = r.value[1];
    } else {
      out[symbols[i]] = { error: r.reason?.message || 'fetch failed' };
    }
  });
  return out;
}
