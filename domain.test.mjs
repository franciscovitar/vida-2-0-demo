import assert from 'node:assert/strict';
import { test } from 'node:test';

import { initialData } from './data.js';
import { applyIntent, editSet, recordPurchase, togglePlannedSet, validateIntent } from './src/domain/actions.js';
import { removeCollection } from './src/domain/collections.js';
import { estimateCadence } from './src/domain/replenishment.js';
import { parseCapture } from './src/domain/capture.js';
import { compare, e1rmSeries, epley, lastComparable, sessionSummary, validateSet, weeklyVolume } from './src/domain/gym.js';
import { dailySeries, energyStatus, macroShares, toGrams, totals, validateFoodEntry } from './src/domain/nutrition.js';
import { microDay, microWindow } from './src/domain/nutrition.js';
import { strengthBenchmark, trendEta } from './src/domain/gym.js';
import { EXAMPLE_STATEMENT, applyExampleImport, preflightStatement } from './src/domain/importer.js';

test('micronutrientes: 7D sin evidencia suficiente, 14D con señales y desconocido excluido', () => {
  const d = fresh();
  const days = [...d.nutrition.history, ...d.nutrition.days.map((x) => ({ ...x, items: x.meals }))];
  const recent = microWindow(days, d.nutrition.catalog, d.today, 7);
  assert.equal(recent.signals.length, 0);
  assert.ok(recent.nutrients.every((n) => n.evaluable === 2));
  const fortnight = microWindow(days, d.nutrition.catalog, d.today, 14);
  assert.deepEqual(fortnight.signals.map((n) => n.id), ['calcium', 'potassium', 'vitaminC', 'vitaminD']);
  assert.ok(fortnight.nutrients.every((n) => n.evaluable === 6));
  assert.equal(microDay(days.find((x) => x.date === '2026-11-15'), d.nutrition.catalog, 'calcium'), null, 'una empanada sin composición no equivale a cero');
  assert.equal(microDay(days.at(-1), d.nutrition.catalog, 'calcium'), null, 'día abierto');
  assert.throws(() => microWindow(days, d.nutrition.catalog, d.today, 42), RangeError);
});

test('benchmark: niveles ficticios, barra entre umbrales y ETA sólo con tendencia fiable', () => {
  const d = fresh();
  const series = e1rmSeries(withMeta(d.gym), 'press', [], d.today);
  const b = strengthBenchmark('press', series);
  assert.deepEqual([b.level, b.nextLevel, b.next, b.progress], ['Intermedio', 'Avanzado', 54, 15]);
  assert.ok(b.eta.days > 0 && b.eta.r2 > 0.7);
  assert.equal(strengthBenchmark('plank', series), null, 'sin umbrales en ejercicios por tiempo');
  assert.equal(trendEta(series.slice(-3), 54), null, '3 sesiones no justifican una proyección');
  assert.equal(trendEta(series.map((x) => ({ ...x, e1rm: 40 })), 54), null, 'sin progreso medible no hay ETA');
});

test('importación sintética: preflight, conciliación idempotente y exclusión económica de transferencias', () => {
  const d = fresh();
  const first = preflightStatement(EXAMPLE_STATEMENT, d.finances);
  assert.equal(first.ok, true);
  assert.deepEqual(['candidate', 'duplicate', 'review', 'invalid'].map((s) => first.rows.filter((r) => r.status === s).length), [4, 2, 1, 1]);
  const initial = d.finances.planning.liquidity;
  assert.equal(applyExampleImport(d), 4);
  assert.equal(d.finances.planning.liquidity, initial - 25000 + 3500);
  assert.equal(d.finances.movements.length, 2);
  assert.equal(d.finances.ledger.filter((m) => m.kind === 'transfer').length, 3);
  assert.equal(applyExampleImport(d), 0, 'un reintento exacto no duplica movimientos');
  assert.equal(preflightStatement(EXAMPLE_STATEMENT, d.finances).eligible, 0);
  const conflict = EXAMPLE_STATEMENT.replace('EX-002\n2026-11-13', 'EX-004\n2026-11-13');
  assert.ok(preflightStatement(conflict, d.finances).rows.some((r) => r.reason.includes('Referencia importada con datos distintos')));
  assert.equal(preflightStatement('bad;header\n2026-11-01;X;123;expense;food;X', d.finances).ok, false);
});
import { withMeta } from './src/views/gym.js';
import { esc } from './src/views/ui.js';

const fresh = () => structuredClone(initialData);

