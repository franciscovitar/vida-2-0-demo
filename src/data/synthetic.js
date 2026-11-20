/**
 * Historia sintética determinista para la demo. Ningún valor proviene de registros reales.
 * Los valores nutricionales son aproximaciones de referencia por 100 g, redondeadas, solo para demostrar
 * cálculos; no son una base de composición de alimentos.
 */

/* ───────────── Gimnasio: 12 sesiones previas (cada 3–4 días hasta el lunes 16/11) ───────────── */

const SESSION_DATES = ['2026-10-09', '2026-10-12', '2026-10-16', '2026-10-19', '2026-10-23', '2026-10-26', '2026-10-30', '2026-11-02', '2026-11-06', '2026-11-09', '2026-11-13', '2026-11-16'];

const PROGRESSION = {
  press: { kg: [30, 30, 30, 32.5, 32.5, 32.5, 32.5, 35, 35, 35, 35, 35], reps: [10, 10, 12, 8, 10, 10, 10, 8, 8, 9, 9, 9] },
  row: { kg: [25, 25, 27.5, 27.5, 27.5, 27.5, 30, 30, 30, 30, 30, 30], reps: [12, 12, 10, 10, 12, 12, 10, 10, 11, 11, 12, 12] },
  squat: { kg: [12, 12, 12, 14, 14, 14, 14, 16, 16, 16, 16, 16], reps: [10, 12, 12, 10, 10, 12, 12, 8, 8, 10, 10, 10] },
  plank: { seconds: [20, 20, 25, 25, 25, 30, 30, 30, 30, 30, 35, 35] },
};

export const GYM_HISTORY = Object.freeze(SESSION_DATES.map((date, i) => {
  const sets = [];
  for (const [exerciseId, p] of Object.entries(PROGRESSION)) {
    for (let n = 1; n <= 3; n += 1) {
      const id = `h${i}-${exerciseId}-${n}`;
      if (p.seconds) sets.push({ id, exerciseId, seconds: p.seconds[i] });
      else sets.push({ id, exerciseId, kg: p.kg[i], reps: n === 3 ? Math.max(1, p.reps[i] - 1) : p.reps[i] });
    }
  }
  return { id: `s${i}`, date, sets };
}));

/** Alias reconocidos por el intérprete local y metadatos de registro. */
export const EXERCISE_META = Object.freeze({
  press: { mode: 'load', aliases: ['press de pecho', 'press banca', 'press en banco', 'pecho'] },
  row: { mode: 'load', aliases: ['remo sentado', 'remo en máquina', 'remo maquina', 'remo'] },
  squat: { mode: 'load', aliases: ['sentadilla goblet', 'sentadillas', 'sentadilla', 'goblet'] },
  plank: { mode: 'time', aliases: ['plancha', 'planchas'] },
});

/* ───────────── Nutrición: catálogo ficticio por 100 g ───────────── */

const food = (id, name, per100, portions, aliases = []) => ({ id, name, per100, portions, aliases });

