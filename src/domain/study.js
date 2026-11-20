/**
 * Estudio (puro). Vida 2.0 real usa FSRS (`ts-fsrs`) con intentos persistidos offline e idempotentes.
 * La demo usa un programador simplificado y determinista, inspirado en las mismas cuatro calificaciones
 * (Otra vez / Difícil / Bien / Fácil). No es FSRS: no estima estabilidad ni dificultad por modelo.
 */

export const SCHEDULER_VERSION = 'demo-srs-lite-v1';
export const RATINGS = Object.freeze([
  { id: 'again', label: 'Otra vez' },
  { id: 'hard', label: 'Difícil' },
  { id: 'good', label: 'Bien' },
  { id: 'easy', label: 'Fácil' },
]);

export const newCardState = () => ({ state: 'new', interval: 0, ease: 2.5, reps: 0, lapses: 0, dueIn: 0 });

/** Próximo estado tras una calificación. `dueIn` está en días desde hoy (0 = vuelve en esta sesión). */
export function schedule(card, rating) {
  const s = { ...(card ?? newCardState()) };
  if (rating === 'again') {
    return { ...s, state: s.state === 'review' ? 'relearning' : 'learning', interval: 0, ease: Math.max(1.3, s.ease - 0.2), lapses: s.lapses + (s.state === 'review' ? 1 : 0), reps: s.reps + 1, dueIn: 0 };
  }
  let interval;
  if (s.interval === 0) interval = rating === 'hard' ? 1 : rating === 'good' ? 1 : 4;
  else interval = Math.round(s.interval * (rating === 'hard' ? 1.2 : rating === 'good' ? s.ease : s.ease * 1.3));
  interval = Math.max(s.interval + (rating === 'hard' ? 0 : 1), interval, 1);
  const ease = rating === 'hard' ? Math.max(1.3, s.ease - 0.15) : rating === 'easy' ? s.ease + 0.15 : s.ease;
  return { ...s, state: 'review', interval, ease, reps: s.reps + 1, dueIn: interval };
}

export const intervalLabel = (dueIn) => (dueIn === 0 ? 'en esta sesión' : dueIn === 1 ? 'mañana' : dueIn < 30 ? `en ${dueIn} días` : `en ${Math.round(dueIn / 30)} mes${dueIn >= 60 ? 'es' : ''}`);

export const previewIntervals = (card) => Object.fromEntries(RATINGS.map((r) => [r.id, intervalLabel(schedule(card, r.id).dueIn)]));

/** Normaliza para comparar respuestas escritas de forma determinista (acentos, mayúsculas, puntuación). */
export const normalizeAnswer = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();

export function checkAnswer(card, answer) {
  if (!card.accepted?.length || !String(answer ?? '').trim()) return null;
  const given = normalizeAnswer(answer);
  return { correct: card.accepted.some((a) => normalizeAnswer(a) === given), given: answer };
}

/** Resumen de un mazo según el estado de cada tarjeta. */
export function deckStats(deck, states) {
  const cards = deck.cards.map((card, i) => states[`${deck.id}:${i}`] ?? null);
  return {
    total: cards.length,
    fresh: cards.filter((s) => !s).length,
    learning: cards.filter((s) => s && s.dueIn === 0).length,
    scheduled: cards.filter((s) => s && s.dueIn > 0).length,
  };
}
