/**
 * API client for fetching live prices from the Cloudflare Worker proxy.
 *
 * IMPORTANT: replace PROXY_URL with your actual worker URL after deployment.
 * Example: https://copper-api.yourname.workers.dev
 */

// Read from build-time env or fall back to placeholder.
// Vite injects VITE_* variables at build time.
const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'https://copper-api.REPLACE-ME.workers.dev';

/**
 * Symbols mapping — Twelve Data notation.
 * NOTE: Twelve Data does NOT use Yahoo-style futures symbols (HG=F, GC=F, ...).
 * Metals are spot pairs:
 *   XCU/USD — Copper spot   (requires Grow/Venture plan)
 *   XAU/USD — Gold spot     (available on the free plan)
 *   XAG/USD — Silver spot   (requires Grow/Venture plan)
 * On the free plan only XAU/USD returns data; copper & silver fall back to "—"
 * and will light up automatically once the account is on a paid plan.
 */
export const SYMBOLS = {
  COPPER: 'XCU/USD',
  GOLD: 'XAU/USD',
  SILVER: 'XAG/USD',
};

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response: ${text.slice(0, 100)}`);
  }
}

/**
 * Fetch a single quote.
 * Returns: { symbol, price, change, percent_change, datetime, volume }
 */
export async function fetchQuote(symbol) {
  const res = await fetch(`${PROXY_URL}/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Quote fetch failed: ${res.status}`);
  const data = await safeJson(res);
  if (data.status === 'error') throw new Error(data.message || 'API error');
  return {
    symbol: data.symbol,
    price: parseFloat(data.close),
    open: parseFloat(data.open),
    high: parseFloat(data.high),
    low: parseFloat(data.low),
    change: parseFloat(data.change),
    percent_change: parseFloat(data.percent_change),
    datetime: data.datetime,
    volume: data.volume ? parseInt(data.volume) : null,
  };
}

/**
 * Fetch quotes for multiple symbols in parallel.
 * Returns: { 'HG=F': {price, change, ...}, 'GC=F': {...}, ... }
 */
export async function fetchQuotes(symbols) {
  const results = await Promise.allSettled(symbols.map(s => fetchQuote(s)));
  const out = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      out[symbols[i]] = r.value;
    } else {
      console.warn(`Failed to fetch ${symbols[i]}:`, r.reason?.message);
    }
  });
  return out;
}

/**
 * Fetch historical time series.
 * Returns: array of { datetime, open, high, low, close, volume }, newest first.
 */
export async function fetchTimeSeries(symbol, interval = '1day', outputsize = 30) {
  const url = `${PROXY_URL}/timeseries?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Time series fetch failed: ${res.status}`);
  const data = await safeJson(res);
  if (data.status === 'error') throw new Error(data.message || 'API error');
  return (data.values || []).map(v => ({
    datetime: v.datetime,
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    volume: v.volume ? parseInt(v.volume) : null,
  }));
}
