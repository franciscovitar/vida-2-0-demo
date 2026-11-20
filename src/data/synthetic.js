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

/* ───────────── Generador determinista (LCG) para series con ruido reproducible ───────────── */

function lcg(seed) {
  let state = seed >>> 0;
  return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 2 ** 32; };
}
const isoDay = (offset, base = '2026-11-17') => new Date(Date.parse(`${base}T12:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);

/* ───────────── Salud: 28 días; los últimos 7 coinciden con las tendencias de data.js ───────────── */

const LAST7 = {
  sleep: [6.8, 7.1, 7.3, 6.9, 7.8, 7.5, 7.6],
  steps: [6800, 7900, 7200, 9300, 8300, 6400, 8240],
  active: [24, 38, 46, 31, 52, 20, 42],
  rhr: [66, 65, 65, 64, 65, 64, 64],
};

export const HEALTH_HISTORY = Object.freeze(Array.from({ length: 28 }, (_, i) => {
  const rand = lcg(4242 + i * 97);
  const date = isoDay(i - 27);
  const recent = i >= 21 ? i - 21 : null;
  const sleep = recent != null ? LAST7.sleep[recent] : Math.round((6.4 + rand() * 1.3) * 10) / 10;
  const bedMin = Math.round(23 * 60 + 25 + rand() * 55); // 23:25–00:20
  const day = {
    date,
    sleepHours: sleep,
    bedtimeMin: bedMin,
    wakeMin: Math.round((bedMin + sleep * 60) % 1440),
    steps: recent != null ? LAST7.steps[recent] : Math.round(5600 + rand() * 4200),
    activeMinutes: recent != null ? LAST7.active[recent] : Math.round(18 + rand() * 38),
    restingHr: recent != null ? LAST7.rhr[recent] : Math.round(64 + rand() * 4),
    hrv: null, // la demo no modela HRV: el score lo trata como desconocido, no como cero
  };
  // Huecos reales de cobertura: sin pulsera una noche y sin FC en dos días.
  if (i === 4) { day.sleepHours = null; day.bedtimeMin = null; day.wakeMin = null; }
  if (i === 9 || i === 15) day.restingHr = null;
  return day;
}));

/* ───────────── Cardio de la semana (para MET-min) ───────────── */

export const CARDIO_WEEK = Object.freeze([
  { id: 'c1', date: '2026-11-12', modality: 'bike', minutes: 40, rpe: 5, watts: null },
  { id: 'c2', date: '2026-11-14', modality: 'football', minutes: 60, rpe: null, watts: null },
  { id: 'c3', date: '2026-11-16', modality: 'bike', minutes: 35, rpe: null, watts: 120 },
]);

/* ───────────── Hogar: compras pasadas por producto (reposición) ───────────── */

const purchases = (dates) => dates.map((d) => ({ purchasedAt: `${d}T18:00:00.000Z` }));
export const HOUSEHOLD_NEEDS = Object.freeze([
  { id: 'milk', name: 'Leche', category: 'Lácteos', amount: '2 l', purchases: purchases(['2026-10-19', '2026-10-24', '2026-10-29', '2026-11-03', '2026-11-08', '2026-11-13']) },
  { id: 'coffee', name: 'Café molido', category: 'Almacén', amount: '500 g', purchases: purchases(['2026-08-22', '2026-09-12', '2026-10-03', '2026-10-24']) },
  { id: 'yerba', name: 'Yerba', category: 'Almacén', amount: '1 kg', purchases: purchases(['2026-10-01', '2026-10-11', '2026-10-22', '2026-10-31', '2026-11-10']) },
  { id: 'paper', name: 'Papel higiénico', category: 'Limpieza', amount: '12 rollos', purchases: purchases(['2026-08-30', '2026-09-11', '2026-09-24', '2026-11-03', '2026-11-15']) },
  { id: 'detergent', name: 'Detergente', category: 'Limpieza', amount: '750 ml', purchases: purchases(['2026-07-25', '2026-08-14', '2026-09-21', '2026-10-18']) },
  { id: 'oil', name: 'Aceite de oliva', category: 'Almacén', amount: '1 l', purchases: purchases(['2026-09-05', '2026-10-17']) },
  { id: 'shampoo', name: 'Shampoo', category: 'Higiene', amount: '1 unidad', manualSeedIntervalDays: 45, purchases: purchases(['2026-10-20']) },
]);

/* ───────────── Series ───────────── */

export const SERIES = Object.freeze([
  { id: 'faro', title: 'Faro norte', genre: 'Drama', year: 2025, color: 'blue', seasons: [{ n: 1, episodes: 8, watched: 8, rating: 4 }, { n: 2, episodes: 8, watched: 5, rating: null }], status: 'watching', minutesPerEpisode: 48 },
  { id: 'orbita', title: 'Órbita baja', genre: 'Ciencia ficción', year: 2024, color: 'violet', seasons: [{ n: 1, episodes: 10, watched: 10, rating: 5 }], status: 'completed', minutesPerEpisode: 42 },
  { id: 'cocina', title: 'Cocina de barrio', genre: 'Documental', year: 2026, color: 'amber', seasons: [{ n: 1, episodes: 6, watched: 0, rating: null }], status: 'planned', minutesPerEpisode: 30 },
]);

/* ───────────── Centro de información: piezas explicativas de ejemplo (no son noticias) ───────────── */

export const INFO_PIECES = Object.freeze([
  { id: 'p-evidence', front: 'ia', kind: 'Explicación', minutes: 4, title: 'Por qué un modelo debería explicar evidencia estructurada y no leer datos crudos', summary: 'Separar el cálculo determinista de la redacción hace que las conclusiones sean verificables: el modelo describe lo que ya está medido y no improvisa números.', points: ['El cálculo vive en código versionado y testeado.', 'El modelo recibe métricas con su cobertura y confianza.', 'Si falta evidencia, la explicación lo dice en lugar de completar.'], sources: ['Documentación propia del sistema', 'Guías públicas de diseño de agentes'] },
  { id: 'p-rules', front: 'ia', kind: 'Guía', minutes: 3, title: 'Reglas deterministas o modelo de lenguaje: cuándo conviene cada uno', summary: 'Un intérprete por reglas es predecible y barato para patrones acotados; un modelo aporta flexibilidad para lenguaje abierto. Combinarlos con una vista previa evita errores silenciosos.', points: ['Reglas: formatos conocidos y validación estricta.', 'Modelo: frases libres, varias intenciones, aclaraciones.', 'En ambos casos: confirmar antes de escribir.'], sources: ['Documentación propia del sistema'] },
  { id: 'p-job', front: 'carrera', kind: 'Análisis', minutes: 5, title: 'Cómo leer una búsqueda full-stack más allá de la lista de tecnologías', summary: 'Las señales de seniority suelen estar en el alcance: ownership de producto, calidad, operación y comunicación, no solo en el stack mencionado.', points: ['Buscar verbos de responsabilidad, no solo herramientas.', 'Valorar experiencia con pruebas, despliegue y observabilidad.', 'Un proyecto propio en producción es evidencia concreta.'], sources: ['Material de orientación profesional de ejemplo'] },
  { id: 'p-idempotency', front: 'tecnologia', kind: 'Explicación', minutes: 4, title: 'Idempotencia con un ejemplo: reintentar sin duplicar', summary: 'Una operación idempotente puede repetirse sin cambiar el resultado. Con una clave de operación estable, un reintento por timeout no crea un segundo registro.', points: ['Misma clave + mismo contenido: no-op.', 'Misma clave + contenido distinto: error explícito.', 'La clave se guarda junto al resultado, no en memoria.'], sources: ['Especificaciones HTTP públicas', 'ADR propios de escrituras seguras'] },
  { id: 'p-csp', front: 'tecnologia', kind: 'Guía', minutes: 3, title: 'CSP estricta: qué bloquea y por qué esta demo no usa estilos en línea', summary: 'Una política de seguridad de contenido limita de dónde se cargan scripts, estilos y conexiones. Con `style-src \'self\'`, los valores dinámicos se aplican por CSSOM en lugar de atributos style.', points: ['`connect-src \'none\'`: la página no puede hablar con la red.', 'Fuentes autoalojadas: sin dependencias externas.', 'Menos superficie para inyección de contenido.'], sources: ['Documentación pública de navegadores'] },
  { id: 'p-sources', front: 'sistema', kind: 'Explicación', minutes: 3, title: 'Cómo decide Vida cuál es la fuente de verdad de cada dato', summary: 'Cada dominio tiene una autoridad canónica: Notion para tareas, Sheets para métricas, Calendar para la agenda. La web compone vistas derivadas y no copia los datos.', points: ['La conversación interpreta, no guarda.', 'Se prefiere escribir directo en la fuente.', 'Si una fuente falla, la vista lo muestra en vez de inventar.'], sources: ['ADR 0006 · captura conversacional'] },
]);

