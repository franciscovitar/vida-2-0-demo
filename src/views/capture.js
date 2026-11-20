/** Contenido del diálogo «Registrar»: captura conversacional (parser local) y formularios. Plantillas puras. */
import { CAPTURE_EXAMPLES } from '../domain/capture.js';
import { esc, fieldError, icon } from './ui.js';

const MOMENTS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Colación'];
const KIND_LABEL = { 'gym.set': 'Gimnasio · serie', 'food.entry': 'Nutrición · alimento', 'finance.expense': 'Finanzas · gasto', 'task.create': 'Organizar · tarea', 'cardio.session': 'Gimnasio · cardio', 'household.purchase': 'Compras · reposición' };
const KIND_AREA = { 'gym.set': 'care', 'food.entry': 'care', 'finance.expense': 'life', 'task.create': 'org', 'cardio.session': 'care', 'household.purchase': 'life' };

const input = (name, label, value, attrs = '', err = '') => `<label class="field"><span>${label}</span><input name="${name}" value="${esc(value ?? '')}" ${attrs}/>${err}</label>`;
const select = (name, label, options, value) => `<label class="field"><span>${label}</span><select name="${name}">${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;

function intentFields(intent, data, errors) {
  const k = intent.key;
  const e = errors[k] ?? {};
  switch (intent.kind) {
    case 'gym.set': {
      const exercises = data.gym.exercises.map((x) => [x.id, x.name]);
      const time = data.gym.exerciseMeta[intent.exerciseId]?.mode === 'time';
      return `${select(`${k}.exerciseId`, 'Ejercicio', exercises, intent.exerciseId)}
        ${input(`${k}.sets`, 'Series', intent.sets, 'type="number" inputmode="numeric" min="1" max="10"', fieldError(e, 'sets'))}
        ${time ? input(`${k}.seconds`, 'Segundos', intent.seconds, 'type="number" inputmode="numeric" min="5" max="600"', fieldError(e, 'seconds'))
    : `${input(`${k}.kg`, 'Kg', intent.kg, 'type="number" inputmode="decimal" step="0.25" min="0" max="400"', fieldError(e, 'kg'))}${input(`${k}.reps`, 'Reps', intent.reps, 'type="number" inputmode="numeric" min="1" max="100"', fieldError(e, 'reps'))}`}`;
    }
    case 'food.entry': {
      const food = data.nutrition.catalog.find((f) => f.id === intent.foodId);
      return `${select(`${k}.foodId`, 'Alimento', data.nutrition.catalog.map((f) => [f.id, f.name]), intent.foodId)}
        ${input(`${k}.amount`, 'Cantidad', intent.amount, 'type="number" inputmode="decimal" min="0.25" step="0.25"', fieldError(e, 'amount'))}
        ${select(`${k}.portionId`, 'Porción', food.portions.map((p) => [p.id, p.id === 'g' ? p.label : `${p.label} (${p.grams} g)`]), intent.portionId)}
        ${select(`${k}.moment`, 'Momento', MOMENTS.map((m) => [m, m]), intent.moment?.value ?? intent.moment)}`;
    }
    case 'finance.expense':
      return `${input(`${k}.amount`, 'Importe (ARS)', intent.amount, 'type="number" inputmode="numeric" min="1" step="1"', fieldError(e, 'amount'))}
        ${select(`${k}.categoryId`, 'Categoría', data.finances.categories.map((c) => [c.id, c.name]), intent.categoryId)}
        ${input(`${k}.description`, 'Descripción', intent.description, 'maxlength="60"', fieldError(e, 'description'))}`;
    case 'task.create':
      return input(`${k}.title`, 'Tarea', intent.title, 'maxlength="120" class="wide"', fieldError(e, 'title'));
    case 'cardio.session':
      return `${select(`${k}.modality`, 'Modalidad', [['bike', 'Bici'], ['football', 'Fútbol']], intent.modality)}
        ${input(`${k}.minutes`, 'Minutos', intent.minutes, 'type="number" inputmode="numeric" min="5" max="300"', fieldError(e, 'minutes'))}
        ${input(`${k}.rpe`, 'Esfuerzo 1–10', intent.rpe, 'type="number" inputmode="numeric" min="1" max="10"', fieldError(e, 'rpe'))}
        ${input(`${k}.watts`, 'Potencia (W)', intent.watts, 'type="number" inputmode="numeric" min="20" max="600"', fieldError(e, 'watts'))}`;
    case 'household.purchase':
      return `${select(`${k}.needId`, 'Producto', data.household.needs.map((n) => [n.id, n.name]), intent.needId)}<p class="muted small">Se suma al historial de compras: la reposición recalcula cuándo volver a comprarlo.</p>`;
    default:
      return '';
  }
}

function preview(capture, data) {
  const { result } = capture;
  if (!result) return '';
  const count = result.intents.length;
  return `<form class="capture-preview" data-capture-form="confirm" novalidate aria-labelledby="preview-title">
    <h3 id="preview-title" tabindex="-1">${count ? `Interpreté ${count} ${count === 1 ? 'registro' : 'registros'}` : 'No reconocí ningún registro'}</h3>
    ${count ? '<p class="muted small">Revisá y corregí antes de confirmar. Nada se guarda hasta que confirmes.</p>' : ''}
    <ul class="intent-list">${result.intents.map((intent) => `<li class="intent a-${KIND_AREA[intent.kind]}">
      <div class="intent-head"><span class="eyebrow">${KIND_LABEL[intent.kind]}</span><button type="button" class="icon-btn" data-capture-drop="${intent.key}" aria-label="Descartar este registro">${icon('close', 15)}</button></div>
      <p class="intent-source">«${esc(intent.source)}»</p>
      ${intent.missing?.length ? `<p class="intent-missing">${icon('info', 14)} Falta: ${intent.missing.join(', ')}. Completalo para confirmar.</p>` : ''}
      ${intent.moment?.inferred ? '<p class="muted small">Momento inferido por la hora de la demo (10:12); podés cambiarlo.</p>' : ''}
      ${intent.categoryInferred ? '<p class="muted small">No reconocí la categoría: quedó en «Otros».</p>' : ''}
      <div class="form-grid">${intentFields(intent, data, capture.errors)}</div>
    </li>`).join('')}</ul>
    ${result.unparsed.length ? `<div class="unparsed"><p><strong>No interpretado</strong> · no lo voy a adivinar:</p><ul>${result.unparsed.map((u) => `<li>«${esc(u)}»</li>`).join('')}</ul></div>` : ''}
    ${count ? `<button type="submit" class="btn btn-dark btn-block">${icon('check', 16)} Confirmar ${count === 1 ? 'registro' : `${count} registros`}</button>` : ''}
  </form>`;
}

function quickForm(capture, data) {
  const type = capture.formType;
  const e = capture.errors.quick ?? {};
  const v = capture.values ?? {};
  const body = {
    set: () => `${select('exerciseId', 'Ejercicio', data.gym.exercises.map((x) => [x.id, x.name]), v.exerciseId ?? 'press')}
      ${input('kg', 'Kg', v.kg ?? 35, 'type="number" inputmode="decimal" step="0.25" min="0" max="400"', fieldError(e, 'kg'))}
      ${input('reps', 'Reps (o segundos en plancha)', v.reps ?? 10, 'type="number" inputmode="numeric" min="1" max="600"', fieldError(e, 'reps') + fieldError(e, 'seconds'))}`,
    food: () => `${select('foodId', 'Alimento', data.nutrition.catalog.map((f) => [f.id, f.name]), v.foodId ?? 'banana')}
      ${input('amount', 'Cantidad', v.amount ?? 1, 'type="number" inputmode="decimal" min="0.25" step="0.25"', fieldError(e, 'amount'))}
      ${select('portionUnit', 'Unidad', [['portion', 'porción del alimento'], ['g', 'gramos']], v.portionUnit ?? 'portion')}
      ${select('moment', 'Momento', MOMENTS.map((m) => [m, m]), v.moment ?? 'Desayuno')}`,
    expense: () => `${input('amount', 'Importe (ARS)', v.amount ?? '', 'type="number" inputmode="numeric" min="1" step="1" placeholder="12500"', fieldError(e, 'amount'))}
      ${select('categoryId', 'Categoría', data.finances.categories.map((c) => [c.id, c.name]), v.categoryId ?? 'food')}
      ${input('description', 'Descripción', v.description ?? '', 'maxlength="60" placeholder="Supermercado"', fieldError(e, 'description'))}`,
    task: () => `${input('title', 'Tarea', v.title ?? '', 'maxlength="120" class="wide" placeholder="Ej.: Revisar el presupuesto de diciembre"', fieldError(e, 'title'))}
      ${select('priority', 'Prioridad', [['Media', 'Media'], ['Alta', 'Alta']], v.priority ?? 'Media')}`,
  }[type]();
  return `<div class="chips" role="group" aria-label="Tipo de registro">${[['set', 'Serie'], ['food', 'Comida'], ['expense', 'Gasto'], ['task', 'Tarea']].map(([id, label]) => `<button type="button" class="chip-btn" data-capture-type="${id}" aria-pressed="${type === id}">${label}</button>`).join('')}</div>
    <form class="capture-quick" data-capture-form="quick" novalidate><div class="form-grid">${body}</div><button type="submit" class="btn btn-dark btn-block">${icon('check', 16)} Guardar</button></form>`;
}

export function captureDialog(capture, data) {
  const chat = capture.mode === 'chat';
  return `<div class="dlg">
    <header class="dlg-head"><div><p class="kicker">Captura</p><h2 id="capture-title">Registrar</h2></div><button type="button" class="icon-btn" data-capture-close aria-label="Cerrar">${icon('close', 18)}</button></header>
    <div class="seg-control dlg-modes" role="group" aria-label="Forma de registrar">${[['chat', 'Contalo como lo dirías'], ['form', 'Formulario']].map(([id, label]) => `<button type="button" data-capture-mode="${id}" aria-pressed="${capture.mode === id}">${label}</button>`).join('')}</div>
    ${chat ? `<form class="capture-chat" data-capture-form="parse" novalidate>
        <label for="capture-text" class="field"><span>Escribí un entrenamiento, una comida, un gasto o una tarea</span><textarea id="capture-text" name="text" rows="3" maxlength="600" placeholder="Hice press de pecho, 3 series de 10 con 35 kilos">${esc(capture.text)}</textarea></label>
        ${capture.result ? '' : `<div class="examples"><span class="muted small">Ejemplos:</span>${CAPTURE_EXAMPLES.map((ex, i) => `<button type="button" class="chip-btn chip-sm" data-capture-example="${i}">${esc(ex)}</button>`).join('')}</div>`}
        <button type="submit" class="btn btn-outline">Interpretar</button>
      </form>
      <p class="honesty">${icon('info', 15)}<span><strong>Intérprete local por reglas, sin IA.</strong> Reconoce patrones acotados y te muestra lo que no entendió. En Vida 2.0 real, esta interpretación la hace un proyecto de ChatGPT con Skills del Personal AI System, y el dato se guarda en su fuente canónica. <button type="button" class="link-btn" data-tab="sistema">Ver cómo funciona</button></span></p>
      ${preview(capture, data)}` : quickForm(capture, data)}
    ${capture.lastApplied ? `<p class="capture-done" role="status">${icon('check', 15)} ${esc(capture.lastApplied)}</p>` : ''}
    <p class="muted small dlg-foot">Los registros quedan en la memoria de esta pestaña y se pueden deshacer.</p>
  </div>`;
}
