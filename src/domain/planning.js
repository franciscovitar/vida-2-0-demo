/**
 * Planificación (puro). Adaptado de Vida 2.0:
 * - «En qué quedé» (`lib/session-continuity/view.ts`): próximo paso y bloqueo por proyecto; un avance de
 *   más de 7 días se marca como desactualizado y una fecha futura no certifica nada.
 * - Objetivos con hitos; el progreso sale de hitos cumplidos, no de horas invertidas.
 * - Revisión semanal compuesta desde las fuentes de la demo (no se inventan valores).
 * - Logros: categoría y aserción (autoinformado / verificado por su dueño).
 */
import { financeSummary } from '../../logic.js';

const DAY = 86_400_000;

export function continuityState(item, today) {
  if (!item.lastProgress || item.lastProgress > today) return 'unknown';
  const age = (Date.parse(`${today}T12:00:00Z`) - Date.parse(`${item.lastProgress}T12:00:00Z`)) / DAY;
  if (item.blocker) return age > 7 ? 'blocked-stale' : 'blocked';
  return age > 7 ? 'stale' : 'ready';
}

export function daysSince(date, today) {
  return Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / DAY);
}

export function goalProgress(goal) {
  const done = goal.milestones.filter((m) => m.done).length;
  return { done, total: goal.milestones.length, ratio: goal.milestones.length ? done / goal.milestones.length : 0, next: goal.milestones.find((m) => !m.done) ?? null };
}

/** Datos de la semana en curso tomados de cada módulo; cada número indica su fuente. */
export function weekSnapshot(data) {
  const tasksDone = data.tasks.filter((t) => t.done).length;
  const sessions = data.gym.sessionsThisWeek + (data.gym.completed ? 1 : 0);
  const habitsDone = data.habits.filter((h) => h.done).length;
  const f = financeSummary(data);
  const reviewed = Object.values(data.study).filter((s) => s.reps > 0).length;
  const sleep = data.health.history.slice(-7).map((d) => d.sleepHours).filter((v) => v != null);
  return [
    { id: 'tasks', label: 'Tareas cerradas', value: `${tasksDone}/${data.tasks.length}`, source: 'Tareas' },
    { id: 'habits', label: 'Hábitos de hoy', value: `${habitsDone}/${data.habits.length}`, source: 'Hábitos' },
    { id: 'gym', label: 'Sesiones de gimnasio', value: `${sessions}/${data.gym.goal}`, source: 'Gimnasio' },
    { id: 'sleep', label: 'Sueño promedio', value: sleep.length ? `${(sleep.reduce((a, b) => a + b, 0) / sleep.length).toFixed(1).replace('.', ',')} h` : 'sin dato', source: 'Salud' },
    { id: 'budget', label: 'Categorías sobre el ritmo', value: `${f.categories.filter((c) => c.overPace).length}/${f.categories.length}`, source: 'Finanzas' },
    { id: 'study', label: 'Tarjetas repasadas', value: String(reviewed), source: 'Mazos' },
  ];
}

export function validateReview(values) {
  const errors = {};
  for (const key of ['wentWell', 'adjust', 'focus']) {
    const text = String(values[key] ?? '').trim();
    if (text.length < 3) errors[key] = 'Escribí al menos unas palabras.';
    else if (text.length > 280) errors[key] = 'Máximo 280 caracteres.';
  }
  return { ok: !Object.keys(errors).length, errors };
}

/** Fecha civil real: rechaza 2026-02-30 en lugar de dejar que Date la «corra» al mes siguiente. */
export function isCivilDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const time = Date.parse(`${value}T12:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function validateAchievement(values) {
  const errors = {};
  const title = String(values.title ?? '').trim();
  if (title.length < 3 || title.length > 100) errors.title = 'Entre 3 y 100 caracteres.';
  if (!['ACADEMIC', 'PROJECT', 'PROFESSIONAL', 'PERSONAL', 'OTHER'].includes(values.category)) errors.category = 'Elegí una categoría.';
  if (values.date && !isCivilDate(values.date)) errors.date = 'Fecha inválida.';
  return { ok: !Object.keys(errors).length, errors };
}