export const TECH_RADAR = Object.freeze([
  { id: 'ts', name: 'TypeScript estricto', status: 'ADOPTION', reason: 'Base del sistema original; contratos tipados entre fuentes y vistas.' },
  { id: 'rsc', name: 'React Server Components', status: 'ADOPTION', reason: 'Las fuentes privadas se leen en servidor y nunca llegan al cliente.' },
  { id: 'evals', name: 'Evaluaciones automáticas de prompts', status: 'ASSESS_NOW', reason: 'Medir regresiones de interpretación antes de cambiar instrucciones.' },
  { id: 'local-first', name: 'Sincronización local-first', status: 'WATCH', reason: 'Útil para estudio offline; el motor ya guarda intentos en IndexedDB.' },
  { id: 'micro', name: 'Microfrontends', status: 'HOLD', reason: 'Complejidad sin beneficio para un producto de un solo equipo.' },
]);

export const AUTOMATIONS = Object.freeze([
  { id: 'daily-briefing', label: 'Resumen diario', description: 'Compone el plan del día con agenda, tareas y contexto de salud.', enabled: true, schedule: 'Todos los días 07:30', runs: [{ id: 'r1', at: '2026-11-17T07:30', state: 'succeeded', detail: '4 eventos · 3 tareas de foco' }, { id: 'r2', at: '2026-11-16T07:30', state: 'succeeded', detail: '3 eventos · 2 tareas de foco' }] },
  { id: 'weekly-review', label: 'Revisión semanal', description: 'Arma la revisión de la semana: avances, pendientes y señales.', enabled: true, schedule: 'Domingos 19:00', runs: [{ id: 'r3', at: '2026-11-15T19:00', state: 'succeeded', detail: 'Revisión lista para aprobar' }] },
  { id: 'approval-digest', label: 'Resumen de aprobaciones', description: 'Junta las propuestas pendientes que requieren decisión humana.', enabled: true, schedule: 'Días hábiles 18:00', runs: [{ id: 'r4', at: '2026-11-16T18:00', state: 'skipped', detail: 'Sin propuestas pendientes' }] },
  { id: 'planning-suggestion', label: 'Sugerencia de planificación', description: 'Propone bloques de tiempo; nunca crea eventos sin aprobación.', enabled: false, schedule: 'Manual', runs: [] },
  { id: 'technical-watchdog', label: 'Vigilancia técnica', description: 'Verifica que las integraciones respondan y alerta si algo falla.', enabled: true, schedule: 'Cada 6 horas', runs: [{ id: 'r5', at: '2026-11-17T06:00', state: 'failed', detail: 'Tiempo de espera agotado en una fuente; reintento programado' }, { id: 'r6', at: '2026-11-17T00:00', state: 'succeeded', detail: 'Todas las fuentes responden' }] },
]);

const HISTORY_DATES = ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'];
const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const NUTRITION_HISTORY = Object.freeze(HISTORY_DATES.map((date, i) => ({
  date,
  label: `${DOW[new Date(`${date}T12:00:00Z`).getUTCDay()]} ${Number(date.slice(8))}`,
  items: TEMPLATES[i % TEMPLATES.length].map(([foodId, grams], n) => ({ id: `n${i}-${n}`, foodId, grams })),
})));
