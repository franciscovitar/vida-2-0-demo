import { initialData } from './data.js';
import { icon } from './icons.js';
import { LABELS, areaOfTab, parseExercise } from './logic.js';
import { moduleView } from './modules.js';
import { validateAchievement, validateReview, weekSnapshot } from './src/domain/planning.js';
import { applyExampleImport, EXAMPLE_STATEMENT, preflightStatement } from './src/domain/importer.js';
import { addAchievement, addEnglishCard, addEnglishSession, addEpisode, addRestockToList, addReview, toggleMilestone, updateContinuity, applyIntent, editSet, rateSeason, recordCorrection, recordPurchase, togglePlannedSet, validateIntent } from './src/domain/actions.js';
import { checkAnswer, schedule } from './src/domain/study.js';
import { CAPTURE_EXAMPLES, parseCapture } from './src/domain/capture.js';
import { captureDialog } from './src/views/capture.js';

const tabs = new Set(Object.keys(LABELS));
const panel = document.querySelector('#panel');
const announcement = document.querySelector('#announcement');
const HISTORY_LIMIT = 40;

const freshCapture = () => ({ open: false, mode: 'chat', formType: 'set', text: '', result: null, errors: {}, values: null, lastApplied: '' });
const initialUi = Object.freeze({
  tourOpen: true, tourStep: 0,
  taskFilter: 'all', projectFilter: 'Todos', selectedProject: 'aurora',
  selectedDay: 0, selectedEvent: 'plan',
  healthMetric: 'sleep', healthTab: 'summary', healthScore: '',
  gymTab: 'hoy', gymExercise: 'press', gymEdit: '',
  nutritionDay: 0, nutritionTab: 'hoy', nutritionWindow: 28, mealOpen: '',
  deck: 'web', cardIndex: 0, cardFlipped: false, cardKnown: 0, cardAgain: 0,
  englishIndex: 0, englishAnswer: '', englishPracticed: false,
  financeCategory: 'home', financeMode: 'left', financeTab: 'budget', purchase: null, movementFilter: 'all',
  infoTab: 'readings', infoFront: 'all', infoOpen: '',
  planTab: 'continuity', continuityEdit: '', englishTab: 'practice', reviewDraft: null,
  shoppingTab: 'list', mediaTab: 'films', seriesFilter: 'all', moviesFilter: 'Todas', answerResult: null,
  systemMode: 'real',
});
const freshUi = () => ({ ...initialUi, formErrors: {}, cardioDraft: { modality: 'bike', minutes: 40, rpe: '', watts: '' }, foodDraft: { foodId: 'banana', amount: 1, portionId: 'unit', moment: 'Desayuno' }, capture: freshCapture() });

let data = structuredClone(initialData);
let ui = freshUi();
let past = [];
let currentTab = tabs.has(location.hash.slice(1)) ? location.hash.slice(1) : 'hoy';
let toastTimer = null;
let captureOpener = null;

function announce(message) {
  announcement.textContent = message;
}

/* ───────── Estado: cambios con historial para «Deshacer» ───────── */

function commit(label, mutate) {
  const snapshot = structuredClone(data);
  const result = mutate(data);
  if (result === false) return false;
  past.push({ label, snapshot });
  if (past.length > HISTORY_LIMIT) past.shift();
  render();
  toast(label, true);
  return true;
}

function undo() {
  const last = past.pop();
  if (!last) return;
  data = last.snapshot;
  ui.gymEdit = '';
  render();
  toast(`Deshecho: ${last.label}`, false);
}

function toast(message, undoable) {
  announce(message);
  const element = document.querySelector('#toast');
  if (!element) return;
  element.innerHTML = `<span>${icon('check', 16)}</span><span class="toast-text"></span>${undoable ? '<button type="button" class="toast-undo" data-action="undo">Deshacer</button>' : ''}`;
  element.querySelector('.toast-text').textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 7000);
  toastTimer.unref?.();
}

/* ───────── Render ───────── */

/** Aplica valores dinámicos como propiedades CSS (CSSOM), sin estilos en línea bloqueados por la CSP. */
function applyVars(root) {
  root.querySelectorAll?.('[data-vars]').forEach((element) => {
    for (const pair of element.dataset.vars.split(';')) {
      const index = pair.indexOf(':');
      if (index > 0) element.style.setProperty(pair.slice(0, index), pair.slice(index + 1));
    }
  });
}

function renderStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach((element) => {
    element.innerHTML = icon(element.dataset.icon, 18);
  });
}

/** Clave estable del control enfocado, para devolverle el foco tras re-renderizar. */
function focusKey(root) {
  const active = document.activeElement;
  if (!active || !root?.contains?.(active)) return null;
  const attribute = [...active.attributes].find((a) => (a.name.startsWith('data-') && a.name !== 'data-vars') || a.name === 'name');
  return attribute ? `[${attribute.name}="${CSS.escape(attribute.value)}"]` : null;
}

function render() {
  const key = focusKey(panel);
  panel.innerHTML = moduleView(currentTab, data, ui);
  applyVars(panel);

  const area = areaOfTab(currentTab) ?? 'hoy';
  document.querySelectorAll('.main-nav .nav-item').forEach((button) => {
    const active = button.dataset.tab === currentTab;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.querySelectorAll('.tabbar-item').forEach((button) => {
    if (button.dataset.area === area) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const breadcrumb = document.querySelector('#breadcrumb-current');
  if (breadcrumb) breadcrumb.textContent = LABELS[currentTab];
  const mobile = document.querySelector('#mobile-nav');
  if (mobile) mobile.value = currentTab;
  const openTasks = document.querySelector('#count-tareas');
  if (openTasks) openTasks.textContent = String(data.tasks.filter((task) => !task.done).length);
  const toBuy = document.querySelector('#count-compras');
  if (toBuy) toBuy.textContent = String(data.shopping.filter((item) => !item.checked).length);
  renderCapture();

  if (key) panel.querySelector(key)?.focus({ preventScroll: true });
}

function renderCapture() {
  const dialog = document.querySelector('#capture-dialog');
  if (!dialog || !ui.capture.open) return;
  const key = focusKey(dialog);
  dialog.innerHTML = captureDialog(ui.capture, data);
  if (key) dialog.querySelector(key)?.focus();
}

function changeTab(tab, { moveFocus = true } = {}) {
  if (!tabs.has(tab)) return;
  currentTab = tab;
  if (location.hash !== `#${tab}`) history.replaceState(null, '', `#${tab}`);
  closeCapture({ restoreFocus: false });
  render();
  if (moveFocus) {
    window.scrollTo?.({ top: 0 });
    panel.querySelector?.('h1')?.focus({ preventScroll: true });
  }
  announce(`Sección ${LABELS[tab]}`);
}

function resetDemo() {
  data = structuredClone(initialData);
  ui = freshUi();
  past = [];
  currentTab = 'hoy';
  history.replaceState(null, '', '#hoy');
  closeCapture({ restoreFocus: false });
  render();
  announce('Demo reiniciada. Todas las acciones volvieron a su estado inicial.');
}

/* ───────── Captura ───────── */

function openCapture(type) {
  const dialog = document.querySelector('#capture-dialog');
  ui.capture = { ...freshCapture(), open: true, mode: type ? 'form' : 'chat', formType: type || 'set' };
  captureOpener = document.activeElement ?? null;
  if (!dialog) return;
  renderCapture();
  if (!dialog.open) dialog.showModal?.();
  dialog.querySelector('textarea, select, input')?.focus();
}

function closeCapture({ restoreFocus = true } = {}) {
  ui.capture.open = false;
  const dialog = document.querySelector('#capture-dialog');
  if (dialog?.open) dialog.close();
  if (restoreFocus) captureOpener?.focus?.();
}

const captureContext = () => ({
  exercises: data.gym.exercises.map((e) => ({ id: e.id, name: e.name, ...data.gym.exerciseMeta[e.id] })),
  catalog: data.nutrition.catalog,
  clock: data.demoClock.time,
  needs: data.household.needs.map((n) => ({ id: n.id, name: n.name, category: n.category, aliases: [n.name.toLowerCase(), n.name.split(' ')[0].toLowerCase()] })),
});

/** Lleva la vista previa a la vista (importante en mobile) y anuncia su título. */
function focusPreview() {
  const title = document.querySelector('#preview-title');
  title?.focus?.({ preventScroll: true });
  title?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
}

/** Lee los campos editables de la vista previa y actualiza las intenciones. */
function syncPreview(form) {
  if (!ui.capture.result || typeof HTMLFormElement === 'undefined' || !(form instanceof HTMLFormElement)) return;
  const values = Object.fromEntries(new FormData(form));
  ui.capture.result.intents = ui.capture.result.intents.map((intent) => {
    const next = { ...intent };
    for (const [name, value] of Object.entries(values)) {
      const [key, field] = name.split('.');
      if (key === intent.key) next[field] = field === 'moment' ? { value, inferred: false } : value === '' ? null : value;
    }
    return next;
  });
}

function confirmIntents(intents) {
  const errors = {};
  for (const intent of intents) {
    const check = validateIntent(data, intent);
    if (!check.ok) errors[intent.key ?? 'quick'] = check.errors;
  }
  if (Object.keys(errors).length) {
    ui.capture.errors = errors;
    renderCapture();
    announce('Hay datos para corregir antes de confirmar.');
    return false;
  }
  let summary = [];
  commit(intents.length === 1 ? 'Registro guardado' : `${intents.length} registros guardados`, (draft) => { summary = intents.map((intent) => applyIntent(draft, intent)); });
  ui.capture = { ...freshCapture(), open: ui.capture.open, mode: ui.capture.mode, formType: ui.capture.formType, lastApplied: `Guardado: ${summary.join(' · ')}.` };
  renderCapture();
  return true;
}

const submitHandlers = {
  /** Serie agregada desde la tarjeta del ejercicio. */
  set(form, values) {
    const intent = { kind: 'gym.set', exerciseId: form.dataset.exercise, sets: 1, kg: values.kg, reps: values.reps, seconds: values.seconds };
    const check = validateIntent(data, intent);
    ui.formErrors[`set-${intent.exerciseId}`] = check.ok ? undefined : check.errors;
    if (!check.ok) { render(); announce('Revisá la serie: hay un valor fuera de rango.'); return; }
    commit('Serie agregada', (draft) => { applyIntent(draft, intent); });
  },
  'set-edit'(form, values) {
    const id = form.dataset.set;
    const snapshot = structuredClone(data);
    const result = editSet(data, id, values);
    if (!result.ok) { data = snapshot; ui.formErrors[`edit-${id}`] = result.errors; render(); return; }
    data = snapshot;
    ui.gymEdit = '';
    ui.formErrors[`edit-${id}`] = undefined;
    commit('Serie corregida', (draft) => { editSet(draft, id, values); });
  },
  food(form, values) {
    const intent = { kind: 'food.entry', foodId: values.foodId, amount: values.amount, portionId: values.portionId, moment: values.moment };
    ui.foodDraft = { foodId: values.foodId, amount: values.amount, portionId: values.portionId, moment: values.moment };
    const check = validateIntent(data, intent);
    ui.formErrors.food = check.ok ? undefined : check.errors;
    if (!check.ok) { render(); announce('Revisá la cantidad del alimento.'); return; }
    commit('Alimento agregado', (draft) => { applyIntent(draft, intent); });
  },
  purchase(form, values) {
    const amount = Number(values.amount);
    const ok = Number.isSafeInteger(amount) && amount > 0 && amount <= 100_000_000;
    ui.formErrors.purchase = ok ? undefined : { amount: 'Ingresá un importe entero mayor que 0.' };
    ui.purchase = ok ? amount : null;
    render();
    announce(ok ? 'Escenario de compra calculado.' : 'Revisá el importe a simular.');
  },
  cardio(form, values) {
    const intent = { kind: 'cardio.session', modality: values.modality, minutes: values.minutes, rpe: values.rpe === '' ? null : Number(values.rpe), watts: values.watts === '' ? null : Number(values.watts) };
    ui.cardioDraft = { ...values };
    const check = validateIntent(data, intent);
    ui.formErrors.cardio = check.ok ? undefined : check.errors;
    if (!check.ok) { render(); announce('Revisá los datos de la sesión de cardio.'); return; }
    commit('Sesión de cardio agregada', (draft) => { applyIntent(draft, intent); });
  },
  answer(form, values) {
    const key = form.dataset.card;
    const [deckId, index] = key.split(':');
    const card = data.decks.find((d) => d.id === deckId).cards[Number(index)];
    const result = checkAnswer(card, values.answer);
    ui.formErrors.answer = result ? undefined : { answer: 'Escribí una respuesta para comprobar.' };
    ui.answerResult = result ? { key, ...result } : null;
    if (result) ui.cardFlipped = true;
    render();
    announce(result ? (result.correct ? 'Respuesta correcta' : 'La respuesta no coincide') : 'Falta la respuesta');
  },
  continuity(form, values) {
    const id = form.dataset.item;
    const probe = structuredClone(data);
    const check = updateContinuity(probe, id, values);
    ui.formErrors[`cont-${id}`] = check.ok ? undefined : check.errors;
    if (!check.ok) { render(); return; }
    ui.continuityEdit = '';
    commit('Avance registrado: el frente quedó al día', (draft) => { updateContinuity(draft, id, values); });
  },
  review(form, values) {
    const check = validateReview(values);
    ui.reviewDraft = values;
    ui.formErrors.review = check.ok ? undefined : check.errors;
    if (!check.ok) { render(); announce('Completá las tres preguntas de la revisión.'); return; }
    ui.reviewDraft = null;
    commit('Revisión semanal guardada', (draft) => { addReview(draft, values, weekSnapshot(draft)); });
  },
  achievement(form, values) {
    const check = validateAchievement(values);
    ui.formErrors.achievement = check.ok ? undefined : check.errors;
    if (!check.ok) { render(); return; }
    commit('Logro guardado', (draft) => { addAchievement(draft, values); });
  },
  'english-session'(form, values) {
    const probe = structuredClone(data);
    const check = addEnglishSession(probe, values);
    ui.formErrors.englishSession = check.ok ? undefined : check.errors;
    if (!check.ok) { render(); return; }
    commit('Sesión de inglés registrada', (draft) => { addEnglishSession(draft, values); });
  },
  parse(form, values) {
    ui.capture.text = String(values.text ?? '');
    ui.capture.errors = {};
    ui.capture.lastApplied = '';
    ui.capture.result = ui.capture.text.trim() ? parseCapture(ui.capture.text, captureContext()) : { intents: [], unparsed: [] };
    renderCapture();
    announce(`Interpretación lista: ${ui.capture.result.intents.length} registros reconocidos, ${ui.capture.result.unparsed.length} fragmentos sin interpretar.`);
    focusPreview();
  },
  confirm(form) {
    syncPreview(form);
    confirmIntents(ui.capture.result.intents);
  },
  quick(form, values) {
    const type = ui.capture.formType;
    ui.capture.values = values;
    let intent;
    if (type === 'set') {
      const timed = data.gym.exerciseMeta[values.exerciseId]?.mode === 'time';
      intent = { kind: 'gym.set', exerciseId: values.exerciseId, sets: 1, kg: timed ? null : values.kg, reps: timed ? null : values.reps, seconds: timed ? values.reps : null };
    } else if (type === 'food') {
      const food = data.nutrition.catalog.find((f) => f.id === values.foodId);
      intent = { kind: 'food.entry', foodId: values.foodId, amount: values.amount, portionId: values.portionUnit === 'g' ? 'g' : food.portions[0].id, moment: values.moment };
    } else if (type === 'expense') {
      intent = { kind: 'finance.expense', amount: values.amount, categoryId: values.categoryId, description: values.description };
    } else {
      intent = { kind: 'task.create', title: values.title, priority: values.priority };
    }
    if (confirmIntents([{ ...intent, key: 'quick' }])) ui.capture.values = null;
  },
};

/* ───────── Clicks ───────── */

const clickHandlers = {
  tab: (value, target) => { if (target?.dataset?.gymTabTarget) ui.gymTab = target.dataset.gymTabTarget; changeTab(value); },
  action: (value) => { if (value === 'reset') resetDemo(); if (value === 'undo') undo(); },
  openCapture: (value) => openCapture(value),
  captureClose: () => closeCapture(),
  captureMode: (value) => { ui.capture.mode = value; ui.capture.errors = {}; renderCapture(); },
  captureType: (value) => { ui.capture.formType = value; ui.capture.values = null; ui.capture.errors = {}; ui.capture.lastApplied = ''; renderCapture(); },
  captureExample: (value) => {
    ui.capture.text = CAPTURE_EXAMPLES[Number(value)] ?? '';
    ui.capture.result = parseCapture(ui.capture.text, captureContext());
    ui.capture.errors = {}; ui.capture.lastApplied = '';
    renderCapture();
    focusPreview();
    announce(`Ejemplo interpretado: ${ui.capture.result.intents.length} registros.`);
  },
  captureDrop: (value) => {
    syncPreview(document.querySelector?.('[data-capture-form="confirm"]'));
    ui.capture.result.intents = ui.capture.result.intents.filter((i) => i.key !== value);
    renderCapture();
  },
  tour: (value) => {
    if (value === 'close' || ui.tourStep >= 2) { ui.tourOpen = false; announce('Recorrido cerrado'); }
    else { ui.tourStep += 1; announce(`Recorrido, paso ${ui.tourStep + 1} de 3`); }
    render();
  },
  taskFilter: (value) => { ui.taskFilter = value; render(); announce(`Tareas: ${value === 'all' ? 'todas' : value}`); },
  filter: (value) => {
    ui.projectFilter = value;
    const visible = data.projects.filter((p) => value === 'Todos' || p.category === value);
    if (!visible.some((p) => p.id === ui.selectedProject)) ui.selectedProject = visible[0]?.id ?? '';
    render(); announce(`Filtro de proyectos: ${value}`);
  },
  project: (value) => { ui.selectedProject = value; render(); announce(`Proyecto ${data.projects.find((p) => p.id === value)?.name ?? ''} seleccionado`); },
  day: (value) => {
    ui.selectedDay = Number(value);
    ui.selectedEvent = data.agenda.find((e) => e.day === ui.selectedDay)?.id ?? '';
    render(); announce('Agenda actualizada');
  },
  event: (value) => { ui.selectedEvent = value; render(); announce(`Detalle de ${data.agenda.find((e) => e.id === value)?.title ?? ''}`); },
  healthTab: (value) => { ui.healthTab = value; render(); },
  healthScore: (value) => { ui.healthScore = value; render(); },
  financeTab: (value) => { ui.financeTab = value; render(); },
  financeImport: () => {
    if (!preflightStatement(EXAMPLE_STATEMENT, data.finances).eligible) return;
    commit('Importación de ejemplo conciliada', (draft) => applyExampleImport(draft) > 0);
  },
  movementFilter: (value) => { ui.movementFilter = value; render(); },
  shoppingTab: (value) => { ui.shoppingTab = value; render(); },
  restockAdd: (value) => commit('Agregado a la lista de compras', (draft) => addRestockToList(draft, value)),
  restockCorrect: (value) => { const [id, type] = value.split(':'); commit('Corrección registrada: la reposición se recalculó', (draft) => { recordCorrection(draft, id, type); }); },
  restockBought: (value) => commit('Compra registrada: la reposición se recalculó', (draft) => { recordPurchase(draft, value); }),
  mediaTab: (value) => { ui.mediaTab = value; render(); },
  planTab: (value) => { ui.planTab = value; ui.continuityEdit = ''; render(); },
  continuityEdit: (value) => { ui.continuityEdit = value; render(); if (value) panel.querySelector?.(`[data-item="${value}"] input`)?.focus(); },
  englishTab: (value) => { ui.englishTab = value; render(); },
  englishCard: (value) => commit('Tarjeta creada en el mazo «Inglés cotidiano»', (draft) => (addEnglishCard(draft, value) ? undefined : false)),
  infoTab: (value) => { ui.infoTab = value; render(); },
  infoFront: (value) => { ui.infoFront = value; render(); },
  infoOpen: (value) => { ui.infoOpen = value; render(); },
  infoFeedback: (value) => {
    const [id, fb] = value.split(':');
    data.info.feedback = { ...data.info.feedback, [id]: data.info.feedback[id] === fb ? undefined : fb };
    render();
    announce(data.info.feedback[id] ? 'Opinión guardada para esta pieza' : 'Opinión quitada');
  },
  automationToggle: (value) => commit('Estado de la automatización cambiado', (draft) => {
    const a = draft.info.automations.find((x) => x.id === value);
    a.enabled = !a.enabled;
  }),
  automationRun: (value) => commit('Ejecución simulada registrada', (draft) => {
    const a = draft.info.automations.find((x) => x.id === value);
    a.runs = [{ id: `run-${(draft.seq = (draft.seq ?? 0) + 1)}`, at: `${draft.today}T${draft.demoClock.time}`, state: a.enabled ? 'succeeded' : 'skipped', detail: a.enabled ? 'Ejecución manual simulada' : 'Pausada: el kill switch impidió la ejecución' }, ...a.runs];
  }),
  seriesFilter: (value) => { ui.seriesFilter = value; render(); },
  episode: (value) => { let label = null; commit('Episodio registrado', (draft) => { label = addEpisode(draft, value); return label ? undefined : false; }); },
  seasonRate: (value) => { const [id, n, r] = value.split(':'); commit('Calificación de temporada guardada', (draft) => (rateSeason(draft, id, Number(n), Number(r)) ? undefined : false)); },
  cardRate: (value) => advanceCard('cardKnown', value),
  healthMetric: (value) => { ui.healthMetric = value; ui.healthTab = 'trends'; render(); announce(`Indicador: ${value === 'sleep' ? 'sueño' : value === 'steps' ? 'pasos' : 'minutos activos'}`); },
  gymTab: (value) => { ui.gymTab = value; ui.gymEdit = ''; render(); },
  gymExercise: (value) => { ui.gymExercise = value; render(); },
  gymEdit: (value) => { ui.gymEdit = value; render(); if (value) panel.querySelector?.(`[data-set="${value}"] input`)?.focus(); },
  gymRemove: (value) => commit('Serie eliminada', (draft) => { draft.gym.today = draft.gym.today.filter((s) => s.id !== value); }),
  gymToggle: () => { data.gym.completed = !data.gym.completed; render(); announce(data.gym.completed ? 'Sesión marcada como completa' : 'Sesión marcada como pendiente'); },
  gymSet: (value) => {
    const exercise = data.gym.exercises.find((e) => e.id === value.split('-')[0]);
    const plan = parseExercise(exercise);
    const added = togglePlannedSet(data, value, { kg: plan.kg, reps: plan.repsNumber, seconds: Number.parseInt(plan.reps, 10) });
    render();
    announce(added ? `Serie de ${exercise.name} registrada` : `Serie de ${exercise.name} desmarcada`);
  },
  nutritionDay: (value) => { ui.nutritionDay = Number(value); ui.mealOpen = ''; render(); announce(`Comidas de ${data.nutrition.days[ui.nutritionDay].label}`); },
  nutritionTab: (value) => { ui.nutritionTab = value; render(); },
  nutritionWindow: (value) => { ui.nutritionWindow = Number(value); render(); },
  foodRemove: (value) => commit('Alimento quitado', (draft) => { draft.nutrition.days[0].meals = draft.nutrition.days[0].meals.filter((m) => m.id !== value); }),
  meal: (value) => { ui.mealOpen = ui.mealOpen === value ? '' : value; render(); },
  deck: (value) => {
    Object.assign(ui, { deck: value, cardIndex: 0, cardFlipped: false, cardKnown: 0, cardAgain: 0 });
    render(); announce(`Mazo ${data.decks.find((d) => d.id === value)?.title ?? ''}`);
  },
  flip: () => { ui.cardFlipped = !ui.cardFlipped; render(); announce(ui.cardFlipped ? 'Respuesta revelada' : 'Pregunta visible'); },
  nextCard: () => advanceCard('cardKnown', 'good'),
  cardAgain: () => advanceCard('cardAgain', 'again'),
  englishAnswer: (value) => {
    if (ui.englishAnswer) return;
    ui.englishAnswer = value;
    ui.englishPracticed = true;
    render();
    announce(value === data.english.questions[ui.englishIndex].correct ? 'Respuesta correcta' : 'Respuesta incorrecta, con explicación');
  },
  nextEnglish: () => { ui.englishIndex = (ui.englishIndex + 1) % data.english.questions.length; ui.englishAnswer = ''; render(); announce('Siguiente pregunta de inglés'); },
  financeCategory: (value) => { ui.financeCategory = value; render(); },
  financeMode: (value) => { ui.financeMode = value; render(); },
  systemMode: (value) => { ui.systemMode = value; render(); },
  moviesFilter: (value) => { ui.moviesFilter = value; render(); announce(`Películas: ${value}`); },
  movieToggle: (value) => {
    const movie = data.movies.find((m) => m.id === value);
    if (!movie) return;
    movie.watched = !movie.watched;
    movie.rating = movie.watched ? (initialData.movies.find((m) => m.id === value)?.rating ?? null) : null;
    render(); announce(`${movie.title}: ${movie.watched ? 'vista' : 'por ver'}`);
  },
};

function advanceCard(counter, rating) {
  const deck = data.decks.find((d) => d.id === ui.deck);
  const key = `${deck.id}:${ui.cardIndex % deck.cards.length}`;
  data.study[key] = schedule(data.study[key], rating);
  ui.answerResult = null;
  ui[counter] += 1;
  ui.cardIndex = (ui.cardIndex + 1) % deck.cards.length;
  ui.cardFlipped = false;
  render();
  announce('Siguiente tarjeta');
}

document.addEventListener('click', (event) => {
  const info = document.querySelector('.demo-info');
  if (info?.open && !event.target.closest?.('.demo-info')) info.open = false;

  const target = event.target.closest('button, a');
  if (!target) return;
  for (const [name, handler] of Object.entries(clickHandlers)) {
    if (name in target.dataset) {
      if (target.tagName === 'A') event.preventDefault?.();
      if (info?.open) info.open = false;
      handler(target.dataset[name], target);
      return;
    }
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target;
  const handler = submitHandlers[form?.dataset?.captureForm];
  if (!handler) return;
  event.preventDefault();
  handler(form, Object.fromEntries(new FormData(form)));
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'mobile-nav') { changeTab(target.value); return; }
  if ('foodSelect' in (target.dataset ?? {})) {
    const food = data.nutrition.catalog.find((f) => f.id === target.value);
    ui.foodDraft = { ...ui.foodDraft, foodId: target.value, portionId: food.portions[0].id };
    render();
    return;
  }
  if (/^i\d+\.foodId$/.test(target.name ?? '')) {
    const form = target.form;
    syncPreview(form);
    const key = target.name.split('.')[0];
    const food = data.nutrition.catalog.find((f) => f.id === target.value);
    ui.capture.result.intents = ui.capture.result.intents.map((i) => (i.key === key ? { ...i, foodName: food.name, portionId: food.portions[0].id } : i));
    renderCapture();
    return;
  }
  if (!(target instanceof HTMLInputElement)) return;
  const { habitCheck, taskCheck, shoppingCheck, milestoneCheck } = target.dataset;
  if (milestoneCheck) {
    const [goalId, milestoneId] = milestoneCheck.split(':');
    toggleMilestone(data, goalId, milestoneId, target.checked);
    render();
    announce(target.checked ? 'Hito cumplido' : 'Hito pendiente');
    return;
  }
  if (habitCheck) {
    const habit = data.habits.find((h) => h.id === habitCheck);
    if (habit) { habit.done = target.checked; render(); announce(`${habit.label}: ${habit.done ? 'completado' : 'pendiente'}`); }
  } else if (taskCheck) {
    const task = data.tasks.find((t) => t.id === taskCheck);
    if (task) {
      task.done = target.checked;
      if (ui.tourOpen && ui.tourStep === 0) ui.tourStep = 1;
      render(); announce(`${task.label}: ${task.done ? 'completada' : 'pendiente'}`);
    }
  } else if (shoppingCheck) {
    const item = data.shopping.find((s) => s.id === shoppingCheck);
    if (item) {
      item.checked = target.checked;
      // Un producto sugerido por la reposición, al tacharlo, cuenta como compra (y se puede deshacer destildándolo).
      if (item.needId) {
        const ref = `buy-${item.id}`;
        data.household.extraPurchases = data.household.extraPurchases.filter((p) => p.id !== ref);
        if (item.checked) { recordPurchase(data, item.needId, ref); item.checked = true; }
      }
      render(); announce(`${item.name}: ${item.checked ? 'en la compra' : 'pendiente'}`); }
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key?.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
    const select = document.querySelector('#mobile-nav');
    if (!select) return;
    event.preventDefault();
    select.focus();
    try { select.showPicker?.(); } catch { /* algunos navegadores no permiten abrirlo por código */ }
  }
  if (event.key === 'Escape') {
    const info = document.querySelector('.demo-info');
    if (info?.open) { info.open = false; info.querySelector('summary')?.focus(); }
  }
});

document.querySelector('#capture-dialog')?.addEventListener('close', () => {
  ui.capture.open = false;
  captureOpener?.focus?.();
});

window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1);
  if (tabs.has(tab) && tab !== currentTab) changeTab(tab);
});

const kbd = document.querySelector('#jump-kbd');
if (kbd && /Mac|iPhone|iPad/.test(globalThis.navigator?.platform ?? '')) kbd.textContent = '⌘K';
renderStaticIcons();
render();

/** Superficie mínima para pruebas automatizadas (no se usa en la interfaz). */
export const __test = {
  submit: (name, values, dataset = {}) => submitHandlers[name]({ dataset }, values),
  get data() { return data; },
  get ui() { return ui; },
  undo,
};
