import assert from 'node:assert/strict';
import { test } from 'node:test';

import { initialData } from './data.js';
import { applyIntent, editSet, togglePlannedSet, validateIntent } from './src/domain/actions.js';
import { parseCapture } from './src/domain/capture.js';
import { compare, e1rmSeries, epley, lastComparable, sessionSummary, validateSet, weeklyVolume } from './src/domain/gym.js';
import { dailySeries, energyStatus, macroShares, toGrams, totals, validateFoodEntry } from './src/domain/nutrition.js';
import { withMeta } from './src/views/gym.js';
import { esc } from './src/views/ui.js';

const fresh = () => structuredClone(initialData);
const ctx = (data) => ({
  exercises: data.gym.exercises.map((e) => ({ id: e.id, name: e.name, ...data.gym.exerciseMeta[e.id] })),
  catalog: data.nutrition.catalog,
  clock: data.demoClock.time,
});

test('e1RM de Epley solo para series de 1 a 15 repeticiones y banda estable de ±2 %', () => {
  assert.equal(epley(35, 10).toFixed(2), '46.67');
  assert.equal(epley(35, 16), null);
  assert.equal(epley(0, 10), null);
  assert.deepEqual(compare(100, 101.5).state, 'stable');
  assert.deepEqual(compare(105, 100).state, 'up');
  assert.deepEqual(compare(90, 100).state, 'down');
  assert.deepEqual(compare(null, 100).state, 'unknown');
});

test('el historial sintético es consistente y la sesión comparable es la más reciente', () => {
  const data = fresh();
  assert.equal(data.gym.history.length, 12);
  const dates = data.gym.history.map((s) => s.date);
  assert.deepEqual([...dates].sort(), dates);
  assert.ok(dates.every((d) => d < data.today));
  const previous = lastComparable(data.gym.history, 'press');
  assert.equal(previous.date, '2026-11-16');
  assert.equal(previous.sets[0].kg, 35);
  const series = e1rmSeries(withMeta(data.gym), 'press', [], data.today);
  assert.equal(series.length, 12);
  assert.ok(series.at(-1).e1rm > series[0].e1rm, 'la progresión sintética debe mostrar mejora');
});

test('registrar una serie actualiza resumen, comparación, récord y volumen semanal', () => {
  const data = fresh();
  const gym = withMeta(data.gym);
  const before = weeklyVolume(gym, data.gym.today, data.today).at(-1).volume;
  applyIntent(data, { kind: 'gym.set', exerciseId: 'press', sets: 1, kg: 37.5, reps: 10 });
  const summary = sessionSummary(withMeta(data.gym), data.gym.today);
  const press = summary.exercises.find((e) => e.exercise.id === 'press');
  assert.equal(summary.setCount, 1);
  assert.equal(summary.volume, 375);
  assert.equal(press.comparison.state, 'up');
  assert.equal(press.personalRecord, true);
  assert.equal(weeklyVolume(withMeta(data.gym), data.gym.today, data.today).at(-1).volume, before + 375);
});

test('las series se validan, se editan y las planificadas se marcan y desmarcan', () => {
  const data = fresh();
  assert.equal(validateIntent(data, { kind: 'gym.set', exerciseId: 'press', kg: 500, reps: 10 }).ok, false);
  assert.equal(validateIntent(data, { kind: 'gym.set', exerciseId: 'press', kg: 35.3, reps: 10 }).errors.kg, 'Usá incrementos de 0,25 kg.');
  assert.equal(validateIntent(data, { kind: 'gym.set', exerciseId: 'press', kg: 35, reps: 0 }).ok, false);
  assert.equal(validateIntent(data, { kind: 'gym.set', exerciseId: 'plank', seconds: 2 }).ok, false);
  assert.equal(validateSet(null, {}).ok, false);
  assert.equal(togglePlannedSet(data, 'press-1', { kg: 35, reps: 10 }), true);
  assert.equal(editSet(data, 'press-1', { kg: 40, reps: 8 }).ok, true);
  assert.deepEqual(data.gym.today[0], { id: 'press-1', exerciseId: 'press', planned: true, kg: 40, reps: 8 });
  assert.equal(editSet(data, 'press-1', { kg: -1, reps: 8 }).ok, false);
  assert.equal(data.gym.today[0].kg, 40);
  assert.equal(togglePlannedSet(data, 'press-1', { kg: 35, reps: 10 }), false);
  assert.equal(data.gym.today.length, 0);
});

test('nutrición: desconocido nunca es cero y la energía se compara contra un rango', () => {
  const data = fresh();
  const day = data.nutrition.days[0];
  const t = totals(day.meals, data.nutrition.catalog);
  assert.equal(t.kcal.value, 2010);
  assert.equal(t.kcal.complete, true);
  assert.equal(t.fiber.complete, false, 'los platos registrados no traen fibra');
  assert.equal(t.fiber.value, 0);
  assert.equal(t.fiber.known, 0);
  assert.deepEqual(energyStatus(t.kcal, data.nutrition.target), { state: 'within', diff: 0 });
  assert.deepEqual(energyStatus({ value: 1500, complete: true }, data.nutrition.target), { state: 'below', diff: 500 });
  assert.deepEqual(energyStatus({ value: 1500, complete: false }, data.nutrition.target), { state: 'partial', diff: null });
  const shares = macroShares(t);
  assert.equal(shares.protein + shares.carbs + shares.fat, 100);
  assert.equal(macroShares({ protein: { complete: false }, carbs: { complete: true }, fat: { complete: true } }), null);
});

