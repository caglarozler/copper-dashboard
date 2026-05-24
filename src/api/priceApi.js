/**
 * Live price API client — v3 (with DXY US Dollar Index).
 */

const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'https://copper-api.caglarozler.workers.dev';

// Yahoo Finance symbols
export const SYMBOLS = {
  COPPER: 'HG=F',     // Copper Futures (COMEX), $/lb
  GOLD:   'GC=F',     // Gold Futures (COMEX), $/oz
  SILVER: 'SI=F',     // Silver Futures (COMEX), $/oz
  NATGAS: 'NG=F',     // Natural Gas Futures (NYMEX), $/MMBtu
  WTI:    'CL=F',     // Crude Oil WTI Futures (NYMEX), $/bbl
  DXY:    'DX-Y.NYB', // US Dollar Index (ICE)
};

// Display metadata. `prefix: ''` overrides default '$' (for index values).
export const SYMBOL_META = {
  'HG=F':     { name: 'МЕДЬ',          unit: '$/lb',    precision: 4, color: '#e6b450', prefix: '$' },
  'GC=F':     { name: 'ЗОЛОТО',        unit: '$/oz',    precision: 2, color: '#ffd700', prefix: '$' },
  'SI=F':     { name: 'СЕРЕБРО',       unit: '$/oz',    precision: 3, color: '#c0c0c0', prefix: '$' },
  'NG=F':     { name: 'ПРИРОДНЫЙ ГАЗ', unit: '$/MMBtu', precision: 3, color: '#58a6ff', prefix: '$' },
  'CL=F':     { name: 'НЕФТЬ WTI',     unit: '$/bbl',   precision: 2, color: '#3fb950', prefix: '$' },
  'DX-Y.NYB': { name: 'DXY',           unit: 'индекс',  precision: 2, color: '#d29922', prefix: '',
                threshold: { value: 105, label: 'крит. уровень', color: '#f85149' } },
};

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response: ${text.slice(0, 100)}`);
  }
}

export async function fetchQuote(symbol) {
  const res = await fetch(`${PROXY_URL}/yahoo?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Quote ${symbol}: HTTP ${res.status}`);
  const data = await safeJson(res);
  if (data.error) throw new Error(`Quote ${symbol}: ${data.error}`);
  return data;
}

export async function fetchQuotes(symbols) {
  const params = symbols.map(s => encodeURIComponent(s)).join(',');
  const res = await fetch(`${PROXY_URL}/yahoo/batch?symbols=${params}`);
  if (!res.ok) throw new Error(`Batch fetch failed: HTTP ${res.status}`);
  return await safeJson(res);
}

export async function fetchHistory(symbol, range = '1mo', interval = '1d') {
  const url = `${PROXY_URL}/yahoo/history?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`History ${symbol}: HTTP ${res.status}`);
  const data = await safeJson(res);
  if (data.error) throw new Error(`History ${symbol}: ${data.error}`);
  return data;
}
