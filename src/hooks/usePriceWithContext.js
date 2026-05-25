import { useLivePrices } from './useLivePrices';
import { useHistoricalData } from './useHistoricalData';

/**
 * Classify quote freshness from an exchange Unix timestamp (seconds).
 * Pure + exported so the live banner can reuse it without re-deriving.
 *
 *   < 5 min                → 'live'
 *   5..60 min              → 'delayed'
 *   > 60 min, Sat/Sun UTC  → 'overnight'   (weekend close — expected gap)
 *   > 60 min, weekday      → 'stale'        (feed genuinely lagging)
 *
 * US market holidays are intentionally NOT modelled: e.g. Memorial Day reads
 * as 'stale', which is technically honest — the feed really is behind.
 */
export function classifyFreshness(timestampSec, now = Date.now()) {
  if (timestampSec == null) return { staleness_min: null, freshness: null };
  const staleness_min = (now / 1000 - timestampSec) / 60;
  let freshness;
  if (staleness_min < 5) {
    freshness = 'live';
  } else if (staleness_min <= 60) {
    freshness = 'delayed';
  } else {
    const day = new Date(now).getUTCDay(); // 0=Sun … 6=Sat
    freshness = (day === 0 || day === 6) ? 'overnight' : 'stale';
  }
  return { staleness_min, freshness };
}

/**
 * Live price for `symbol`, enriched with freshness + 52-week range + YTD.
 *
 *  - price / change_pct / timestamp come from the live quote (useLivePrices).
 *  - week_52_high/low: prefer worker-provided Yahoo fields, else fall back to
 *    min/max of weekly closes from priceHistory (useHistoricalData).
 *  - ytd_pct: (price − first close of current year) / that close × 100, or
 *    null if priceHistory doesn't reach the current year (never fabricated).
 */
export function usePriceWithContext(symbol) {
  const { data, loading: liveLoading, error: liveError } = useLivePrices([symbol]);
  const { priceHistory, loading: histLoading } = useHistoricalData();

  const quote = data?.[symbol];
  const ok = quote && !quote.error;
  const price = ok ? quote.price ?? null : null;
  const change_pct = ok ? quote.percent_change ?? null : null;
  const timestamp = ok ? quote.timestamp ?? null : null;

  const { staleness_min, freshness } = classifyFreshness(timestamp);

  // 52-week range: worker fields first, weekly-close min/max as fallback.
  let week_52_high = ok ? quote.week_52_high ?? null : null;
  let week_52_low = ok ? quote.week_52_low ?? null : null;
  if ((week_52_high == null || week_52_low == null) && priceHistory?.length) {
    const closes = priceHistory.map(d => d.price).filter(v => v != null);
    if (closes.length) {
      if (week_52_high == null) week_52_high = Math.max(...closes);
      if (week_52_low == null) week_52_low = Math.min(...closes);
    }
  }

  // YTD: needs the first close of the current calendar year from history.
  let ytd_pct = null;
  if (price != null && priceHistory?.length) {
    const curYear = new Date().getUTCFullYear();
    const firstThisYear = priceHistory.find(
      d => d.rawDate && new Date(d.rawDate).getUTCFullYear() === curYear
    );
    if (firstThisYear?.price) {
      ytd_pct = ((price - firstThisYear.price) / firstThisYear.price) * 100;
    }
  }

  return {
    price,
    change_pct,
    timestamp,
    staleness_min,
    freshness,
    week_52_high,
    week_52_low,
    ytd_pct,
    loading: liveLoading || histLoading,
    error: liveError,
  };
}