test('compras: alta, edición, historial y retiro sin inventar una predicción', () => {
  const d = fresh();
  const input = { kind: 'shopping.item', name: 'Café nuevo', category: 'Almacén', amount: '500 g' };
  assert.equal(validateIntent(d, { ...input, amount: '' }).ok, false);
  assert.equal(validateIntent(d, input).ok, true);
  applyIntent(d, input);
  const item = d.shopping.at(-1);
  const need = d.household.needs.at(-1);
  assert.equal(item.needId, need.id);
  assert.equal(need.isDemoAdded, true);
  let estimate = estimateCadence({ need, purchases: need.purchases, corrections: [], now: new Date(`${d.today}T12:00:00Z`) });
  assert.equal(estimate.expectedIntervalDays, null);
  assert.equal(estimate.nextExpectedAt, null);
  assert.equal(estimate.confidence, 'LOW');
  recordPurchase(d, need.id);
  estimate = estimateCadence({ need, purchases: d.household.extraPurchases.filter((p) => p.needId === need.id), corrections: [], now: new Date(`${d.today}T12:00:00Z`) });
  assert.equal(estimate.observations, 1);
  assert.equal(estimate.nextExpectedAt, null);
  applyIntent(d, { ...input, id: item.id, name: 'Café tostado', amount: '250 g' });
  assert.equal(need.name, 'Café tostado');
  assert.equal(d.household.extraPurchases.length, 1);
  assert.equal(removeCollection(d, 'shopping.item', item.id), true);
  assert.equal(d.household.extraPurchases.length, 1, 'quitar de la lista no borra las compras históricas');
  assert.equal(validateIntent(d, { ...input, name: '<img onerror=alert(1)>' }).ok, true, 'texto arbitrario es dato, no HTML');
});

test('películas y series: altas, edición, validación, temporada, pausa y eliminación', () => {
  const d = fresh();
  const film = { kind: 'media.movie', title: 'Viaje de prueba', genre: 'Aventura', year: '2026', status: 'watched', rating: '5', watchedOn: d.today, note: 'Buena puesta en escena' };
  assert.equal(validateIntent(d, { ...film, rating: '9' }).ok, false);
  assert.equal(validateIntent(d, { ...film, watchedOn: '2027-01-01' }).ok, false);
  assert.equal(validateIntent(d, { ...film, watchedOn: '2026-02-31' }).ok, false);
  assert.equal(validateIntent(d, film).ok, true);
  applyIntent(d, film);
  const movie = d.movies.at(-1);
  assert.equal(movie.rating, 5);
  applyIntent(d, { ...film, id: movie.id, status: 'planned', rating: '', watchedOn: '', note: 'Para volver a mirar' });
  assert.equal(movie.watched, false);
  assert.equal(movie.rating, null);
  assert.equal(removeCollection(d, 'media.movie', movie.id), true);

  const seriesInput = { kind: 'media.series', title: 'Un verano', genre: 'Drama', year: '2026', minutesPerEpisode: '40', episodes: '6' };
  assert.equal(validateIntent(d, seriesInput).ok, true);
  applyIntent(d, seriesInput);
  const series = d.series.at(-1);
  assert.equal(series.seasons[0].episodes, 6);
  applyIntent(d, { kind: 'media.season', seriesId: series.id, episodes: '8' });
  assert.deepEqual(series.seasons.map((s) => s.episodes), [6, 8]);
  assert.equal(validateIntent(d, { kind: 'media.season', seriesId: series.id, episodes: '0' }).ok, false);
  applyIntent(d, { ...seriesInput, id: series.id, title: 'Verano de prueba' });
  assert.equal(series.title, 'Verano de prueba');
  assert.equal(removeCollection(d, 'media.series', series.id), true);
});

