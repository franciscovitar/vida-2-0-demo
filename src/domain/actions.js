/**
 * Aplicación de registros sobre el estado de la demo. Cada función valida antes de escribir y opera
 * sobre el borrador que recibe (app.js lo clona antes y guarda el anterior para «Deshacer»).
 */
import { toGrams, validateFoodEntry } from './nutrition.js';
import { validateSet } from './gym.js';
import { saveCollection, validateCollection } from './collections.js';

const MOMENT_TIME = { Desayuno: '08:30', 'Colación': '11:00', Almuerzo: '13:00', Merienda: '17:00', Cena: '21:00' };

export function nextId(data, prefix) {
  data.seq = (data.seq ?? 0) + 1;
  return `${prefix}-${data.seq}`;
}

const exerciseOf = (data, id) => {
  const base = data.gym.exercises.find((e) => e.id === id);
  return base ? { ...base, ...data.gym.exerciseMeta[id] } : null;
};

/** Normaliza y valida cualquier intención (de formulario o del intérprete). */
export function validateIntent(data, intent) {
  switch (intent.kind) {
    case 'shopping.item':
    case 'media.movie':
    case 'media.series':
    case 'media.season':
    case 'study.deck':
    case 'study.card':
      return validateCollection(data, intent.kind, intent);
    case 'gym.set': {
      const exercise = exerciseOf(data, intent.exerciseId);
      const sets = Number(intent.sets ?? 1);
      const result = validateSet(exercise, { kg: intent.kg, reps: intent.reps, seconds: intent.seconds });
      if (!Number.isInteger(sets) || sets < 1 || sets > 10) { result.ok = false; result.errors.sets = 'Entre 1 y 10 series.'; }
      return result;
    }
    case 'food.entry': {
      const food = data.nutrition.catalog.find((f) => f.id === intent.foodId);
      return validateFoodEntry(food, intent.amount, intent.portionId);
    }
    case 'finance.expense': {
      const errors = {};
      const amount = Number(intent.amount);
      if (!Number.isInteger(amount) || amount <= 0 || amount > 10_000_000) errors.amount = 'Ingresá un importe entero entre 1 y 10.000.000.';
      if (!data.finances.categories.some((c) => c.id === intent.categoryId)) errors.categoryId = 'Elegí una categoría.';
      if (String(intent.description ?? '').trim().length > 60) errors.description = 'Máximo 60 caracteres.';
      return { ok: !Object.keys(errors).length, errors };
    }
    case 'cardio.session': {
      const errors = {};
      const blank = (v) => v == null || String(v).trim() === '';
      const minutes = Number(intent.minutes);
      if (blank(intent.minutes) || !Number.isInteger(minutes) || minutes < 5 || minutes > 300) errors.minutes = 'Entre 5 y 300 minutos.';
      if (!blank(intent.rpe) && (!Number.isInteger(Number(intent.rpe)) || intent.rpe < 1 || intent.rpe > 10)) errors.rpe = 'Esfuerzo entre 1 y 10.';
      if (!blank(intent.watts) && (!Number.isInteger(Number(intent.watts)) || intent.watts < 20 || intent.watts > 600)) errors.watts = 'Potencia entre 20 y 600 W.';
      if (!['bike', 'football'].includes(intent.modality)) errors.modality = 'Elegí bici o fútbol.';
      return { ok: !Object.keys(errors).length, errors };
    }
    case 'household.purchase':
      return data.household.needs.some((n) => n.id === intent.needId) ? { ok: true, errors: {} } : { ok: false, errors: { needId: 'Elegí un producto con historial.' } };
    case 'task.create': {
      const title = String(intent.title ?? '').trim();
      const errors = title.length < 3 ? { title: 'Escribí al menos 3 caracteres.' } : title.length > 120 ? { title: 'Máximo 120 caracteres.' } : {};
      return { ok: !Object.keys(errors).length, errors };
    }
    default:
      return { ok: false, errors: { kind: 'Tipo de registro desconocido.' } };
  }
}

