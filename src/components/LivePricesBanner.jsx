import { useLivePrices } from '../hooks/useLivePrices';
import { SYMBOLS } from '../api/twelveData';

const formatTime = (d) => {
  if (!d) return '';
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const PriceCell = ({ label, data, currency = '$', precision = 2 }) => {
  if (!data) {
    return (
      <div style={{ flex: 1, minWidth: 120, opacity: 0.4 }}>
        <div style={{ fontSize: 10, color: '#8b949e', letterSpacing: 1 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#6e7681' }}>—</div>
      </div>
    );
  }

  const isUp = data.percent_change >= 0;
  const color = isUp ? '#3fb950' : '#f85149';
  const arrow = isUp ? '▲' : '▼';

  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 10, color: '#8b949e', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3' }}>
        {currency}{data.price.toFixed(precision)}
      </div>
      <div style={{ fontSize: 11, color, fontWeight: 600 }}>
        {arrow} {Math.abs(data.percent_change).toFixed(2)}%
      </div>
    </div>
  );
};

export default function LivePricesBanner() {
  const { data, loading, error, updatedAt, refresh } = useLivePrices([
    SYMBOLS.COPPER,
    SYMBOLS.GOLD,
    SYMBOLS.SILVER,
  ]);

  return (
    <div style={{
      background: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)',
      border: '1px solid #21262d',
      borderRadius: 10,
      padding: '14px 18px',
      marginBottom: 18,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#8b949e', letterSpacing: 1.5, fontWeight: 700 }}>
          🔴 LIVE · TWELVE DATA
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10, color: '#6e7681' }}>
          {loading && <span>обновление...</span>}
          {error && (
            <span style={{ color: '#f85149' }} title={error}>⚠ offline (статичные данные)</span>
          )}
          {updatedAt && !loading && (
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
              cursor: 'pointer',
              fontSize: 10,
            }}
          >
            ↻
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <PriceCell label="МЕДЬ XCU/USD" data={data?.[SYMBOLS.COPPER]} precision={4} />
        <PriceCell label="ЗОЛОТО XAU/USD ($/oz)" data={data?.[SYMBOLS.GOLD]} precision={2} />
        <PriceCell label="СЕРЕБРО XAG/USD ($/oz)" data={data?.[SYMBOLS.SILVER]} precision={3} />
        {data?.[SYMBOLS.COPPER] && data?.[SYMBOLS.GOLD] && (
          <div style={{ flex: 1, minWidth: 110, borderLeft: '1px solid #21262d', paddingLeft: 16 }}>
            <div style={{ fontSize: 10, color: '#8b949e', letterSpacing: 1 }}>Cu/Au × 1000</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e6b450' }}>
              {(data[SYMBOLS.COPPER].price * 1000 / data[SYMBOLS.GOLD].price).toFixed(3)}
            </div>
          </div>
        )}
        {data?.[SYMBOLS.COPPER] && data?.[SYMBOLS.SILVER] && (
          <div style={{ flex: 1, minWidth: 110 }}>
            <div style={{ fontSize: 10, color: '#8b949e', letterSpacing: 1 }}>Cu/Ag</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#c0c0c0' }}>
              {(data[SYMBOLS.COPPER].price / data[SYMBOLS.SILVER].price).toFixed(3)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
