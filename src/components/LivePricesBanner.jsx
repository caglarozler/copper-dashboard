import { useLivePrices } from '../hooks/useLivePrices';
import { SYMBOLS, SYMBOL_META } from '../api/priceApi';

const formatTime = (d) =>
  d ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';

const PriceCell = ({ symbol, quote }) => {
  const meta = SYMBOL_META[symbol];
  if (!meta) return null;

  if (!quote || quote.error) {
    return (
      <div style={{ flex: '1 1 120px', minWidth: 120, opacity: 0.45 }}>
        <div style={{ fontSize: 9.5, color: '#8b949e', letterSpacing: 1, fontWeight: 600 }}>
          {meta.name} <span style={{ opacity: 0.6 }}>{meta.unit}</span>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#6e7681' }}>—</div>
        <div style={{ fontSize: 10, color: '#6e7681' }}>{quote?.error ? 'нет данных' : '...'}</div>
      </div>
    );
  }

  const isUp = quote.percent_change >= 0;
  const color = isUp ? '#3fb950' : '#f85149';
  const arrow = isUp ? '▲' : '▼';

  return (
    <div style={{ flex: '1 1 120px', minWidth: 120 }}>
      <div style={{ fontSize: 9.5, color: '#8b949e', letterSpacing: 1, fontWeight: 600 }}>
        {meta.name} <span style={{ opacity: 0.6 }}>{meta.unit}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#e6edf3', letterSpacing: -0.3 }}>
        ${quote.price.toFixed(meta.precision)}
      </div>
      <div style={{ fontSize: 11, color, fontWeight: 600 }}>
        {arrow} {Math.abs(quote.percent_change).toFixed(2)}%
      </div>
    </div>
  );
};

const RatioCell = ({ label, value, color }) => (
  <div style={{ flex: '1 1 100px', minWidth: 100, borderLeft: '1px solid #21262d', paddingLeft: 12 }}>
    <div style={{ fontSize: 9.5, color: '#8b949e', letterSpacing: 1, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 700, color }}>
      {value != null ? value : '—'}
    </div>
    <div style={{ fontSize: 10, color: '#6e7681' }}>ratio</div>
  </div>
);

export default function LivePricesBanner() {
  const { data, loading, error, updatedAt, refresh } = useLivePrices([
    SYMBOLS.COPPER,
    SYMBOLS.GOLD,
    SYMBOLS.SILVER,
    SYMBOLS.NATGAS,
    SYMBOLS.WTI,
  ]);

  const cu = data?.[SYMBOLS.COPPER]?.price;
  const au = data?.[SYMBOLS.GOLD]?.price;
  const ag = data?.[SYMBOLS.SILVER]?.price;

  const cuAuRatio = (cu && au) ? (cu * 1000 / au).toFixed(3) : null;
  const cuAgRatio = (cu && ag) ? (cu / ag).toFixed(3) : null;

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
          {updatedAt && !loading && !error && (
            <span>обновлено {formatTime(updatedAt)}</span>
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

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <PriceCell symbol={SYMBOLS.COPPER}  quote={data?.[SYMBOLS.COPPER]} />
        <PriceCell symbol={SYMBOLS.GOLD}    quote={data?.[SYMBOLS.GOLD]} />
        <PriceCell symbol={SYMBOLS.SILVER}  quote={data?.[SYMBOLS.SILVER]} />
        <PriceCell symbol={SYMBOLS.NATGAS}  quote={data?.[SYMBOLS.NATGAS]} />
        <PriceCell symbol={SYMBOLS.WTI}     quote={data?.[SYMBOLS.WTI]} />
        <RatioCell label="Cu/Au × 1000"     value={cuAuRatio} color="#e6b450" />
        <RatioCell label="Cu/Ag"            value={cuAgRatio} color="#c0c0c0" />
      </div>
    </div>
  );
}
