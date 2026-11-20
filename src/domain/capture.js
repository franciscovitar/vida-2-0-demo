/**
 * Intérprete local por reglas para la captura "Contalo como lo dirías".
 *
 * No es un modelo de IA: reconoce un conjunto acotado y documentado de patrones en español y
 * devuelve intenciones estructuradas + los fragmentos que no pudo interpretar. Nunca completa
 * datos que no aparecen en el texto. En Vida 2.0 real, esta etapa la cumple un proyecto de ChatGPT
 * con Skills del Personal AI System (ver docs/SHOWCASE_ROADMAP.md).
 */

const WORD_NUMBERS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, medio: 0.5, media: 0.5 };
const NUM = '(\\d+(?:[.,]\\d+)?|una|uno|un|dos|tres|cuatro|cinco|seis|media|medio)(?![a-zñ\\d])';
const UNIT_ALIASES = [
  [/^(g|gr|grs|gramos?)$/, 'g'], [/^ml$/, 'g'], [/^tazas?$/, 'taza'], [/^cucharadas?$/, 'cucharada'],
  [/^rebanadas?$/, 'rebanada'], [/^vasos?$/, 'vaso'], [/^latas?$/, 'lata'], [/^potes?$/, 'pote'],
  [/^unidad(es)?$/, 'unidad'], [/^puñados?$/, 'puñado'], [/^porci(o|ó)n(es)?$/, 'porción'],
];
const MOMENTS = [['desayuno', 'Desayuno'], ['almuerzo', 'Almuerzo'], ['merienda', 'Merienda'], ['cena', 'Cena'], ['colacion', 'Colación'], ['colación', 'Colación']];
const EXPENSE_CATEGORIES = [
  ['food', ['super', 'supermercado', 'verduleria', 'verdulería', 'almacen', 'almacén', 'comida', 'carniceria', 'carnicería']],
  ['transport', ['colectivo', 'uber', 'taxi', 'nafta', 'combustible', 'subte', 'transporte']],
  ['leisure', ['cine', 'salida', 'bar', 'restaurante', 'recital', 'streaming']],
  ['home', ['alquiler', 'luz', 'gas', 'agua', 'internet', 'expensas', 'hogar']],
];

export const strip = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const toNumber = (raw) => (raw in WORD_NUMBERS ? WORD_NUMBERS[raw] : Number(String(raw).replace(',', '.')));
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const unitFor = (word) => UNIT_ALIASES.find(([pattern]) => pattern.test(word))?.[1] ?? null;
const portionFor = (food, unit) => (unit ? food.portions.find((p) => p.label === unit || (unit === 'g' && p.id === 'g')) ?? null : null);

function momentFor(text, clock) {
  const s = strip(text);
  const found = MOMENTS.find(([word]) => s.includes(strip(word)));
  if (found) return { value: found[1], inferred: false };
  const hour = Number(clock.split(':')[0]);
  return { value: hour < 11 ? 'Desayuno' : hour < 16 ? 'Almuerzo' : hour < 19 ? 'Merienda' : 'Cena', inferred: true };
}

function parseGymClause(clause, exercises) {
  const s = strip(clause);
  const hits = [];
  for (const exercise of exercises) {
    for (const alias of [...exercise.aliases].sort((a, b) => b.length - a.length)) {
      const m = new RegExp(`\\b${escape(strip(alias))}\\b`).exec(s);
      if (m && !hits.some((h) => m.index >= h.index && m.index < h.end)) { hits.push({ exercise, index: m.index, end: m.index + m[0].length }); break; }
    }
  }
  hits.sort((a, b) => a.index - b.index);
  return hits.map((hit, i) => {
    const segment = s.slice(hit.end, hits[i + 1]?.index ?? s.length);
    const intent = { kind: 'gym.set', exerciseId: hit.exercise.id, exerciseName: hit.exercise.name, sets: 1, kg: null, reps: null, seconds: null, source: s.slice(hit.index, hits[i + 1]?.index ?? s.length).replace(/[\s,]+(?:y|e)?\s*$/, '').trim() };
    const seriesOf = new RegExp(`${NUM}\\s*series?\\s*de\\s*${NUM}`).exec(segment);
    const crossed = /(\d+)\s*x\s*(\d+)(?!\s*(?:kg|kilos?))/.exec(segment);
    const kgFirst = /(\d+(?:[.,]\d+)?)\s*(?:kg|kilos?)\s*(?:x|por)\s*(\d+)/.exec(segment);
    const kg = /(\d+(?:[.,]\d+)?)\s*(?:kg|kilos?)/.exec(segment);
    if (hit.exercise.mode === 'time') {
      const secs = /(\d+)\s*(?:s|seg|segundos)\b/.exec(segment);
      const minutes = /(\d+)\s*(?:min|minutos?)\b/.exec(segment);
      if (seriesOf) intent.sets = toNumber(seriesOf[1]);
      intent.seconds = secs ? Number(secs[1]) : minutes ? Number(minutes[1]) * 60 : null;
    } else if (kgFirst) {
      intent.kg = toNumber(kgFirst[1]); intent.reps = Number(kgFirst[2]);
      const series = new RegExp(`${NUM}\\s*series?`).exec(segment);
      if (series) intent.sets = toNumber(series[1]);
    } else {
      if (seriesOf) { intent.sets = toNumber(seriesOf[1]); intent.reps = toNumber(seriesOf[2]); }
      else if (crossed) { intent.sets = Number(crossed[1]); intent.reps = Number(crossed[2]); }
      if (kg) intent.kg = toNumber(kg[1]);
    }
    intent.missing = hit.exercise.mode === 'time' ? (intent.seconds == null ? ['segundos'] : []) : ['kg', 'reps'].filter((k) => intent[k] == null);
    return intent;
  });
}

