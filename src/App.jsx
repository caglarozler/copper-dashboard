import { useState } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, ReferenceArea,
  Legend, LineChart
} from "recharts";
import LivePricesBanner from "./components/LivePricesBanner.jsx";
import AnalysisPanel from "./components/AnalysisPanel.jsx";
import { useHistoricalData } from "./hooks/useHistoricalData.js";

// ── Price history (HG1, $/lb) — static fallback if Yahoo is unreachable ───
const STATIC_PRICE_DATA = [
  { date: "Окт'25 н1", price: 4.33 },
  { date: "Окт'25 н3", price: 4.49 },
  { date: "Ноя'25 н1", price: 4.72 },
  { date: "Ноя'25 н3", price: 4.85 },
  { date: "Дек'25 н1", price: 4.96 },
  { date: "Дек'25 н3", price: 5.18 },
  { date: "Янв'26 н1", price: 5.65 },
  { date: "Янв'26 н3", price: 6.58 },
  { date: "Фев'26 н1", price: 6.30 },
  { date: "Фев'26 н3", price: 6.05 },
  { date: "Мар'26 н1", price: 5.90 },
  { date: "Мар'26 н3", price: 6.10 },
  { date: "Апр'26 н1", price: 6.15 },
  { date: "Апр'26 н3", price: 6.02 },
  { date: "Май'26 н1", price: 5.84 },
  { date: "Май'26 н2", price: 6.40 },
  { date: "Май'26 н3", price: 6.32 },
];

const forecastDates = ["Июн'26 н1", "Июн'26 н3", "Июл'26 н1", "Июл'26 н3"];
const bullVals    = [6.55, 6.72, 6.90, 7.10];
const baseVals    = [6.28, 6.45, 6.58, 6.72];
const bearVals    = [6.05, 5.85, 5.65, 5.50];

// ── Ratio data ────────────────────────────────────────────────────────────
// Золото: геополитический спайк в янв'26 до ~$6200, затем коррекция к $4550
// Серебро: ATH ~$46, сейчас ~$34
const STATIC_RAW_RATIO = [
  { date: "Окт'25 н1", cu: 4.33, gold: 2650, silver: 32.0 },
  { date: "Окт'25 н3", cu: 4.49, gold: 2750, silver: 33.0 },
  { date: "Ноя'25 н1", cu: 4.72, gold: 2850, silver: 34.5 },
  { date: "Ноя'25 н3", cu: 4.85, gold: 2950, silver: 35.8 },
  { date: "Дек'25 н1", cu: 4.96, gold: 3100, silver: 37.0 },
  { date: "Дек'25 н3", cu: 5.18, gold: 3300, silver: 39.5 },
  { date: "Янв'26 н1", cu: 5.65, gold: 4200, silver: 43.0 },
  { date: "Янв'26 н3", cu: 6.58, gold: 6200, silver: 46.0 },
  { date: "Фев'26 н1", cu: 6.30, gold: 5500, silver: 42.0 },
  { date: "Фев'26 н3", cu: 6.05, gold: 5100, silver: 39.0 },
  { date: "Мар'26 н1", cu: 5.90, gold: 4900, silver: 37.5 },
  { date: "Мар'26 н3", cu: 6.10, gold: 4750, silver: 36.0 },
  { date: "Апр'26 н1", cu: 6.15, gold: 4650, silver: 35.0 },
  { date: "Апр'26 н3", cu: 6.02, gold: 4580, silver: 34.0 },
  { date: "Май'26 н1", cu: 5.84, gold: 4520, silver: 33.5 },
  { date: "Май'26 н2", cu: 6.40, gold: 4560, silver: 34.2 },
  { date: "Май'26 н3", cu: 6.32, gold: 4550, silver: 34.0 },
];

