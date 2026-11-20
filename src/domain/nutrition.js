/**
 * Dominio Nutrición (puro). Reglas adaptadas de Vida 2.0 (`docs/nutrition-v2-source.md`):
 * - un valor desconocido nunca se convierte en cero;
 * - con cobertura parcial se suman solo valores conocidos y se rotulan "conocidos/parcial";
 * - el objetivo de energía es un rango: se muestra el rango y la diferencia contra el borde aplicable;
 * - los promedios comparables usan solo días con registro completo.
 */

export const NUTRIENTS = Object.freeze(['kcal', 'protein', 'carbs', 'fat', 'fiber']);

/** Nutrientes de un ítem: comida registrada (valores propios) o alimento del catálogo × gramos. */
export function itemNutrients(item, catalog) {
  if (item.foodId) {
    const food = catalog.find((f) => f.id === item.foodId);
    if (!food) return Object.fromEntries(NUTRIENTS.map((n) => [n, null]));
    const factor = item.grams / 100;
    return Object.fromEntries(NUTRIENTS.map((n) => [n, food.per100[n] == null ? null : food.per100[n] * factor]));
  }
  // Comidas registradas como plato: usan sus propios valores (`calories`, `fats`) y la fibra puede faltar.
  const source = { kcal: item.calories ?? item.kcal, protein: item.protein, carbs: item.carbs, fat: item.fats ?? item.fat, fiber: item.fiber };
  return Object.fromEntries(NUTRIENTS.map((n) => [n, source[n] ?? null]));
}

/** Totales con cobertura por nutriente: { value, known, complete }. */
export function totals(items, catalog) {
  const result = Object.fromEntries(NUTRIENTS.map((n) => [n, { value: 0, known: 0, missing: 0 }]));
  for (const item of items) {
    const values = itemNutrients(item, catalog);
    for (const n of NUTRIENTS) {
      if (values[n] == null) result[n].missing += 1;
      else { result[n].value += values[n]; result[n].known += 1; }
    }
  }
  for (const n of NUTRIENTS) result[n].complete = result[n].missing === 0 && items.length > 0;
  return result;
}

/** Posición de la energía contra un objetivo en rango. Sin porcentaje si la energía es parcial. */
export function energyStatus(total, target) {
  if (!total.complete) return { state: 'partial', diff: null };
  if (total.value < target.kcalLow) return { state: 'below', diff: target.kcalLow - total.value };
  if (total.value > target.kcalHigh) return { state: 'above', diff: total.value - target.kcalHigh };
  return { state: 'within', diff: 0 };
}

export function macroShares(t) {
  if (!t.protein.complete || !t.carbs.complete || !t.fat.complete) return null;
  const energy = t.protein.value * 4 + t.carbs.value * 4 + t.fat.value * 9;
  if (!energy) return null;
  const p = Math.round((t.protein.value * 4 * 100) / energy);
  const c = Math.round((t.carbs.value * 4 * 100) / energy);
  return { protein: p, carbs: c, fat: 100 - p - c };
}

/** Convierte cantidad + porción a gramos usando las porciones declaradas del alimento. */
export function toGrams(food, amount, portionId) {
  const portion = food.portions.find((p) => p.id === portionId) ?? food.portions[0];
  return amount * portion.grams;
}

export function validateFoodEntry(food, amount, portionId) {
  const errors = {};
  if (!food) errors.food = 'Elegí un alimento del catálogo.';
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) errors.amount = 'La cantidad debe ser mayor que 0.';
  else if (food) {
    const grams = toGrams(food, n, portionId);
    if (grams > 2000) errors.amount = 'Una entrada no puede superar 2 kg.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/** Serie diaria para tendencias: solo días con energía completa entran en el promedio. */
export function dailySeries(days, catalog, target) {
  const points = days.map((day) => {
    const t = totals(day.items, catalog);
    return { date: day.date, label: day.label, kcal: t.kcal.value, protein: t.protein.value, complete: t.kcal.complete && day.closed !== false, status: energyStatus(t.kcal, target).state };
  });
  const comparable = points.filter((p) => p.complete);
  const avg = (key) => (comparable.length ? comparable.reduce((s, p) => s + p[key], 0) / comparable.length : null);
  return { points, comparableDays: comparable.length, avgKcal: avg('kcal'), avgProtein: avg('protein'), withinDays: comparable.filter((p) => p.status === 'within').length };
}