test('mazos: alta de mazo y tarjeta, edición invalida repaso y borrado desplaza solo los estados posteriores', () => {
  const d = fresh();
  const deckInput = { kind: 'study.deck', title: 'Álgebra básica', topic: 'Matemática', front: '¿Qué es una variable?', back: 'Un símbolo que representa un valor.' };
  assert.equal(validateIntent(d, { ...deckInput, back: '' }).ok, false);
  applyIntent(d, deckInput);
  const deck = d.decks.at(-1);
  applyIntent(d, { kind: 'study.card', deckId: deck.id, front: '¿Qué es un polinomio?', back: 'Una suma de monomios.' });
  applyIntent(d, { kind: 'study.card', deckId: deck.id, front: '¿Qué es un exponente?', back: 'Indica la potencia.' });
  d.study[`${deck.id}:0`] = { reps: 1 };
  d.study[`${deck.id}:1`] = { reps: 2 };
  d.study[`${deck.id}:2`] = { reps: 3 };
  applyIntent(d, { kind: 'study.card', deckId: deck.id, index: '0', front: '¿Qué es una incógnita?', back: 'Una cantidad no conocida.' });
  assert.equal(d.study[`${deck.id}:0`], undefined);
  assert.equal(removeCollection(d, 'study.card', deck.id, '1'), true);
  assert.equal(deck.cards.length, 2);
  assert.equal(d.study[`${deck.id}:1`]?.reps, 3);
  assert.equal(removeCollection(d, 'study.card', deck.id, '0'), true);
  assert.equal(removeCollection(d, 'study.card', deck.id, '0'), false, 'no se puede dejar un mazo vacío');
  assert.equal(removeCollection(d, 'study.deck', deck.id), true);
  assert.equal(Object.keys(d.study).some((key) => key.startsWith(`${deck.id}:`)), false);
});
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

/* ───────── Etapa 4 ───────── */

const finance = await import('./src/domain/finance.js');
const repl = await import('./src/domain/replenishment.js');
const health = await import('./src/domain/health.js');
const study = await import('./src/domain/study.js');
const NOW = new Date('2026-11-17T12:00:00Z');

test('Safe-to-Spend sigue la fórmula del original y el simulador no recomienda', () => {
  const p = initialData.finances.planning;
  const s = finance.safeToSpend(p);
  assert.deepEqual([s.committed, s.raw, s.value, s.status], [758000, 222000, 222000, 'available']);
  const short = finance.safeToSpend({ ...p, liquidity: 700000 });
  assert.deepEqual([short.value, short.shortfall, short.status], [0, 58000, 'shortfall']);
  assert.throws(() => finance.safeToSpend({ ...p, reserve: -1 }), RangeError);
  assert.equal(finance.purchaseScenario(p, 100000).state, 'within-capacity');
  const uses = finance.purchaseScenario(p, 400000);
  assert.deepEqual([uses.state, uses.beyondSafe, uses.protectedConsumed, uses.after.value], ['uses-commitments', 178000, 178000, 0]);
  const beyond = finance.purchaseScenario(p, 1100000);
  assert.deepEqual([beyond.state, beyond.beyondLiquidity, beyond.protectedConsumed], ['beyond-liquidity', 120000, 758000]);
  assert.equal(finance.purchaseScenario(p, 0).valid, false);
});

test('vista económica y resiliencia: transferencias excluidas, volatilidad con 3+ meses', () => {
  const econ = finance.economicSummary(initialData.finances.ledger);
  assert.deepEqual([econ.income, econ.excluded], [1523000, 215000]);
  const r = finance.resilience(initialData.finances.incomeHistory);
  assert.equal(r.months, 6);
  assert.ok(r.earnedShare > 0.98 && r.earnedShare < 0.99);
  assert.ok(r.volatility > 0 && r.volatility < 0.03);
  assert.equal(finance.resilience(initialData.finances.incomeHistory.slice(0, 2)).volatility, null);
});

test('reposición: estados, confianza, atípicos y correcciones del usuario', () => {
  const needs = Object.fromEntries(initialData.household.needs.map((n) => [n.id, n]));
  const est = (id, extra = {}) => repl.estimateCadence({ need: needs[id], purchases: [...needs[id].purchases, ...(extra.purchases ?? [])], corrections: extra.corrections ?? [], now: NOW });
  assert.deepEqual([est('milk').state, est('milk').confidence], ['ADD_TO_LIST', 'HIGH']);
  assert.equal(est('coffee').state, 'OVERDUE');
  assert.deepEqual([est('detergent').state, est('detergent').confidence], ['WATCH', 'MEDIUM']);
  assert.deepEqual([est('oil').state, est('oil').confidence], ['NOT_DUE', 'LOW']);
  assert.equal(est('paper').anomalies, 1, 'el intervalo de 40 días se descarta como atípico');
  assert.equal(est('shampoo').expectedIntervalDays, 45, 'sin historial usa la semilla manual');
  assert.equal(est('yerba', { corrections: [{ type: 'OUT', occurredAt: '2026-11-17T12:00:00.000Z' }] }).state, 'ADD_TO_LIST');
  const still = est('coffee', { corrections: [{ type: 'STILL_HAVE', occurredAt: '2026-11-17T12:00:00.000Z' }] });
  assert.equal(still.state, 'NOT_DUE');
  assert.ok(still.nextExpectedAt > '2026-11-17');
  assert.equal(est('milk', { purchases: [{ purchasedAt: '2026-11-17T12:00:00.000Z' }] }).state, 'NOT_DUE');
  assert.equal(repl.weightedMedian([10, 30, 20]), 20);
});

