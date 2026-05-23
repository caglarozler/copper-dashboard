/**
 * Live price API client — v2 (Yahoo Finance via worker proxy).
 *
 * Replaces the old Twelve Data flow. Uses Yahoo Finance for all metals + nat gas.
 * No API key needed on the client — the worker handles everything.
 */

const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'https://copper-api.caglarozler.workers.dev';

// Yahoo Finance futures symbols (these are the actual front-month contract tickers)
export const SYMBOLS = {
  COPPER: 'HG=F',  // Copper Futures (COMEX), $/lb
  GOLD: 'GC=F',    // Gold Futures (COMEX), $/oz
  SILVER: 'SI=F',  // Silver Futures (COMEX), $/oz
  NATGAS: 'NG=F',  // Natural Gas Futures (NYMEX), $/MMBtu
  WTI: 'CL=F',     // Crude Oil WTI Futures (NYMEX), $/bbl
};

// Display metadata for symbols
export const SYMBOL_META = {
  'HG=F': { name: 'МЕДЬ',         unit: '$/lb',    precision: 4, color: '#e6b450' },
  'GC=F': { name: 'ЗОЛОТО',       unit: '$/oz',    precision: 2, color: '#ffd700' },
  'SI=F': { name: 'СЕРЕБРО',      unit: '$/oz',    precision: 3, color: '#c0c0c0' },
  'NG=F': { name: 'ПРИРОДНЫЙ ГАЗ', unit: '$/MMBtu', precision: 3, color: '#58a6ff' },
  'CL=F': { name: 'НЕФТЬ WTI',    unit: '$/bbl',   precision: 2, color: '#3fb950' },
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
 * Fetch a single quote from Yahoo Finance via the worker proxy.
 * Returns: { symbol, price, change, percent_change, datetime, ... }
 */
export async function fetchQuote(symbol) {
  const res = await fetch(`${PROXY_URL}/yahoo?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Quote ${symbol}: HTTP ${res.status}`);
  const data = await safeJson(res);
  if (data.error) throw new Error(`Quote ${symbol}: ${data.error}`);
  return data;
}

/**
 * Fetch multiple quotes in one batch request (parallelized server-side).
 * Returns: { 'HG=F': {price, ...}, 'GC=F': {...}, ... }
 *
 * Quotes that fail are returned as { error: '...' } objects — the caller
 * should check for `.error` field on each entry.
 */
export async function fetchQuotes(symbols) {
  const params = symbols.map(s => encodeURIComponent(s)).join(',');
  const res = await fetch(`${PROXY_URL}/yahoo/batch?symbols=${params}`);
  if (!res.ok) throw new Error(`Batch fetch failed: HTTP ${res.status}`);
  return await safeJson(res);
}

/**
 * Fetch historical OHLC data.
 *
 * @param symbol  Yahoo symbol (e.g., 'HG=F')
 * @param range   '1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'
 * @param interval '1m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo'
 * Returns: array of { datetime, open, high, low, close, volume }, oldest first.
 */
export async function fetchHistory(symbol, range = '1mo', interval = '1d') {
  const url = `${PROXY_URL}/yahoo/history?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`History ${symbol}: HTTP ${res.status}`);
  const data = await safeJson(res);
  if (data.error) throw new Error(`History ${symbol}: ${data.error}`);
  return data;
}