const Tip = ({ active, payload, label, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1117", border: "1px solid #30363d", padding: "10px 14px", borderRadius: 6, fontSize: 12, color: "#c9d1d9" }}>
      <div style={{ color: "#58a6ff", marginBottom: 6, fontWeight: 700 }}>{label}</div>
      {payload.map((p, i) => p.value != null && (
        <div key={i} style={{ color: p.color, lineHeight: 1.8 }}>
          {p.name}: <strong>{fmt ? fmt(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [showFc, setShowFc] = useState(true);

  // ── Live historical data (Yahoo Finance) with graceful fallback to static ──
  const {
    priceHistory,
    ratioHistory,
    loading: historyLoading,
    fromCache,
    updatedAt: historyUpdatedAt,
    refresh: refreshHistory,
  } = useHistoricalData();

  // Use live data if available, otherwise fall back to the static arrays.
  const livePriceData = priceHistory || STATIC_PRICE_DATA;
  const ratioData = ratioHistory || STATIC_RAW_RATIO.map(d => ({
    date: d.date,
    cgRatio: parseFloat((d.cu * 1000 / d.gold).toFixed(4)),
    csRatio: parseFloat((d.cu / d.silver).toFixed(4)),
  }));

  // Price chart series; anchor the forecast lines to the last real data point.
  const lastHist = livePriceData[livePriceData.length - 1];
  const allDates = [...livePriceData.map(d => d.date), ...forecastDates];
  const mergedData = allDates.map((date) => {
    const hist = livePriceData.find(d => d.date === date);
    const fi = forecastDates.indexOf(date);
    const anchor = date === lastHist?.date ? lastHist?.price : undefined;
    return {
      date,
      price: hist ? hist.price : undefined,
      fb: fi >= 0 ? bullVals[fi] : anchor,
      fbase: fi >= 0 ? baseVals[fi] : anchor,
      fbear: fi >= 0 ? bearVals[fi] : anchor,
    };
  });

  // Current ratio values + dynamic Y-domains (correct for live *or* static data).
  const lastRatio = ratioData[ratioData.length - 1] || {};
  const curCG = lastRatio.cgRatio;
  const curCS = lastRatio.csRatio;
  const padDomain = (vals, p = 0.1) => {
    const min = Math.min(...vals), max = Math.max(...vals);
    const m = (max - min) * p || Math.abs(max) * 0.1 || 0.01;
    return [parseFloat((min - m).toFixed(4)), parseFloat((max + m).toFixed(4))];
  };
  const cgDomain = padDomain(ratioData.map(d => d.cgRatio));
  const csDomain = padDomain(ratioData.map(d => d.csRatio));

  const S = { // styles shorthand
    section: { marginBottom: 24 },
    label: { fontSize: 13, color: "#8b949e", marginBottom: 12, fontWeight: 700, letterSpacing: 1 },
    card: { background: "#161b22", border: "1px solid #21262d", borderRadius: 10, padding: 16 },
    mini: { background: "#0d1117", borderRadius: 8, padding: "10px 14px" },
  };

  return (
    <div style={{ background: "#0d1117", minHeight: "100vh", color: "#c9d1d9", fontFamily: "system-ui, sans-serif", padding: "20px 16px", maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: "1px solid #21262d", paddingBottom: 16, marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: "#8b949e", letterSpacing: 2, marginBottom: 4 }}>COMEX · HG1! · COPPER HIGH GRADE FUTURES</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#e6b450" }}>
            $6.32 <span style={{ fontSize: 15, color: "#3fb950" }}>▲ +31.4% YTD</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button onClick={() => setShowFc(!showFc)} style={{ background: showFc ? "#1f6feb22" : "transparent", border: `1px solid ${showFc ? "#1f6feb" : "#30363d"}`, color: showFc ? "#58a6ff" : "#8b949e", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>
              {showFc ? "Скрыть прогноз" : "Показать прогноз"}
            </button>
            <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 6, padding: "6px 12px", fontSize: 12 }}>
              52W: <span style={{ color: "#f85149" }}>$4.33</span> — <span style={{ color: "#3fb950" }}>$6.72</span>
            </div>
          </div>
        </div>
      </div>

      <LivePricesBanner />

      <AnalysisPanel />

      {/* ── Price Chart ── */}
      <div style={{ ...S.card, marginBottom: 22 }}>
        <div style={S.label}>ЦЕНОВОЙ ПУТЬ + УРОВНИ + ПРОГНОЗ</div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={mergedData} margin={{ top: 5, right: 70, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="date" tick={{ fill: "#8b949e", fontSize: 9 }} tickLine={false} axisLine={false} interval={1} />
            <YAxis domain={[4.1, 7.4]} tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toFixed(2)}`} />
            <Tooltip content={<Tip fmt={v => `$${v.toFixed(4)}`} />} />
            <ReferenceArea y1={5.55} y2={5.90} fill="#3fb95012" />
            <ReferenceArea y1={6.05} y2={6.20} fill="#58a6ff10" />
            <ReferenceLine y={6.32} stroke="#e6b450" strokeWidth={2}
              label={{ value: "СЕЙЧАС $6.32", position: "right", fill: "#e6b450", fontSize: 9, fontWeight: 700 }} />
            <Area type="monotone" dataKey="price" stroke="#e6b450" strokeWidth={2.5} fill="#e6b45014" dot={false} name="Цена HG1" connectNulls />
            {showFc && <>
              <Line type="monotone" dataKey="fb" stroke="#3fb950" strokeWidth={1.8} strokeDasharray="6 3" dot={false} name="Бычий" connectNulls />
              <Line type="monotone" dataKey="fbase" stroke="#58a6ff" strokeWidth={1.8} strokeDasharray="6 3" dot={false} name="Базовый" connectNulls />
              <Line type="monotone" dataKey="fbear" stroke="#f85149" strokeWidth={1.8} strokeDasharray="6 3" dot={false} name="Медвежий" connectNulls />
            </>}
            <Legend wrapperStyle={{ fontSize: 11, color: "#8b949e", paddingTop: 8 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ── RATIO SECTION ──────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.label}>📊 СООТНОШЕНИЯ: МЕДЬ / ЗОЛОТО И МЕДЬ / СЕРЕБРО</div>
        {!ratioHistory && (
          <div style={{ fontSize: 11, color: "#6e7681", marginBottom: 12 }}>
            * Цены золота и серебра приблизительные — построены на основе рыночных ориентиров. Уточняй актуальные значения самостоятельно.
          </div>
        )}

        {/* Статус источника данных + ручной refresh */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#6e7681',
          marginBottom: 16,
          padding: '6px 12px',
          background: '#0d1117',
          borderRadius: 6,
          border: '1px solid #21262d',
        }}>
          <span>
            {historyLoading ? '⏳ загрузка истории...' :
             ratioHistory ? `✓ Реальные данные Yahoo Finance` :
             '⚠️ Используются статические данные (Yahoo недоступен)'}
            {historyUpdatedAt && ratioHistory && (
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                · обновлено {historyUpdatedAt.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                {fromCache && ' (из кеша)'}
              </span>
            )}
          </span>
          <button
            onClick={refreshHistory}
            disabled={historyLoading}
            style={{
              background: 'transparent',
              border: '1px solid #30363d',
              color: '#58a6ff',
              borderRadius: 4,
              padding: '3px 10px',
              cursor: historyLoading ? 'wait' : 'pointer',
              fontSize: 11,
            }}
          >
            {historyLoading ? '...' : '↻ обновить'}
          </button>
        </div>

        {/* Карточки с текущими значениями */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          {[
            {
              title: "Copper / Gold × 1000",
              color: "#e6b450",
              rows: [["Окт'25", "1.634"], ["Янв'26 ATH", "1.061"], ["Сейчас", curCG != null ? curCG.toFixed(3) : "1.389"]],
              signal: "⚠️ СНИЖАЕТСЯ",
              sigC: "#f85149",
              desc: "Ratio упал с октября: золото росло быстрее меди → рынок уходил в защиту во время геополитического спайка. Сейчас частично восстанавливается, но всё ещё ниже октябрьских уровней.",
              bull: "↑ Ratio растёт = экономический оптимизм, медь опережает золото",
              bear: "↓ Ratio падает = рынок боится, золото опережает медь",
            },
            {
              title: "Copper / Silver",
              color: "#c0c0c0",
              rows: [["Окт'25", "0.135"], ["Янв'26 ATH", "0.143"], ["Сейчас", curCS != null ? curCS.toFixed(3) : "0.186"]],
              signal: "✅ РАСТЁТ",
              sigC: "#3fb950",
              desc: "Ratio восстанавливается с январского дна — медь догоняет серебро. Серебро в период спайка выросло сильнее меди (safe-haven + промышленный), теперь медь возвращает позиции.",
              bull: "↑ Ratio растёт = промспрос силён, медь опережает серебро",
              bear: "↓ Ratio падает = safe-haven компонент серебра доминирует",
            },
          ].map(r => (
            <div key={r.title} style={S.card}>
              <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 10, fontWeight: 700 }}>{r.title}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {r.rows.map(([lbl, val]) => (
                  <div key={lbl} style={{ background: "#0d1117", borderRadius: 6, padding: "8px 10px", flex: "1 1 60px", minWidth: 60 }}>
                    <div style={{ fontSize: 10, color: "#6e7681" }}>{lbl}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: lbl === "Сейчас" ? r.color : "#8b949e" }}>{val}</div>
                  </div>
                ))}
                <div style={{ background: "#0d1117", borderRadius: 6, padding: "8px 10px", flex: "1 1 60px" }}>
                  <div style={{ fontSize: 10, color: "#6e7681" }}>Сигнал</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.sigC }}>{r.signal}</div>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: "#8b949e", lineHeight: 1.6, marginBottom: 10 }}>{r.desc}</div>
              <div style={{ fontSize: 11, borderTop: "1px solid #21262d", paddingTop: 8 }}>
                <div style={{ color: "#3fb950", marginBottom: 2 }}>{r.bull}</div>
                <div style={{ color: "#f85149" }}>{r.bear}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Copper/Gold Chart */}
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 12, fontWeight: 700 }}>
            COPPER / GOLD RATIO (×1000) — Индикатор экономического оптимизма
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ratioData} margin={{ top: 4, right: 70, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="date" tick={{ fill: "#8b949e", fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(3)} domain={cgDomain} />
              <Tooltip content={<Tip fmt={v => v.toFixed(4)} />} />
              {curCG != null && (
                <ReferenceLine y={curCG} stroke="#e6b450" strokeDasharray="4 3"
                  label={{ value: `Сейчас ${curCG.toFixed(3)}`, position: "right", fill: "#e6b450", fontSize: 9 }} />
              )}
              <Line type="monotone" dataKey="cgRatio" stroke="#e6b450" strokeWidth={2.5} dot={false} name="Cu/Au ×1000" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: "#d29922", padding: "4px 6px" }}>
            ⚠️ Текущее значение Cu/Au ratio: <strong>{curCG != null ? curCG.toFixed(3) : "—"}</strong>.
            Рост = медь опережает золото (экономический оптимизм), падение = золото опережает медь (уход в защиту). Динамика — на графике выше.
          </div>
        </div>

        {/* Copper/Silver Chart */}
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 12, fontWeight: 700 }}>
            COPPER / SILVER RATIO — Промышленный vs. Safe-Haven спрос
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ratioData} margin={{ top: 4, right: 70, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="date" tick={{ fill: "#8b949e", fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fill: "#8b949e", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(3)} domain={csDomain} />
              <Tooltip content={<Tip fmt={v => v.toFixed(4)} />} />
              {curCS != null && (
                <ReferenceLine y={curCS} stroke="#c0c0c0" strokeDasharray="4 3"
                  label={{ value: `Сейчас ${curCS.toFixed(3)}`, position: "right", fill: "#c0c0c0", fontSize: 9 }} />
              )}
              <Line type="monotone" dataKey="csRatio" stroke="#c0c0c0" strokeWidth={2.5} dot={false} name="Cu/Ag" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: "#3fb950", padding: "4px 6px" }}>
            ✅ Текущее значение Cu/Ag ratio: <strong>{curCS != null ? curCS.toFixed(3) : "—"}</strong>.
            Рост = промышленный спрос силён (медь опережает серебро), падение = доминирует safe-haven спрос на серебро. Динамика — на графике выше.
          </div>
        </div>

      </div>

      <div style={{ fontSize: 10, color: "#484f58", textAlign: "center" }}>
        Анализ носит информационный характер и не является инвестиционной рекомендацией. Цены приблизительные — уточняй на бирже перед входом.
      </div>
    </div>
  );
}