/** Aplica una intención ya validada. Devuelve una descripción breve para el feedback. */
export function applyIntent(data, intent) {
  switch (intent.kind) {
    case 'shopping.item':
    case 'media.movie':
    case 'media.series':
    case 'media.season':
    case 'study.deck':
    case 'study.card':
      return saveCollection(data, intent.kind, intent);
    case 'gym.set': {
      const exercise = exerciseOf(data, intent.exerciseId);
      const sets = Number(intent.sets ?? 1);
      for (let i = 0; i < sets; i += 1) {
        const set = { id: nextId(data, 'set'), exerciseId: exercise.id, planned: false };
        if (exercise.mode === 'time') set.seconds = Number(intent.seconds);
        else { set.kg = Number(intent.kg); set.reps = Number(intent.reps); }
        data.gym.today.push(set);
      }
      return `${sets} ${sets === 1 ? 'serie' : 'series'} de ${exercise.name}`;
    }
    case 'food.entry': {
      const food = data.nutrition.catalog.find((f) => f.id === intent.foodId);
      const amount = Number(intent.amount);
      const moment = intent.moment?.value ?? intent.moment ?? 'Almuerzo';
      data.nutrition.days[0].meals.push({ id: nextId(data, 'food'), time: MOMENT_TIME[moment] ?? '12:00', type: moment, foodId: food.id, amount, portionId: intent.portionId, grams: Math.round(toGrams(food, amount, intent.portionId)) });
      return `${food.name} en ${moment.toLowerCase()}`;
    }
    case 'finance.expense': {
      const amount = Number(intent.amount);
      const category = data.finances.categories.find((c) => c.id === intent.categoryId);
      category.spent += amount;
      // Un gasto pagado sale de la liquidez elegible: Safe-to-Spend lo refleja de inmediato.
      data.finances.planning.liquidity = Math.max(0, data.finances.planning.liquidity - amount);
      data.finances.movements.unshift({ id: nextId(data, 'mov'), date: data.today, description: String(intent.description ?? '').trim() || 'Gasto registrado', categoryId: category.id, amount });
      return `gasto de $ ${new Intl.NumberFormat('es-AR').format(amount)} en ${category.name}`;
    }
    case 'cardio.session': {
      const optional = (v) => (v == null || String(v).trim() === '' ? null : Number(v));
      data.gym.cardio.push({ id: nextId(data, 'cardio'), date: data.today, modality: intent.modality, minutes: Number(intent.minutes), rpe: optional(intent.rpe), watts: optional(intent.watts) });
      return `${intent.modality === 'bike' ? 'bici' : 'fútbol'} ${intent.minutes} min`;
    }
    case 'household.purchase': {
      recordPurchase(data, intent.needId);
      return `compra de ${data.household.needs.find((n) => n.id === intent.needId).name}`;
    }
    case 'task.create': {
      const title = String(intent.title).trim();
      data.tasks.push({ id: nextId(data, 'task'), label: title, project: 'Sin proyecto', category: 'General', priority: intent.priority === 'Alta' ? 'Alta' : 'Media', done: false });
      return `tarea «${title}»`;
    }
    default:
      throw new Error(`Intención no soportada: ${intent.kind}`);
  }
}

export function editSet(data, setId, values) {
  const set = data.gym.today.find((s) => s.id === setId);
  if (!set) return { ok: false, errors: { set: 'La serie ya no existe.' } };
  const exercise = exerciseOf(data, set.exerciseId);
  const result = validateSet(exercise, values);
  if (!result.ok) return result;
  if (exercise.mode === 'time') set.seconds = Number(values.seconds);
  else { set.kg = Number(values.kg); set.reps = Number(values.reps); }
  return result;
}

/** Momento de la demo con un contador para mantener el orden de los eventos del día. */
const stamp = (data) => `${data.today}T12:${String(Math.min(59, (data.seq ?? 0))).padStart(2, '0')}:00.000Z`;

/** Registra una compra de un producto del hogar y tacha la sugerencia de la lista si estaba. */
export function recordPurchase(data, needId, ref = null) {
  data.household.extraPurchases.push({ id: ref ?? nextId(data, 'purchase'), needId, purchasedAt: stamp(data) });
  for (const item of data.shopping) if (item.needId === needId && !item.checked) item.checked = true;
}

export function recordCorrection(data, needId, type) {
  data.household.corrections.push({ id: nextId(data, 'corr'), needId, type, occurredAt: stamp(data) });
}

