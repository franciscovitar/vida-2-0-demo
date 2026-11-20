import { initialData } from './data.js';
import { icon } from './icons.js';
import { LABELS, areaOfTab } from './logic.js';
import { moduleView } from './modules.js';

const tabs = new Set(Object.keys(LABELS));
const panel = document.querySelector('#panel');
const announcement = document.querySelector('#announcement');

const initialUi = Object.freeze({
  tourOpen: true, tourStep: 0,
  taskFilter: 'all', projectFilter: 'Todos', selectedProject: 'aurora',
  selectedDay: 0, selectedEvent: 'plan',
  healthMetric: 'sleep', nutritionDay: 0, mealOpen: '',
  deck: 'web', cardIndex: 0, cardFlipped: false, cardKnown: 0, cardAgain: 0,
  englishIndex: 0, englishAnswer: '', englishPracticed: false,
  financeCategory: 'home', financeMode: 'left', moviesFilter: 'Todas',
});
const freshUi = () => ({ ...initialUi, gymSets: {} });

let data = structuredClone(initialData);
let ui = freshUi();
let currentTab = tabs.has(location.hash.slice(1)) ? location.hash.slice(1) : 'hoy';

function announce(message) {
  announcement.textContent = message;
}

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
function focusKey() {
  const active = document.activeElement;
  if (!active || !panel.contains?.(active)) return null;
  const attribute = [...active.attributes].find((a) => a.name.startsWith('data-') && a.name !== 'data-vars');
  return attribute ? `[${attribute.name}="${CSS.escape(attribute.value)}"]` : null;
}

function render() {
  const key = focusKey();
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

  if (key) panel.querySelector(key)?.focus({ preventScroll: true });
}

function changeTab(tab, { moveFocus = true } = {}) {
  if (!tabs.has(tab)) return;
  currentTab = tab;
  if (location.hash !== `#${tab}`) history.replaceState(null, '', `#${tab}`);
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
  currentTab = 'hoy';
  history.replaceState(null, '', '#hoy');
  render();
  announce('Demo reiniciada. Todas las acciones volvieron a su estado inicial.');
}

const clickHandlers = {
  tab: (value) => changeTab(value),
  action: (value) => { if (value === 'reset') resetDemo(); },
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
  healthMetric: (value) => { ui.healthMetric = value; render(); announce(`Indicador: ${value === 'sleep' ? 'sueño' : value === 'steps' ? 'pasos' : 'minutos activos'}`); },
  gymToggle: () => { data.gym.completed = !data.gym.completed; render(); announce(data.gym.completed ? 'Sesión marcada como completa' : 'Sesión marcada como pendiente'); },
  gymSet: (value) => { ui.gymSets = { ...ui.gymSets, [value]: !ui.gymSets[value] }; render(); },
  nutritionDay: (value) => { ui.nutritionDay = Number(value); ui.mealOpen = ''; render(); announce(`Comidas de ${data.nutrition.days[ui.nutritionDay].label}`); },
  meal: (value) => { ui.mealOpen = ui.mealOpen === value ? '' : value; render(); },
  deck: (value) => {
    Object.assign(ui, { deck: value, cardIndex: 0, cardFlipped: false, cardKnown: 0, cardAgain: 0 });
    render(); announce(`Mazo ${data.decks.find((d) => d.id === value)?.title ?? ''}`);
  },
  flip: () => { ui.cardFlipped = !ui.cardFlipped; render(); announce(ui.cardFlipped ? 'Respuesta revelada' : 'Pregunta visible'); },
  nextCard: () => advanceCard('cardKnown'),
  cardAgain: () => advanceCard('cardAgain'),
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
  moviesFilter: (value) => { ui.moviesFilter = value; render(); announce(`Películas: ${value}`); },
  movieToggle: (value) => {
    const movie = data.movies.find((m) => m.id === value);
    if (!movie) return;
    movie.watched = !movie.watched;
    movie.rating = movie.watched ? (initialData.movies.find((m) => m.id === value)?.rating ?? null) : null;
    render(); announce(`${movie.title}: ${movie.watched ? 'vista' : 'por ver'}`);
  },
};

function advanceCard(counter) {
  const deck = data.decks.find((d) => d.id === ui.deck);
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
      handler(target.dataset[name]);
      return;
    }
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'mobile-nav') { changeTab(target.value); return; }
  if (!(target instanceof HTMLInputElement)) return;
  const { habitCheck, taskCheck, shoppingCheck } = target.dataset;
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
    if (item) { item.checked = target.checked; render(); announce(`${item.name}: ${item.checked ? 'en la compra' : 'pendiente'}`); }
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

window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1);
  if (tabs.has(tab) && tab !== currentTab) changeTab(tab);
});

const kbd = document.querySelector('#jump-kbd');
if (kbd && /Mac|iPhone|iPad/.test(globalThis.navigator?.platform ?? '')) kbd.textContent = '⌘K';
renderStaticIcons();
render();
