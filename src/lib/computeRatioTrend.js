const RATIO_TREND_DEADBAND_PCT = 1.5; // ±1.5% over the window → flat

/**
 * Trend of a ratio: live `current` vs the value ~5 weekly bars back
 * (ratioHistory[len-6]). Shared by the ratio cards (App) and the live banner
 * trend-tag so a single computed value drives both — they can never disagree.
 *
 *   key:     'cgRatio' | 'csRatio'
 *   current: live ratio value (null when live quotes are missing)
 *
 * Returns { direction: 'up' | 'down' | 'flat' | null, deltaPct: number | null }.
 * direction is null when `current` is missing or there's no comparison bar.
 */
export function computeRatioTrend(history, key, current) {
  if (current == null || !Array.isArray(history) || history.length === 0) {
    return { direction: null, deltaPct: null };
  }
  const weekAgo = history[history.length - 6]?.[key] ?? null;
  if (!weekAgo) return { direction: null, deltaPct: null };

  const deltaPct = (current - weekAgo) / weekAgo * 100;
  let direction;
  if (deltaPct > RATIO_TREND_DEADBAND_PCT) direction = 'up';
  else if (deltaPct < -RATIO_TREND_DEADBAND_PCT) direction = 'down';
  else direction = 'flat';

  return { direction, deltaPct };
}