export const FOOD_CATALOG = Object.freeze([
  food('egg', 'Huevo', { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, fiber: 0 }, [{ id: 'unit', label: 'unidad', grams: 50 }, { id: 'g', label: 'g', grams: 1 }], ['huevo', 'huevos']),
  food('rice', 'Arroz blanco cocido', { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 }, [{ id: 'cup', label: 'taza', grams: 160 }, { id: 'g', label: 'g', grams: 1 }], ['arroz']),
  food('chicken', 'Pechuga de pollo cocida', { kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 }, [{ id: 'portion', label: 'porción', grams: 150 }, { id: 'g', label: 'g', grams: 1 }], ['pollo', 'pechuga']),
  food('oats', 'Avena', { kcal: 389, protein: 16.9, carbs: 66, fat: 6.9, fiber: 10.6 }, [{ id: 'tbsp', label: 'cucharada', grams: 10 }, { id: 'cup', label: 'taza', grams: 80 }, { id: 'g', label: 'g', grams: 1 }], ['avena']),
  food('banana', 'Banana', { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 }, [{ id: 'unit', label: 'unidad', grams: 120 }, { id: 'g', label: 'g', grams: 1 }], ['banana', 'bananas']),
  food('apple', 'Manzana', { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 }, [{ id: 'unit', label: 'unidad', grams: 180 }, { id: 'g', label: 'g', grams: 1 }], ['manzana', 'manzanas']),
  food('yogurt', 'Yogur natural', { kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0 }, [{ id: 'cup', label: 'pote', grams: 190 }, { id: 'g', label: 'g', grams: 1 }], ['yogur', 'yogurt']),
  food('bread', 'Pan integral', { kcal: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7 }, [{ id: 'slice', label: 'rebanada', grams: 30 }, { id: 'g', label: 'g', grams: 1 }], ['pan', 'tostada', 'tostadas']),
  food('lentils', 'Lentejas cocidas', { kcal: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 }, [{ id: 'cup', label: 'taza', grams: 200 }, { id: 'g', label: 'g', grams: 1 }], ['lentejas']),
  food('milk', 'Leche', { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 }, [{ id: 'glass', label: 'vaso', grams: 250 }, { id: 'g', label: 'ml', grams: 1 }], ['leche']),
  food('almonds', 'Almendras', { kcal: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 }, [{ id: 'handful', label: 'puñado', grams: 30 }, { id: 'g', label: 'g', grams: 1 }], ['almendras', 'frutos secos']),
  food('broccoli', 'Brócoli', { kcal: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 }, [{ id: 'cup', label: 'taza', grams: 90 }, { id: 'g', label: 'g', grams: 1 }], ['brocoli', 'brócoli']),
  food('potato', 'Papa hervida', { kcal: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8 }, [{ id: 'unit', label: 'unidad', grams: 170 }, { id: 'g', label: 'g', grams: 1 }], ['papa', 'papas']),
  food('tuna', 'Atún al natural', { kcal: 116, protein: 26, carbs: 0, fat: 1, fiber: 0 }, [{ id: 'can', label: 'lata', grams: 120 }, { id: 'g', label: 'g', grams: 1 }], ['atun', 'atún']),
  food('oil', 'Aceite de oliva', { kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 }, [{ id: 'tbsp', label: 'cucharada', grams: 13 }, { id: 'g', label: 'g', grams: 1 }], ['aceite']),
  food('empanada', 'Empanada de carne (casera)', { kcal: 290, protein: 10, carbs: 25, fat: 16, fiber: null }, [{ id: 'unit', label: 'unidad', grams: 110 }, { id: 'g', label: 'g', grams: 1 }], ['empanada', 'empanadas']),
]);

const TEMPLATES = [
  [['oats', 80], ['milk', 250], ['banana', 120], ['chicken', 150], ['rice', 320], ['broccoli', 90], ['oil', 13], ['yogurt', 190], ['almonds', 30], ['egg', 100], ['bread', 60]],
  [['bread', 90], ['egg', 100], ['milk', 250], ['lentils', 400], ['rice', 160], ['oil', 13], ['apple', 180], ['tuna', 120], ['potato', 170], ['yogurt', 190], ['almonds', 30]],
  [['oats', 80], ['banana', 120], ['milk', 250], ['empanada', 220], ['apple', 180], ['chicken', 150], ['potato', 340], ['oil', 13]],
  [['oats', 80], ['milk', 250], ['banana', 120], ['chicken', 150], ['rice', 320], ['broccoli', 90], ['oil', 13], ['yogurt', 190], ['almonds', 30], ['egg', 100], ['bread', 60], ['empanada', 110]],
];

const HISTORY_DATES = ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'];
const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const NUTRITION_HISTORY = Object.freeze(HISTORY_DATES.map((date, i) => ({
  date,
  label: `${DOW[new Date(`${date}T12:00:00Z`).getUTCDay()]} ${Number(date.slice(8))}`,
  items: TEMPLATES[i % TEMPLATES.length].map(([foodId, grams], n) => ({ id: `n${i}-${n}`, foodId, grams })),
})));
