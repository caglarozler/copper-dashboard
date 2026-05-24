import { useAnalysis } from '../hooks/useAnalysis';

const signalColor = (s) =>
  s === 'Бычий' || s === 'LONG' ? '#3fb950' :
  s === 'Медвежий' || s === 'SHORT' ? '#f85149' :
  '#d29922';

const confidenceLabel = (c) => ({
  high: 'высокая уверенность',
  medium: 'средняя уверенность',
  low: 'низкая уверенность',
}[c] || c);

const formatAge = (hours) => {
  if (hours == null) return '';
  if (hours < 1) return `${Math.round(hours * 60)} мин назад`;
  if (hours < 24) return `${Math.round(hours)} ч назад`;
  return `${Math.round(hours / 24)} дн назад`;
};

const Section = ({ title, children, style = {} }) => (
  <div style={{
    background: '#161b22',
    border: '1px solid #21262d',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    ...style,
  }}>
    <div style={{ fontSize: 11, color: '#8b949e', letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>
      {title}
    </div>
    {children}
  </div>
);

const ProgressBar = ({ value }) => (
  <div style={{
    width: '100%', height: 4, background: '#21262d', borderRadius: 2, overflow: 'hidden', marginTop: 8,
  }}>
    <div style={{
      width: `${value}%`,
      height: '100%',
      background: 'linear-gradient(90deg, #1f6feb 0%, #58a6ff 100%)',
      transition: 'width 0.3s ease',
    }} />
  </div>
);

export default function AnalysisPanel() {
  const {
    analysis, loading, refreshing, refreshProgress, error,
    generatedAt, ageHours, isStale, refresh,
  } = useAnalysis();

  // Loading state — first load, no cached data
  if (loading && !analysis) {
    return (
      <Section title="🤖 AI-АНАЛИЗ ЗАГРУЖАЕТСЯ...">
        <div style={{ color: '#8b949e', fontSize: 13 }}>Запрашиваю анализ из кеша Cloudflare...</div>
      </Section>
    );
  }

  // No analysis and error
  if (!analysis && error) {
    const isMissingKey = /ANTHROPIC_API_KEY|KV not configured/.test(error);
    return (
      <Section title="🤖 AI-АНАЛИЗ — НЕДОСТУПЕН" style={{ borderColor: '#f8514944' }}>
        <div style={{ color: '#f85149', fontSize: 13, marginBottom: 12 }}>{error}</div>
        {isMissingKey ? (
          <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.6 }}>
            Похоже, AI-движок ещё не настроен. Проверь в воркере:
            <ul style={{ marginTop: 6, paddingLeft: 20 }}>
              <li><code style={{ background: '#21262d', padding: '1px 6px', borderRadius: 3 }}>npx wrangler secret put ANTHROPIC_API_KEY</code></li>
              <li>KV namespace в <code>wrangler.toml</code> с реальным id</li>
              <li><code>npx wrangler deploy</code> после изменений</li>
            </ul>
          </div>
        ) : (
          <button onClick={refresh} disabled={refreshing} style={btnPrimary()}>
            {refreshing ? '⏳ Генерация...' : '🔄 Сгенерировать анализ (~$0.015)'}
          </button>
        )}
      </Section>
    );
  }

  // No analysis, no error — first time
  if (!analysis) {
    return (
      <Section title="🤖 AI-АНАЛИЗ · НЕ СГЕНЕРИРОВАН">
        <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 12 }}>
          Первый анализ ещё не создан. Нажми кнопку — Claude Haiku 4.5 проанализирует текущий рынок (5-10 секунд).
        </div>
        <button onClick={refresh} disabled={refreshing} style={btnPrimary()}>
          {refreshing ? '⏳ Генерация...' : '🔄 Сгенерировать первый анализ (~$0.015)'}
        </button>
        {refreshing && <ProgressBar value={refreshProgress} />}
      </Section>
    );
  }

  // Have analysis
  const { bias, levels, scenarios, fundamentals, ratio_interpretation, key_risks, summary, _meta } = analysis;

  return (
    <>
      {/* Status bar */}
      <Section title="🤖 AI-АНАЛИЗ · CLAUDE HAIKU 4.5" style={isStale ? { borderColor: '#d2992244' } : {}}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 12, color: '#8b949e' }}>
            {generatedAt && (
              <>
                Сгенерировано: <strong style={{ color: '#e6edf3' }}>
                  {generatedAt.toLocaleString('ru-RU')}
                </strong>
                {' · '}
                <span style={{ color: isStale ? '#d29922' : '#3fb950' }}>
                  {formatAge(ageHours)}{isStale && ' (устарел, рекомендую обновить)'}
                </span>
              </>
            )}
          </div>
          <button onClick={refresh} disabled={refreshing || loading} style={btnPrimary()}>
            {refreshing
              ? `⏳ Генерация ${refreshProgress}%...`
              : '🔄 Пересчитать (~$0.015)'}
          </button>
        </div>

        {refreshing && <ProgressBar value={refreshProgress} />}

        {summary && (
          <div style={{
            fontSize: 13,
            color: '#c9d1d9',
            lineHeight: 1.6,
            padding: '12px 16px',
            background: '#0d1117',
            borderRadius: 6,
            borderLeft: `3px solid ${signalColor(bias?.direction)}`,
            marginTop: 12,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: 14,
                fontWeight: 700,
                color: signalColor(bias?.direction),
              }}>
                {bias?.direction}
              </span>
              <span style={{ fontSize: 11, color: '#8b949e' }}>
                · {confidenceLabel(bias?.confidence)}
              </span>
            </div>
            <div>{summary}</div>
            {bias?.reason && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#8b949e', fontStyle: 'italic' }}>
                Обоснование: {bias.reason}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ fontSize: 11, color: '#d29922', marginTop: 8 }}>
            ⚠ Ошибка при обновлении: {error}. Показан предыдущий анализ.
          </div>
        )}
      </Section>

      {/* Scenarios */}
      {scenarios?.length > 0 && (
        <Section title="📊 СЦЕНАРИИ ВХОДА (AI)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {scenarios.map((s) => (
              <div key={s.id} style={{
                background: '#0d1117',
                border: `1px solid ${signalColor(s.direction)}44`,
                borderRadius: 8,
                padding: 14,
              }}>
                <div style={{ fontSize: 11, color: signalColor(s.direction), fontWeight: 700, marginBottom: 4 }}>
                  Сценарий {s.id} · {s.type} · {s.direction}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 10 }}>
                  {s.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <KV label="Entry" value={`$${s.entry_low}–${s.entry_high}`} color={signalColor(s.direction)} />
                  <KV label="Stop" value={`$${s.stop}`} color="#f85149" />
                  <KV label="TP1" value={`$${s.tp1}`} color="#3fb950" />
                  <KV label="TP2" value={`$${s.tp2}`} color="#3fb950" />
                  <KV label="R:R" value={s.rr} color="#e6b450" />
                  <KV label="Вер-сть" value={`~${s.probability}%`} color="#8b949e" />
                </div>
                {s.note && (
                  <div style={{ fontSize: 11, color: '#8b949e', marginTop: 10, lineHeight: 1.5, fontStyle: 'italic' }}>
                    💡 {s.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Levels */}
      {(levels?.resistance?.length > 0 || levels?.support?.length > 0) && (
        <Section title="📐 КЛЮЧЕВЫЕ УРОВНИ (AI)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#f85149', marginBottom: 8, fontWeight: 600 }}>СОПРОТИВЛЕНИЯ</div>
              {(levels.resistance || []).map((l, i) => (
                <LevelRow key={i} {...l} color="#f85149" />
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#3fb950', marginBottom: 8, fontWeight: 600 }}>ПОДДЕРЖКИ</div>
              {(levels.support || []).map((l, i) => (
                <LevelRow key={i} {...l} color="#3fb950" />
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Fundamentals */}
      {fundamentals?.length > 0 && (
        <Section title="🌍 ФУНДАМЕНТАЛЬНЫЕ ФАКТОРЫ (AI)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
            {fundamentals.map((f, i) => (
              <div key={i} style={{
                background: '#0d1117',
                border: '1px solid #21262d',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                gap: 10,
              }}>
                <div style={{ fontSize: 18, flexShrink: 0 }}>{f.icon || '•'}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e6edf3' }}>{f.category}</span>
                    <span style={{
                      fontSize: 10,
                      background: `${signalColor(f.signal)}22`,
                      color: signalColor(f.signal),
                      border: `1px solid ${signalColor(f.signal)}44`,
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontWeight: 600,
                    }}>{f.signal}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Ratio interpretation */}
      {ratio_interpretation && (
        <Section title="📊 ИНТЕРПРЕТАЦИЯ RATIO (AI)">
          {ratio_interpretation.cu_au && (
            <div style={{ fontSize: 12, color: '#c9d1d9', marginBottom: 10, lineHeight: 1.6 }}>
              <strong style={{ color: '#e6b450' }}>Cu/Au:</strong> {ratio_interpretation.cu_au}
            </div>
          )}
          {ratio_interpretation.cu_ag && (
            <div style={{ fontSize: 12, color: '#c9d1d9', marginBottom: 10, lineHeight: 1.6 }}>
              <strong style={{ color: '#c0c0c0' }}>Cu/Ag:</strong> {ratio_interpretation.cu_ag}
            </div>
          )}
          {ratio_interpretation.summary && (
            <div style={{
              fontSize: 12,
              color: '#8b949e',
              marginTop: 10,
              padding: '8px 12px',
              background: '#0d1117',
              borderRadius: 6,
              fontStyle: 'italic',
            }}>
              💡 {ratio_interpretation.summary}
            </div>
          )}
        </Section>
      )}

      {/* Risks */}
      {key_risks?.length > 0 && (
        <div style={{
          background: '#f8514910',
          border: '1px solid #f8514930',
          borderRadius: 8,
          padding: '14px 18px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f85149', marginBottom: 8 }}>
            ⚠️ КЛЮЧЕВЫЕ РИСКИ (AI)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 6 }}>
            {key_risks.map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: '#c9d1d9', display: 'flex', gap: 8 }}>
                <span style={{ color: '#f85149', flexShrink: 0 }}>•</span>{r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta footer */}
      <div style={{
        fontSize: 10,
        color: '#484f58',
        textAlign: 'center',
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <span>Модель: {_meta?.model || '?'}</span>
        <span>Токены: {_meta?.input_tokens || '?'} in / {_meta?.output_tokens || '?'} out</span>
        {_meta?.estimated_cost_usd != null && (
          <span>Стоимость: ~${_meta.estimated_cost_usd}</span>
        )}
        <span>· Не является инвестиционной рекомендацией</span>
      </div>
    </>
  );
}

const KV = ({ label, value, color }) => (
  <div style={{ background: '#161b22', padding: '6px 10px', borderRadius: 4 }}>
    <div style={{ fontSize: 9, color: '#6e7681' }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
  </div>
);

const LevelRow = ({ value, label, strength, color }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    background: '#0d1117',
    borderRadius: 4,
    marginBottom: 4,
    fontSize: 12,
  }}>
    <span style={{ color: '#c9d1d9' }}>{label}</span>
    <span style={{ color, fontWeight: 700 }}>
      ${value} <span style={{ fontSize: 10, opacity: 0.6 }}>({strength})</span>
    </span>
  </div>
);

const btnPrimary = () => ({
  background: '#1f6feb22',
  border: '1px solid #1f6feb',
  color: '#58a6ff',
  borderRadius: 6,
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
});
