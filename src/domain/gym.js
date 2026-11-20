/**
 * Dominio Gimnasio (puro). Reglas adaptadas de Vida 2.0 (`docs/gym-v2-source.md`):
 * - e1RM de Epley como índice personal solo para series de 1–15 repeticiones;
 * - el set observado (kg × reps) sigue siendo la evidencia visible;
 * - cambios dentro de ±2 % se consideran estables para no exagerar ruido.
 */

export const E1RM_MIN_REPS = 1;
export const E1RM_MAX_REPS = 15;
export const STABLE_BAND = 0.02;
export const LIMITS = Object.freeze({ kgMax: 400, repsMax: 100, secondsMax: 600 });

/** e1RM de Epley; `null` cuando la serie no es comparable (por tiempo o fuera de 1–15 reps). */
export function epley(kg, reps) {
  if (!(kg > 0) || !Number.isInteger(reps) || reps < E1RM_MIN_REPS || reps > E1RM_MAX_REPS) return null;
  return kg * (1 + reps / 30);
}

export function round1(value) {
  return Math.round(value * 10) / 10;
}

/** Valida una serie registrada desde la interfaz o el intérprete. Devuelve errores legibles. */
export function validateSet(exercise, input) {
  const errors = {};
  if (!exercise) return { ok: false, errors: { exercise: 'Elegí un ejercicio de la rutina.' } };
  // Un valor ausente nunca se interpreta como 0: se pide explícitamente.
  const blank = (v) => v == null || String(v).trim() === '';
  if (exercise.mode === 'time') {
    const seconds = Number(input.seconds);
    if (blank(input.seconds) || !Number.isInteger(seconds) || seconds < 5 || seconds > LIMITS.secondsMax) errors.seconds = `Indicá entre 5 y ${LIMITS.secondsMax} segundos.`;
  } else {
    const kg = Number(input.kg);
    const reps = Number(input.reps);
    if (blank(input.kg)) errors.kg = 'Indicá el peso (0 si es peso corporal).';
    else if (!Number.isFinite(kg) || kg < 0 || kg > LIMITS.kgMax) errors.kg = `El peso debe estar entre 0 y ${LIMITS.kgMax} kg.`;
    else if (Math.round(kg * 4) !== kg * 4) errors.kg = 'Usá incrementos de 0,25 kg.';
    if (!Number.isInteger(reps) || reps < 1 || reps > LIMITS.repsMax) errors.reps = `Las repeticiones deben ser un entero entre 1 y ${LIMITS.repsMax}.`;
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function setVolume(set) {
  return set.kg > 0 && set.reps > 0 ? set.kg * set.reps : 0;
}

export function bestSet(sets) {
  let best = null;
  for (const set of sets) {
    const value = epley(set.kg, set.reps);
    if (value != null && (!best || value > best.e1rm)) best = { ...set, e1rm: value };
  }
  return best;
}

/** Último registro del ejercicio en el historial (sesión comparable anterior). */
export function lastComparable(history, exerciseId) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const sets = history[i].sets.filter((s) => s.exerciseId === exerciseId);
    if (sets.length) return { date: history[i].date, sets };
  }
  return null;
}

export function compare(current, previous) {
  if (current == null || previous == null || previous <= 0) return { state: 'unknown', delta: null };
  const delta = (current - previous) / previous;
  if (Math.abs(delta) <= STABLE_BAND) return { state: 'stable', delta };
  return { state: delta > 0 ? 'up' : 'down', delta };
}

/** Resumen de la sesión de hoy por ejercicio, con comparación contra la sesión comparable anterior. */
export function sessionSummary(gym, todaySets) {
  const exercises = gym.exercises.map((exercise) => {
    const sets = todaySets.filter((s) => s.exerciseId === exercise.id);
    const previous = lastComparable(gym.history, exercise.id);
    const best = bestSet(sets);
    const prevBest = previous ? bestSet(previous.sets) : null;
    const allTime = bestSet(gym.history.flatMap((s) => s.sets.filter((x) => x.exerciseId === exercise.id)));
    return {
      exercise,
      sets,
      previous,
      best,
      prevBest,
      comparison: compare(best?.e1rm ?? null, prevBest?.e1rm ?? null),
      personalRecord: Boolean(best && allTime && best.e1rm > allTime.e1rm + 1e-9),
      volume: sets.reduce((total, s) => total + setVolume(s), 0),
    };
  });
  return {
    exercises,
    setCount: todaySets.length,
    volume: exercises.reduce((total, e) => total + e.volume, 0),
    records: exercises.filter((e) => e.personalRecord).length,
  };
}

/** Serie e1RM por sesión para un ejercicio (historial + hoy). */
export function e1rmSeries(gym, exerciseId, todaySets, todayDate) {
  const points = gym.history
    .map((session) => ({ date: session.date, best: bestSet(session.sets.filter((s) => s.exerciseId === exerciseId)) }))
    .filter((p) => p.best);
  const today = bestSet(todaySets.filter((s) => s.exerciseId === exerciseId));
  if (today) points.push({ date: todayDate, best: today, isToday: true });
  return points.map((p) => ({ date: p.date, e1rm: round1(p.best.e1rm), kg: p.best.kg, reps: p.best.reps, isToday: Boolean(p.isToday) }));
}

const DAY = 86_400_000;
const toDay = (iso) => Math.floor(Date.parse(`${iso}T12:00:00Z`) / DAY);

/** Volumen (kg × reps) agrupado en semanas de 7 días que terminan en `todayDate`. */
export function weeklyVolume(gym, todaySets, todayDate, weeks = 6) {
  const end = toDay(todayDate);
  const buckets = Array.from({ length: weeks }, (_, i) => ({ index: i, volume: 0, sessions: 0 }));
  const add = (date, sets) => {
    const age = end - toDay(date);
    const bucket = weeks - 1 - Math.floor(age / 7);
    if (bucket < 0 || bucket >= weeks) return;
    buckets[bucket].volume += sets.reduce((t, s) => t + setVolume(s), 0);
    buckets[bucket].sessions += 1;
  };
  gym.history.forEach((s) => add(s.date, s.sets));
  if (todaySets.length) add(todayDate, todaySets);
  return buckets;
}

/** Series por grupo muscular en los últimos 7 días (descriptivo). */
export function muscleSets(gym, todaySets, todayDate) {
  const end = toDay(todayDate);
  const counts = new Map(gym.exercises.map((e) => [e.muscle, 0]));
  const byId = new Map(gym.exercises.map((e) => [e.id, e]));
  const tally = (sets) => sets.forEach((s) => { const m = byId.get(s.exerciseId)?.muscle; if (m) counts.set(m, counts.get(m) + 1); });
  gym.history.filter((s) => end - toDay(s.date) < 7).forEach((s) => tally(s.sets));
  tally(todaySets);
  return [...counts].map(([muscle, sets]) => ({ muscle, sets }));
}
