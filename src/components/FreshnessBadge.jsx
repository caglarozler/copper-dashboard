/**
 * Tiny indicator for how fresh a live quote is.
 * Driven by usePriceWithContext's { freshness, staleness_min }.
 *
 *   live      → subtle green dot ● (does not draw attention)
 *   delayed   → gray  "🕒 задержка ~Xмин"
 *   stale     → amber "⚠️ данные ~Xч назад"
 *   overnight → gray  "🌙 данные за последнюю сессию"
 */
export default function FreshnessBadge({ freshness, staleness_min }) {
  if (!freshness) return null;

  if (freshness === 'live') {
    return (
      <span title="данные в реальном времени" style={{ color: '#3fb950', fontSize: 10 }}>●</span>
    );
  }

  const min = staleness_min != null ? Math.round(staleness_min) : null;

  if (freshness === 'delayed') {
    return (
      <span style={{ color: '#8b949e', fontSize: 10 }}>
        🕒 задержка{min != null ? ` ~${min}мин` : ''}
      </span>
    );
  }

  if (freshness === 'stale') {
    const hours = min != null ? Math.max(1, Math.round(min / 60)) : null;
    return (
      <span style={{ color: '#d29922', fontSize: 10 }}>
        ⚠️ данные{hours != null ? ` ~${hours}ч назад` : ' устарели'}
      </span>
    );
  }

  if (freshness === 'overnight') {
    return (
      <span style={{ color: '#8b949e', fontSize: 10 }}>
        🌙 данные за последнюю сессию
      </span>
    );
  }

  return null;
}
