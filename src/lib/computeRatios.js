/**
 * Single source of truth for the dashboard's metal ratios.
 * Used by both the live banner and the Cu/Au · Cu/Ag cards so they never drift.
 *
 *   Cu/Au is ×1000 (copper $/lb vs gold $/oz, otherwise the ratio is tiny);
 *   Cu/Ag is a plain ratio.
 *
 * Returns numeric values (null when an input is missing/zero). Callers format
 * for display with toFixed(3).
 */
export function computeRatios({ copper, gold, silver } = {}) {
  return {
    cuAu: (copper && gold) ? (copper * 1000 / gold) : null,
    cuAg: (copper && silver) ? (copper / silver) : null,
  };
}