/** Agrega a la lista un producto sugerido por la reposición. */
export function addRestockToList(data, needId) {
  const need = data.household.needs.find((n) => n.id === needId);
  if (!need || data.shopping.some((i) => i.needId === needId && !i.checked)) return false;
  data.shopping.push({ id: nextId(data, 'item'), needId, name: need.name, category: need.category, amount: need.amount, checked: false });
  return true;
}

export function addEpisode(data, seriesId) {
  const series = data.series.find((s) => s.id === seriesId);
  const season = series?.seasons.find((s) => s.watched < s.episodes);
  if (!season) return null;
  season.watched += 1;
  if (series.seasons.every((s) => s.watched === s.episodes)) series.paused = false;
  return `${series.title} T${season.n}E${season.watched}`;
}

export function rateSeason(data, seriesId, n, rating) {
  const season = data.series.find((s) => s.id === seriesId)?.seasons.find((s) => s.n === n);
  if (!season || season.watched < season.episodes || !(rating >= 1 && rating <= 5)) return false;
  season.rating = season.rating === rating ? null : rating;
  return true;
}

/* ───────── Organizar e Inglés ───────── */

export function updateContinuity(data, id, values) {
  const item = data.planning.continuity.find((c) => c.id === id);
  const next = String(values.nextAction ?? '').trim();
  if (!item) return { ok: false, errors: { nextAction: 'El frente ya no existe.' } };
  if (next.length < 3 || next.length > 120) return { ok: false, errors: { nextAction: 'Describí el próximo paso (3 a 120 caracteres).' } };
  item.nextAction = next;
  item.blocker = String(values.blocker ?? '').trim().slice(0, 120) || null;
  item.lastProgress = data.today;
  return { ok: true, errors: {} };
}

export function toggleMilestone(data, goalId, milestoneId, done) {
  const milestone = data.planning.goals.find((g) => g.id === goalId)?.milestones.find((m) => m.id === milestoneId);
  if (!milestone) return false;
  milestone.done = Boolean(done);
  return true;
}

export function addReview(data, values, snapshot) {
  data.planning.reviews.unshift({ id: nextId(data, 'review'), week: '16–22 nov', closedAt: data.today, wentWell: values.wentWell.trim(), adjust: values.adjust.trim(), focus: values.focus.trim(), snapshot: snapshot.map(({ label, value }) => ({ label, value })) });
}

export function addAchievement(data, values) {
  data.planning.achievements.push({ id: nextId(data, 'ach'), title: values.title.trim(), category: values.category, assertion: 'SELF_REPORTED', date: values.date || null });
}

export function addEnglishSession(data, values) {
  const minutes = Number(values.minutes);
  const focus = String(values.focus ?? '').trim();
  const errors = {};
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180) errors.minutes = 'Entre 5 y 180 minutos.';
  if (focus.length < 3 || focus.length > 80) errors.focus = 'Contá en pocas palabras qué practicaste.';
  if (Object.keys(errors).length) return { ok: false, errors };
  data.english.lab.sessions.push({ id: nextId(data, 'eng'), date: data.today, type: values.type, minutes, focus });
  return { ok: true, errors };
}

/** Convierte un patrón de error recurrente en una tarjeta del mazo de inglés (sin duplicarla). */
export function addEnglishCard(data, weaknessId) {
  const weakness = data.english.lab.weaknesses.find((w) => w.id === weaknessId);
  const deck = data.decks.find((d) => d.id === 'english');
  if (!weakness || deck.cards.some((c) => c.front === weakness.card.front)) return false;
  deck.cards.push({ ...weakness.card });
  return true;
}

/** Marca o desmarca una serie planificada (`press-1`) con la carga y repeticiones del plan. */
export function togglePlannedSet(data, key, plan) {
  const index = data.gym.today.findIndex((s) => s.id === key);
  if (index >= 0) { data.gym.today.splice(index, 1); return false; }
  const exercise = exerciseOf(data, key.split('-')[0]);
  const set = { id: key, exerciseId: exercise.id, planned: true };
  if (exercise.mode === 'time') set.seconds = plan.seconds; else { set.kg = plan.kg; set.reps = plan.reps; }
  data.gym.today.push(set);
  return true;
}
