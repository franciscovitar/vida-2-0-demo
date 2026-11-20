/**
 * Aplicación de registros sobre el estado de la demo. Cada función valida antes de escribir y opera
 * sobre el borrador que recibe (app.js lo clona antes y guarda el anterior para «Deshacer»).
 */
import { toGrams, validateFoodEntry } from './nutrition.js';
import { validateSet } from './gym.js';

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
      data.finances.movements.unshift({ id: nextId(data, 'mov'), date: data.today, description: String(intent.description ?? '').trim() || 'Gasto registrado', categoryId: category.id, amount });
      return `gasto de $ ${new Intl.NumberFormat('es-AR').format(amount)} en ${category.name}`;
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
