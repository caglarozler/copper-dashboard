import { useLivePrices } from '../hooks/useLivePrices';
import { classifyFreshness } from '../hooks/usePriceWithContext';
import { SYMBOLS, SYMBOL_META } from '../api/priceApi';
import { computeRatios } from '../lib/computeRatios';
import FreshnessBadge from './FreshnessBadge.jsx';

const formatTime = (d) =>
  d ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';

// Shared 4-line cell template. Fixed min-heights on lines 1/2/4 (line 3 is the
// big value) keep every cell's baselines aligned even while data loads async.
const CELL = { flex: '1 1 115px', minWidth: 115, display: 'flex', flexDirection: 'column' };
const L_NAME = {
  fontSize: 9.5, color: '#8b949e', letterSpacing: 1, fontWeight: 600,
  minHeight: 14, lineHeight: '14px',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};
const L_UNIT = { fontSize: 9.5, color: '#6e7681', minHeight: 12, lineHeight: '12px' };
const L_VALUE = { fontSize: 16, fontWeight: 700, letterSpacing: -0.3, minHeight: 20, lineHeight: '20px' };
const L_CHANGE = { fontSize: 11, fontWeight: 600, minHeight: 14, lineHeight: '14px' };

const PriceCell = ({ symbol, quote }) => {
  const meta = SYMBOL_META[symbol];
  if (!meta) return null;

  const prefix = meta.prefix ?? '$';

  if (!quote || quote.error) {
    return (
      <div style={{ ...CELL, opacity: 0.45 }}>
        <div style={L_NAME}>{meta.name}</div>
        <div style={L_UNIT}>{meta.unit}</div>
        <div style={{ ...L_VALUE, color: '#6e7681' }}>—</div>
        <div style={{ ...L_CHANGE, color: '#6e7681' }}>{quote?.error ? 'нет данных' : '...'}</div>
      </div>
    );
  }

  const isUp = quote.percent_change >= 0;
  const color = isUp ? '#3fb950' : '#f85149';
  const arrow = isUp ? '▲' : '▼';

  // Threshold proximity warning (used for DXY > 105 etc.)
  let thresholdLabel = null;
  if (meta.threshold) {
    const t = meta.threshold;
    if (quote.price >= t.value) {
      thresholdLabel = <span style={{ color: t.color, fontWeight: 700 }}>⚠ {t.label}</span>;
    } else if (quote.price >= t.value * 0.98) {
      thresholdLabel = <span style={{ color: '#d29922' }}>близко к {t.value}</span>;
    }
  }

  return (
    <div style={CELL}>
      <div style={L_NAME}>{meta.name}</div>
      <div style={L_UNIT}>{meta.unit}</div>
      <div style={{ ...L_VALUE, color: '#e6edf3' }}>
        {prefix}{quote.price.toFixed(meta.precision)}
      </div>
      <div style={{ ...L_CHANGE, color }}>
        {arrow} {Math.abs(quote.percent_change).toFixed(2)}%
        {thresholdLabel && <span style={{ marginLeft: 6, fontSize: 9 }}>{thresholdLabel}</span>}
      </div>
    </div>
  );
};

// Line 4 of a ratio cell: trend-tag, styled like the instruments' % change.
const RatioTag = ({ trend }) => {
  if (!trend || trend.direction == null || trend.deltaPct == null) {
    return <div style={{ ...L_CHANGE, color: '#6e7681' }}>—</div>;
  }
  const pct = Math.abs(trend.deltaPct).toFixed(1);
  if (trend.direction === 'up')
    return <div style={{ ...L_CHANGE, color: '#3fb950' }}>↑ +{pct}%/нед</div>;
  if (trend.direction === 'down')
    return <div style={{ ...L_CHANGE, color: '#f85149' }}>↓ −{pct}%/нед</div>;
  return <div style={{ ...L_CHANGE, color: '#8b949e' }}>≈ стабилен</div>;
};

const RatioCell = ({ label, value, color, trend }) => (
  <div style={{ ...CELL, borderLeft: '1px solid #21262d', paddingLeft: 12 }}>
    <div style={L_NAME}>{label}</div>
    <div style={L_UNIT}>ratio</div>
    <div style={{ ...L_VALUE, color }}>{value != null ? value : '—'}</div>
    <RatioTag trend={trend} />
  </div>
);

export default function LivePricesBanner({ ratioTrends = null }) {
  const { data, loading, error, refresh } = useLivePrices([
    SYMBOLS.COPPER,
    SYMBOLS.GOLD,
    SYMBOLS.SILVER,
    SYMBOLS.NATGAS,
    SYMBOLS.WTI,
    SYMBOLS.DXY,
  ]);

  const cu = data?.[SYMBOLS.COPPER]?.price;
  const au = data?.[SYMBOLS.GOLD]?.price;
  const ag = data?.[SYMBOLS.SILVER]?.price;

  // Exchange quote time + freshness, derived from copper's regularMarketTime.
  const copperQuote = data?.[SYMBOLS.COPPER];
  const exchangeTs = copperQuote && !copperQuote.error ? copperQuote.timestamp : null;
  const { staleness_min, freshness } = classifyFreshness(exchangeTs);

  const { cuAu, cuAg } = computeRatios({ copper: cu, gold: au, silver: ag });
  const cuAuRatio = cuAu != null ? cuAu.toFixed(3) : null;
  const cuAgRatio = cuAg != null ? cuAg.toFixed(3) : null;

  return (
    <div style={{
      background: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)',
      border: '1px solid #21262d',
      borderRadius: 10,
      padding: '14px 18px',
      marginBottom: 18,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ fontSize: 11, color: '#8b949e', letterSpacing: 1.5, fontWeight: 700 }}>
          <span style={{ color: '#f85149' }}>●</span> LIVE · YAHOO FINANCE FUTURES
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10, color: '#6e7681' }}>
          {loading && <span>обновление...</span>}
          {error && (
            <span style={{ color: '#f85149' }} title={error}>⚠ offline (статичные данные)</span>
          )}
          {!loading && !error && exchangeTs && (
            <>
              <span title="время последней котировки (Yahoo regularMarketTime)">
                котировка {formatTime(new Date(exchangeTs * 1000))}
              </span>
              <FreshnessBadge freshness={freshness} staleness_min={staleness_min} />
            </>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              background: 'transparent',
              border: '1px solid #30363d',
              color: '#8b949e',
              borderRadius: 4,
              padding: '2px 8px',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 10,
            }}
            title="Обновить вручную"
          >
            ↻
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <PriceCell symbol={SYMBOLS.COPPER}  quote={data?.[SYMBOLS.COPPER]} />
        <PriceCell symbol={SYMBOLS.GOLD}    quote={data?.[SYMBOLS.GOLD]} />
        <PriceCell symbol={SYMBOLS.SILVER}  quote={data?.[SYMBOLS.SILVER]} />
        <PriceCell symbol={SYMBOLS.NATGAS}  quote={data?.[SYMBOLS.NATGAS]} />
        <PriceCell symbol={SYMBOLS.WTI}     quote={data?.[SYMBOLS.WTI]} />
        <PriceCell symbol={SYMBOLS.DXY}     quote={data?.[SYMBOLS.DXY]} />
        <RatioCell label="Cu/Au × 1000"     value={cuAuRatio} color="#e6b450" trend={ratioTrends?.cu_au} />
        <RatioCell label="Cu/Ag"            value={cuAgRatio} color="#c0c0c0" trend={ratioTrends?.cu_ag} />
      </div>
    </div>
  );
}