test('agregar un alimento por porción suma energía y macros con su gramaje', () => {
  const data = fresh();
  const banana = data.nutrition.catalog.find((f) => f.id === 'banana');
  assert.equal(toGrams(banana, 2, 'unit'), 240);
  assert.equal(validateFoodEntry(banana, 0, 'unit').ok, false);
  assert.equal(validateFoodEntry(banana, 20, 'unit').ok, false, 'más de 2 kg en una entrada');
  applyIntent(data, { kind: 'food.entry', foodId: 'banana', amount: 2, portionId: 'unit', moment: 'Merienda' });
  const added = data.nutrition.days[0].meals.at(-1);
  assert.deepEqual([added.type, added.time, added.grams], ['Merienda', '17:00', 240]);
  const t = totals(data.nutrition.days[0].meals, data.nutrition.catalog);
  assert.equal(Math.round(t.kcal.value), 2010 + Math.round(89 * 2.4));
});

test('las tendencias promedian solo días completos', () => {
  const data = fresh();
  const days = [...data.nutrition.history, ...data.nutrition.days.map((d) => ({ ...d, items: d.meals }))];
  const s = dailySeries(days, data.nutrition.catalog, data.nutrition.target);
  assert.equal(s.points.length, 14);
  assert.equal(s.comparableDays, 12, 'hoy (en curso) y el lunes incompleto quedan fuera');
  assert.ok(s.avgKcal > 1900 && s.avgKcal < 2350);
});

test('el intérprete local reconoce patrones acotados y nunca adivina', () => {
  const data = fresh();
  const r = parseCapture('Hice press de pecho, 3 series de 10 con 35 kilos y remo 3x12 con 30 kg', ctx(data));
  assert.deepEqual(r.intents.map((i) => [i.exerciseId, i.sets, i.kg, i.reps]), [['press', 3, 35, 10], ['row', 3, 30, 12]]);
  const food = parseCapture('En el almuerzo comí 150 g de arroz, una porción de pollo y un café', ctx(data));
  assert.deepEqual(food.intents.map((i) => [i.foodId, i.amount, i.portionId, i.moment.value]), [['rice', 150, 'g', 'Almuerzo'], ['chicken', 1, 'portion', 'Almuerzo']]);
  assert.deepEqual(food.unparsed, ['un cafe (no está en el catálogo de la demo)']);
  const expense = parseCapture('Gasté 12.500 en el supermercado', ctx(data)).intents[0];
  assert.deepEqual([expense.kind, expense.amount, expense.categoryId], ['finance.expense', 12500, 'food']);
  assert.equal(parseCapture('Tengo que llamar al banco', ctx(data)).intents[0].title, 'Llamar al banco');
  const decimal = parseCapture('Hice press de pecho, 3 series de 10 con 37,5 kilos', ctx(data)).intents[0];
  assert.deepEqual([decimal.sets, decimal.kg, decimal.reps], [3, 37.5, 10], 'la coma decimal no se trata como separador');
  assert.equal(parseCapture('comí 1,5 tazas de arroz', ctx(data)).intents[0].amount, 1.5);
  const missing = parseCapture('hice sentadilla', ctx(data)).intents[0];
  assert.deepEqual(missing.missing, ['kg', 'reps']);
  assert.equal(validateIntent(data, missing).ok, false);
  const unknown = parseCapture('hice curl de bíceps 3x10 con 12 kg', ctx(data));
  assert.equal(unknown.intents.length, 0);
  assert.equal(unknown.unparsed.length, 1);
  assert.equal(parseCapture('x'.repeat(5000), ctx(data)).unparsed[0].length, 600, 'la entrada se acota');
});

test('gasto y tarea capturados actualizan finanzas y tareas', () => {
  const data = fresh();
  applyIntent(data, { kind: 'finance.expense', amount: 12500, categoryId: 'food', description: 'Supermercado' });
  assert.equal(data.finances.categories.find((c) => c.id === 'food').spent, 226500);
  assert.equal(data.finances.movements[0].description, 'Supermercado');
  assert.equal(validateIntent(data, { kind: 'finance.expense', amount: 0, categoryId: 'food' }).ok, false);
  assert.equal(validateIntent(data, { kind: 'finance.expense', amount: 10, categoryId: 'nope' }).ok, false);
  applyIntent(data, { kind: 'task.create', title: '  Revisar contrato  ' });
  assert.equal(data.tasks.at(-1).label, 'Revisar contrato');
  assert.equal(validateIntent(data, { kind: 'task.create', title: 'ok' }).ok, false);
  assert.equal(initialData.finances.categories[1].spent, 214000, 'los datos iniciales no se mutan');
});

test('el texto ingresado se escapa antes de renderizarse', () => {
  assert.equal(esc('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(esc('"\'&'), '&quot;&#39;&amp;');
});
