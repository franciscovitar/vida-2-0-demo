/**
 * Salud (puro). Estructura adaptada de `health-scores-v1.2.0` de Vida 2.0:
 * - cada score tiene contribuyentes con peso; un contribuyente sin dato queda en `null` (nunca 0);
 * - si la cobertura de pesos es menor al 50 %, no hay score numérico (evidencia insuficiente);
 * - la confianza combina cobertura y días de base personal; bandas 80 / 60 / 40;
 * - Disposición (Readiness) = media geométrica de Sueño y Estabilidad cardio, solo si ambos existen.
 * Las curvas de utilidad son simplificaciones versionadas para la demo, no instrumentos clínicos.
 */

export const DEMO_SCORES_VERSION = 'demo-health-scores-v1';

function linear(points, x) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x0, y0] = points[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return points.at(-1)[1];
}
const round = (v) => Math.round(v);
export const avg = (xs) => { const v = xs.filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const sd = (xs) => { const v = xs.filter((x) => x != null); if (v.length < 3) return null; const m = avg(v); return Math.sqrt(v.reduce((t, x) => t + (x - m) ** 2, 0) / v.length); };
const dec = (v, d = 1) => v.toFixed(d).replace('.', ',');
const int = (v) => Math.round(v).toLocaleString('es-AR');

export const bandFor = (score) => (score == null ? 'insufficient' : score >= 80 ? 'strong' : score >= 60 ? 'good' : score >= 40 ? 'below-usual' : 'low');
export const BAND_LABEL = { strong: 'Fuerte', good: 'Bien', 'below-usual': 'Bajo lo habitual', low: 'Bajo', insufficient: 'Evidencia insuficiente' };

const sleepDurationUtility = (h) => linear([[4, 20], [5, 38], [6, 62], [7, 84], [8, 96], [9, 91], [10, 75]], h);
const lowerIsWorse = (rel) => linear([[-0.35, 25], [-0.2, 55], [-0.1, 75], [-0.05, 88], [0, 96], [0.15, 98]], rel);
const higherIsWorse = (rel) => linear([[-0.15, 96], [0, 96], [0.035, 86], [0.07, 66], [0.12, 42], [0.2, 18]], rel);
const regularity = (sdMinutes) => linear([[15, 96], [30, 86], [45, 70], [60, 52], [90, 30]], sdMinutes);
const stepsUtility = (steps) => linear([[2000, 20], [5000, 55], [8000, 88], [10000, 96]], steps);

const direction = (score) => (score == null ? 'unknown' : score >= 80 ? 'positive' : score < 60 ? 'negative' : 'neutral');
const contributor = (id, label, weight, score, detail) => ({ id, label, weight, score: score == null ? null : round(score), direction: direction(score), detail });

function aggregate(contributors, baselineDays, minCoverage = 0.5) {
  const total = contributors.reduce((t, x) => t + x.weight, 0);
  const available = contributors.filter((x) => x.score != null);
  const availableWeight = available.reduce((t, x) => t + x.weight, 0);
  const coverage = total ? availableWeight / total : 0;
  const baselineFactor = Math.min(1, 0.55 + (0.45 * baselineDays) / 28);
  const confidence = round(100 * coverage * baselineFactor);
  if (!availableWeight || availableWeight + 1e-9 < total * minCoverage) return { score: null, confidence, coverage, contributors };
  return { score: round(available.reduce((t, x) => t + x.score * x.weight, 0) / availableWeight), confidence, coverage, contributors };
}

/** Minutos alrededor de la medianoche (para promediar 23:50 y 00:10 sin saltos). */
const unwrap = (min) => (min == null ? null : min < 720 ? min + 1440 : min);
export const fmtTime = (min) => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

export function healthScores(history) {
  const last = history.at(-1);
  const recent = history.slice(-7);
  const baseline = history.slice(0, -7);
  const count = (key) => history.filter((d) => d[key] != null).length;

  const recentSleep = avg(recent.map((d) => d.sleepHours));
  const baseSleep = avg(baseline.map((d) => d.sleepHours));
  const window = history.slice(-14);
  const midpoints = window.map((d) => (d.bedtimeMin == null ? null : unwrap(d.bedtimeMin) + (d.sleepHours * 60) / 2));
  const midSd = sd(midpoints);
  const wakeSd = sd(window.map((d) => d.wakeMin));
  const sleep = aggregate([
    contributor('duration', 'Duración', 0.35, last.sleepHours == null ? null : sleepDurationUtility(last.sleepHours), last.sleepHours == null ? 'Sin registro de sueño anoche.' : `${dec(last.sleepHours)} h de sueño total anoche.`),
    contributor('continuity', 'Continuidad', 0.2, null, 'Sin tiempo en cama en la fuente: queda sin dato y no pesa.'),
    contributor('trend', 'Tendencia reciente', 0.15, recentSleep && baseSleep ? lowerIsWorse((recentSleep - baseSleep) / baseSleep) : null, recentSleep && baseSleep ? `7 días: ${dec(recentSleep)} h · base 21 días: ${dec(baseSleep)} h.` : 'Sin base suficiente.'),
    contributor('midpoint', 'Regularidad del punto medio', 0.2, midSd == null ? null : regularity(midSd), midSd == null ? 'Faltan noches para medir regularidad.' : `±${round(midSd)} min en 14 noches (centro ${fmtTime(avg(midpoints))}).`),
    contributor('wake', 'Consistencia al despertar', 0.1, wakeSd == null ? null : regularity(wakeSd), wakeSd == null ? 'Faltan noches.' : `±${round(wakeSd)} min al despertar.`),
  ], count('sleepHours'));

  const recentSteps = avg(recent.map((d) => d.steps));
  const baseSteps = avg(baseline.map((d) => d.steps));
  const activity = aggregate([
    contributor('movement', 'Movimiento reciente', 0.7, recentSteps == null ? null : stepsUtility(recentSteps), recentSteps == null ? 'Sin pasos registrados en 7 días.' : `${int(recentSteps)} pasos/día en 7 días (plan: 8.000).`),
    contributor('pattern', 'Vs. tu patrón', 0.3, recentSteps && baseSteps ? lowerIsWorse((recentSteps - baseSteps) / baseSteps) : null, baseSteps == null ? 'Sin base de 21 días.' : `Base de 21 días: ${int(baseSteps)} pasos/día.`),
  ], count('steps'));

  const recentHr = avg(recent.map((d) => d.restingHr));
  const baseHr = avg(baseline.map((d) => d.restingHr));
  const cardio = aggregate([
    contributor('rhr', 'FC en reposo', 0.65, recentHr && baseHr ? higherIsWorse((recentHr - baseHr) / baseHr) : null, recentHr && baseHr ? `${dec(recentHr)} lpm en 7 días · base ${dec(baseHr)} lpm.` : 'Sin frecuencia cardíaca suficiente para comparar.'),
    contributor('hrv', 'HRV', 0.35, null, 'La demo no modela HRV: hay score, con menor cobertura y confianza.'),
  ], count('restingHr'));

  const both = sleep.score != null && cardio.score != null;
  const readiness = {
    id: 'readiness', label: 'Disposición', question: '¿Cómo llegás hoy según sueño y señales cardio?',
    score: both ? round(Math.sqrt(sleep.score * cardio.score)) : null,
    confidence: both ? round(Math.sqrt(sleep.confidence * cardio.confidence) * 0.9) : round(Math.sqrt(Math.max(1, sleep.confidence) * Math.max(1, cardio.confidence)) * 0.55),
  };
  readiness.band = bandFor(readiness.score);

  const make = (id, label, question, agg) => ({ id, label, question, ...agg, band: bandFor(agg.score) });
  return {
    version: DEMO_SCORES_VERSION,
    readiness,
    scores: [
      make('sleep', 'Sueño', '¿Qué tan favorable fue tu patrón de sueño?', sleep),
      make('activity', 'Actividad', '¿Qué tan fuerte y consistente fue tu movimiento?', activity),
      make('cardio', 'Estabilidad cardio', '¿Qué tan estables están tus señales vs tu normal?', cardio),
    ],
    coverage: { days: history.length, sleep: count('sleepHours'), steps: count('steps'), restingHr: count('restingHr'), hrv: count('hrv') },
  };
}

/* ───────── Cardio semanal en MET-min (adaptado de docs/gym-v2-source.md) ───────── */

/** Plan: 8.000 pasos/día, 120 min de bici Zona 2 y 1 partido de fútbol por semana → 2.980 MET-min. */
export const CARDIO_PLAN = Object.freeze({ stepsPerWeek: 56_000, bikeMinutes: 120, footballMatches: 1 });
const STEP_PROXY = { stepsPerMin: 100, met: 3.5 };

export function cardioTarget(plan = CARDIO_PLAN) {
  return Math.round((plan.stepsPerWeek / STEP_PROXY.stepsPerMin) * STEP_PROXY.met + plan.bikeMinutes * 5 + plan.footballMatches * 60 * 7);
}

/** MET y confianza de una sesión: potencia > RPE > rol de la sesión. Nunca se inventa precisión individual. */
export function sessionMet(session) {
  if (session.modality === 'bike') {
    if (session.watts) return { met: session.watts < 100 ? 4.8 : session.watts < 150 ? 6.8 : 8.8, confidence: 'alta', basis: `${session.watts} W de potencia media` };
    if (session.rpe) return { met: session.rpe <= 4 ? 4 : session.rpe <= 6 ? 5.5 : 7, confidence: 'media', basis: `esfuerzo percibido ${session.rpe}/10` };
    return { met: 5, confidence: 'baja', basis: 'rol Zona 2 sin potencia ni RPE' };
  }
  if (session.modality === 'football') return { met: 7, confidence: 'media', basis: 'fútbol general (Compendium 2024)' };
  return { met: 4, confidence: 'baja', basis: 'actividad genérica' };
}

export function weeklyCardio(sessions, stepsWeek, plan = CARDIO_PLAN) {
  const items = sessions.map((s) => { const m = sessionMet(s); return { ...s, ...m, metMin: Math.round(m.met * s.minutes) }; });
  const stepsMetMin = Math.round((stepsWeek / STEP_PROXY.stepsPerMin) * STEP_PROXY.met);
  const total = stepsMetMin + items.reduce((t, s) => t + s.metMin, 0);
  const target = cardioTarget(plan);
  const bikeMinutes = items.filter((s) => s.modality === 'bike').reduce((t, s) => t + s.minutes, 0);
  const matches = items.filter((s) => s.modality === 'football').length;
  const remaining = Math.max(0, target - total);
  return {
    total, target, ratio: total / target, stepsMetMin, items,
    direct: [
      { id: 'steps', label: 'Pasos', done: stepsWeek, goal: plan.stepsPerWeek, unit: 'pasos' },
      { id: 'bike', label: 'Bici Zona 2', done: bikeMinutes, goal: plan.bikeMinutes, unit: 'min' },
      { id: 'football', label: 'Fútbol', done: matches, goal: plan.footballMatches, unit: 'partido' },
    ],
    equivalents: remaining ? { steps: Math.round((remaining / STEP_PROXY.met) * STEP_PROXY.stepsPerMin), bikeMinutes: Math.round(remaining / 5), matches: Math.round((remaining / 420) * 10) / 10 } : null,
  };
}