function parseFoodClause(clause, catalog, clock) {
  const s = strip(clause);
  const aliases = catalog.flatMap((food) => food.aliases.map((alias) => ({ food, alias: strip(alias) }))).sort((a, b) => b.alias.length - a.alias.length);
  const intents = [];
  const taken = [];
  for (const { food, alias } of aliases) {
    const re = new RegExp(`(?:${NUM}\\s*(?:([a-zñ]+)\\s+)?(?:de\\s+)?)?\\b${escape(alias)}\\b`, 'g');
    let m;
    while ((m = re.exec(s))) {
      const start = m.index;
      const aliasStart = m.index + m[0].length - alias.length;
      if (taken.some(([a, b]) => aliasStart < b && aliasStart + alias.length > a)) continue;
      taken.push([aliasStart, aliasStart + alias.length]);
      let amount = m[1] ? toNumber(m[1]) : null;
      let portionId = food.portions[0].id;
      let end = aliasStart + alias.length;
      if (m[2]) {
        const portion = portionFor(food, unitFor(m[2]));
        if (portion) portionId = portion.id; else amount = null;
      }
      if (amount == null) {
        // Cantidad escrita después del alimento: "avena 3 cucharadas".
        const after = new RegExp(`^\\s*${NUM}\\s*([a-zñ]+)?`).exec(s.slice(end));
        const portion = after ? portionFor(food, unitFor(after[2] ?? '')) : null;
        if (after && (portion || !after[2])) {
          amount = toNumber(after[1]);
          if (portion) portionId = portion.id;
          end += after[0].length;
          taken.push([aliasStart, end]);
        }
      }
      intents.push({ kind: 'food.entry', foodId: food.id, foodName: food.name, amount, portionId, moment: momentFor(clause, clock), source: s.slice(start, end).trim(), missing: amount == null ? ['cantidad'] : [] });
    }
  }
  // Cantidades seguidas de una palabra que no es un alimento conocido: se informan, no se adivinan.
  const unknown = [];
  const re = new RegExp(`${NUM}\\s+(?:de\\s+)?([a-zñ]{3,})`, 'g');
  let u;
  while ((u = re.exec(s))) {
    if (unitFor(u[2]) || taken.some(([a, b]) => u.index + u[0].length > a && u.index < b)) continue;
    unknown.push(`${u[0].trim()} (no está en el catálogo de la demo)`);
  }
  return { intents: intents.sort((a, b) => s.indexOf(a.source) - s.indexOf(b.source)), unknown };
}

function parseExpense(clause) {
  const s = strip(clause);
  if (!/\b(gaste|pague|compre|gasto)\b/.test(s)) return null;
  const amount = /\$?\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?\s*(?:pesos|ars)?/.exec(s);
  const category = EXPENSE_CATEGORIES.find(([, words]) => words.some((w) => new RegExp(`\\b${escape(strip(w))}\\b`).test(s)))?.[0] ?? 'other';
  const what = /\ben\s+(?:el\s+|la\s+)?([a-z\s]+?)(?:$|\s+(?:por|con|y)\b)/.exec(s)?.[1]?.trim();
  const description = what ? what.charAt(0).toUpperCase() + what.slice(1) : 'Gasto registrado';
  return { kind: 'finance.expense', amount: amount ? Number(amount[1].replace(/\./g, '')) : null, categoryId: category, categoryInferred: category === 'other', description, source: clause.trim(), missing: amount ? [] : ['importe'] };
}

function parseTask(clause) {
  const m = /^(?:\s*)(?:tengo que|recordame|recordar|anota|anotá|agrega(?:r)? (?:la )?tarea|tarea:?)\s+(.+)$/i.exec(clause.trim());
  if (!m) return null;
  const title = m[1].replace(/[.!]+$/, '').trim();
  return { kind: 'task.create', title: title.charAt(0).toUpperCase() + title.slice(1), source: clause.trim(), missing: title ? [] : ['título'] };
}

/**
 * @param {string} text
 * @param {{ exercises: {id:string,name:string,mode:string,aliases:string[]}[], catalog: any[], clock: string }} ctx
 */
export function parseCapture(text, ctx) {
  const clean = String(text ?? '').slice(0, 600);
  const clauses = clean.split(/(?<!\d)[.;\n]+|[.;\n]+(?!\d)|\s+y\s+(?:despues|después|luego)\s+|\s+y\s+(?=(?:hice|comi|comí|gaste|gasté|pague|pagué|tengo que|recordame))/i).map((c) => c.trim()).filter(Boolean);
  const intents = [];
  const unparsed = [];
  for (const clause of clauses) {
    const task = parseTask(clause);
    if (task) { intents.push(task); continue; }
    const expense = parseExpense(clause);
    if (expense) { intents.push(expense); continue; }
    const gym = parseGymClause(clause.replace(/,/g, ' '), ctx.exercises);
    if (gym.length) { intents.push(...gym); continue; }
    const foods = parseFoodClause(clause.replace(/,/g, ' '), ctx.catalog, ctx.clock);
    if (foods.intents.length) { intents.push(...foods.intents); unparsed.push(...foods.unknown); continue; }
    unparsed.push(clause);
  }
  return { intents: intents.map((intent, i) => ({ ...intent, key: `i${i}` })), unparsed };
}

export const CAPTURE_EXAMPLES = Object.freeze([
  'Hice press de pecho, 3 series de 10 con 35 kilos y remo 3x12 con 30 kg',
  'En el almuerzo comí 150 g de arroz, una porción de pollo y una manzana',
  'Gasté 12.500 en el supermercado',
  'Tengo que preparar la retrospectiva del sprint',
]);