test('salud: scores explicables, desconocido nunca es cero y cobertura mínima', () => {
  const s = health.healthScores(initialData.health.history);
  const sleep = s.scores.find((x) => x.id === 'sleep');
  const cardio = s.scores.find((x) => x.id === 'cardio');
  assert.equal(sleep.contributors.find((c) => c.id === 'continuity').score, null);
  assert.equal(cardio.contributors.find((c) => c.id === 'hrv').score, null);
  assert.ok(cardio.confidence < sleep.confidence, 'sin HRV la confianza cardio baja');
  assert.equal(s.readiness.score, Math.round(Math.sqrt(sleep.score * cardio.score)));
  assert.deepEqual([s.coverage.sleep, s.coverage.restingHr, s.coverage.hrv], [27, 26, 0]);
  const blind = initialData.health.history.map((d) => ({ ...d, restingHr: null }));
  const r = health.healthScores(blind);
  assert.equal(r.scores.find((x) => x.id === 'cardio').score, null, 'menos del 50 % de cobertura: sin score');
  assert.equal(r.readiness.score, null);
  assert.equal(health.bandFor(85), 'strong');
  assert.equal(health.bandFor(null), 'insufficient');
});

test('cardio: MET-min con objetivo del plan y confianza por evidencia', () => {
  assert.equal(health.cardioTarget(), 2980);
  assert.deepEqual(health.sessionMet({ modality: 'bike', minutes: 30, watts: 120 }).confidence, 'alta');
  assert.deepEqual(health.sessionMet({ modality: 'bike', minutes: 30, rpe: 5 }).confidence, 'media');
  assert.deepEqual(health.sessionMet({ modality: 'bike', minutes: 30 }).confidence, 'baja');
  const steps = initialData.health.history.slice(-7).reduce((t, d) => t + d.steps, 0);
  const w = health.weeklyCardio(initialData.gym.cardio, steps);
  assert.equal(w.total, 2773);
  assert.deepEqual(w.direct.map((d) => d.done), [54140, 75, 1]);
  assert.ok(w.equivalents.bikeMinutes > 0);
});

test('estudio: programador simplificado y respuestas escritas deterministas', () => {
  const fresh = study.schedule(null, 'good');
  assert.deepEqual([fresh.state, fresh.dueIn], ['review', 1]);
  assert.equal(study.schedule(null, 'easy').dueIn, 4);
  const again = study.schedule(fresh, 'again');
  assert.deepEqual([again.state, again.dueIn, again.lapses], ['relearning', 0, 1]);
  const longer = study.schedule(study.schedule(fresh, 'good'), 'good');
  assert.ok(longer.dueIn > 3);
  assert.equal(study.previewIntervals(null).good, 'mañana');
  const card = initialData.decks[1].cards[2];
  assert.equal(study.checkAnswer(card, '  Sought! ').correct, true);
  assert.equal(study.checkAnswer(card, 'seeked').correct, false);
  assert.equal(study.checkAnswer(initialData.decks[0].cards[0], 'x'), null, 'sin respuestas aceptadas no se evalúa');
});

test('el intérprete reconoce cardio y compras del hogar (con gasto si hay importe)', () => {
  const data = fresh();
  const c = { ...ctx(data), needs: data.household.needs.map((n) => ({ id: n.id, name: n.name, category: n.category, aliases: [n.name.toLowerCase(), n.name.split(' ')[0].toLowerCase()] })) };
  const cardio = parseCapture('Hice 45 minutos de bici con esfuerzo 6', c).intents[0];
  assert.deepEqual([cardio.kind, cardio.modality, cardio.minutes, cardio.rpe], ['cardio.session', 'bike', 45, 6]);
  assert.equal(parseCapture('jugué un partido de fútbol de 1,5 horas', c).intents[0].minutes, 90);
  const buy = parseCapture('Compré leche y café por 9.800', c).intents;
  assert.deepEqual(buy.map((i) => i.kind), ['household.purchase', 'household.purchase', 'finance.expense']);
  assert.equal(buy[2].amount, 9800);
  assert.equal(parseCapture('tomé un vaso de leche', c).intents[0].kind, 'food.entry', 'sin «compré» es una comida');
});
