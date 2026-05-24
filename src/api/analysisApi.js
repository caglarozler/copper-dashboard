/**
 * Analysis API client v2 — adds localStorage offline cache layer.
 *
 * Two-tier caching:
 *   1. localStorage (browser, 1h TTL) — instant load, offline support
 *   2. Cloudflare KV (server, 24h+ TTL) — shared across devices
 */

const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'https://copper-api.caglarozler.workers.dev';
const LOCAL_CACHE_KEY = 'copperdash:analysis:current';
const LOCAL_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function readLocalCache() {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > LOCAL_CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeLocalCache(data) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {}
}

export function clearAnalysisCache() {
  try { localStorage.removeItem(LOCAL_CACHE_KEY); } catch {}
}

/**
 * Get current cached analysis. Returns null if none exists yet.
 *
 * @param {object} options { bypassLocalCache?: bool, bypassCdnCache?: bool }
 */
export async function fetchAnalysis(options = {}) {
  // Try localStorage first unless explicitly bypassed
  if (!options.bypassLocalCache) {
    const local = readLocalCache();
    if (local) return local;
  }

  const url = options.bypassCdnCache
    ? `${PROXY_URL}/analysis?fresh=1`
    : `${PROXY_URL}/analysis`;

  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Analysis fetch: HTTP ${res.status}`);

  const data = await res.json();
  writeLocalCache(data);
  return data;
}

/**
 * Force regenerate analysis via Claude API.
 * COSTS API TOKENS (~$0.015 per call).
 */
export async function refreshAnalysis() {
  const res = await fetch(`${PROXY_URL}/analysis/refresh`, {
    method: 'POST',
    cache: 'no-store',
  });
  if (!res.ok) {
    const errText = await res.text();
    let errMsg;
    try { errMsg = JSON.parse(errText).error; } catch { errMsg = errText.slice(0, 200); }
    throw new Error(`Refresh failed: ${errMsg}`);
  }
  const data = await res.json();
  writeLocalCache(data);
  return data;
}
