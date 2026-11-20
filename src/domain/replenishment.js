/**
 * Reposición del hogar (puro). Port del motor de Vida 2.0 (`lib/household-replenishment/engine.ts`):
 * cadencia robusta por mediana ponderada (más peso a lo reciente), descarte de anomalías por MAD,
 * confianza LOW/MEDIUM/HIGH y estados NOT_DUE / WATCH / ADD_TO_LIST / OVERDUE. Las correcciones del
 * usuario («todavía tengo», «queda poco», «se acabó») ajustan la estimación.
 */

const DAY_MS = 86_400_000;
const MAX_RECENT_INTERVALS = 8;

const daysBetween = (a, b) => Math.max(0, (Date.parse(b) - Date.parse(a)) / DAY_MS);
const addDays = (iso, days) => new Date(Date.parse(iso) + days * DAY_MS).toISOString();

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function weightedMedian(values) {
  if (!values.length) return null;
  const weighted = values.map((value, index) => ({ value, weight: index + 1 }));
  const threshold = weighted.reduce((sum, item) => sum + item.weight, 0) / 2;
  let cumulative = 0;
  for (const item of [...weighted].sort((a, b) => a.value - b.value)) {
    cumulative += item.weight;
    if (cumulative >= threshold) return item.value;
  }
  return weighted.at(-1).value;
}

export function robustIntervals(intervals) {
  const positive = intervals.filter((v) => Number.isFinite(v) && v > 0);
  if (positive.length < 4) return { values: positive.slice(-MAX_RECENT_INTERVALS), anomalyCount: 0 };
  const center = median(positive);
  if (!center || center <= 0) return { values: positive.slice(-MAX_RECENT_INTERVALS), anomalyCount: 0 };
  const mad = median(positive.map((v) => Math.abs(v - center))) ?? 0;
  const threshold = Math.max(center * 0.6, mad * 3, 2);
  const filtered = positive.filter((v) => Math.abs(v - center) <= threshold);
  if (filtered.length < 3) return { values: positive.slice(-MAX_RECENT_INTERVALS), anomalyCount: 0 };
  return { values: filtered.slice(-MAX_RECENT_INTERVALS), anomalyCount: positive.length - filtered.length };
}

function confidenceFor({ purchases, intervals, anomalyCount }) {
  const cycles = intervals.length;
  if (purchases.length <= 2 || cycles <= 1) return 'LOW';
  const center = weightedMedian(intervals);
  if (!center || center <= 0) return 'LOW';
  const mad = median(intervals.map((v) => Math.abs(v - center))) ?? center;
  const relativeVariability = mad / center;
  const anomalyRatio = anomalyCount / Math.max(1, cycles + anomalyCount);
  if (cycles >= 3 && relativeVariability <= 0.2 && anomalyRatio <= 0.25) return 'HIGH';
  if (relativeVariability <= 0.4 && anomalyRatio <= 0.4) return 'MEDIUM';
  return 'LOW';
}

/**
 * @param {{ need: { manualSeedIntervalDays?: number|null }, purchases: {purchasedAt:string}[], corrections: {type:string, occurredAt:string}[], now: Date }} input
 */
export function estimateCadence(input) {
  const purchases = [...input.purchases].sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt));
  const rawIntervals = purchases.slice(1).map((event, index) => daysBetween(purchases[index].purchasedAt, event.purchasedAt));
  const robust = robustIntervals(rawIntervals);
  const observedCenter = weightedMedian(robust.values);
  const baseInterval = observedCenter ?? input.need.manualSeedIntervalDays ?? null;
  const confidence = confidenceFor({ purchases, intervals: robust.values, anomalyCount: robust.anomalyCount });

  if (!purchases.length || !baseInterval || baseInterval <= 0) {
    return { expectedIntervalDays: baseInterval, variabilityDays: null, nextExpectedAt: null, suggestAt: null, confidence, state: 'NOT_DUE', forcedByCorrection: null, observations: purchases.length, anomalies: robust.anomalyCount };
  }

  const latest = purchases.at(-1);
  const relevant = input.corrections.filter((e) => e.occurredAt > latest.purchasedAt);
  const stillHave = relevant.filter((e) => e.type === 'STILL_HAVE').length;
  const out = relevant.filter((e) => e.type === 'OUT').length;
  const correctionFactor = Math.min(1.5, 1.1 ** stillHave) * Math.max(0.6, 0.9 ** out);
  const expectedIntervalDays = Math.max(1, baseInterval * correctionFactor);
  const variabilityDays = median(robust.values.map((v) => Math.abs(v - (observedCenter ?? v))));
  const variabilityBuffer = variabilityDays == null ? 0 : Math.min(7, variabilityDays * 0.75);
  const leadDays = Math.max(2, Math.min(7, expectedIntervalDays * 0.15, 7), variabilityBuffer);
  let nextExpectedAt = addDays(latest.purchasedAt, expectedIntervalDays);
  const latestCorrection = [...relevant].filter((e) => ['STILL_HAVE', 'LOW', 'OUT'].includes(e.type)).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null;
  const forcedByCorrection = latestCorrection?.type === 'LOW' || latestCorrection?.type === 'OUT' ? latestCorrection.type : null;
  if (latestCorrection?.type === 'STILL_HAVE' && addDays(nextExpectedAt, -leadDays) <= latestCorrection.occurredAt) {
    nextExpectedAt = addDays(latestCorrection.occurredAt, leadDays + Math.max(3, leadDays));
  }
  const suggestAt = addDays(nextExpectedAt, -leadDays);
  const nowIso = input.now.toISOString();
  let state = 'NOT_DUE';
  if (forcedByCorrection) state = 'ADD_TO_LIST';
  else if (nowIso >= nextExpectedAt) state = confidence === 'HIGH' ? 'OVERDUE' : confidence === 'MEDIUM' ? 'WATCH' : 'NOT_DUE';
  else if (nowIso >= suggestAt) state = confidence === 'HIGH' ? 'ADD_TO_LIST' : confidence === 'MEDIUM' ? 'WATCH' : 'NOT_DUE';
  return { expectedIntervalDays, variabilityDays, nextExpectedAt, suggestAt, confidence, state, forcedByCorrection, observations: purchases.length, anomalies: robust.anomalyCount };
}

/** Días hasta la próxima compra esperada (negativo = vencido). */
export function daysUntil(iso, now) {
  return iso ? Math.round((Date.parse(iso) - now.getTime()) / DAY_MS) : null;
}
