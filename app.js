import { initialData } from './data.js';
import { moduleView } from './modules.js';

const labels = {
  hoy: 'Mi día', proyectos: 'Proyectos', agenda: 'Agenda',
  salud: 'Salud', gimnasio: 'Gimnasio', nutricion: 'Nutrición',
  mazos: 'Mazos de estudio', ingles: 'Inglés', finanzas: 'Finanzas',
  compras: 'Compras', peliculas: 'Películas',
};
const tabs = new Set(Object.keys(labels));
const days = ['Martes 17', 'Miércoles 18', 'Jueves 19'];
const panel = document.querySelector('#panel');
const announcement = document.querySelector('#announcement');

let data = structuredClone(initialData);
let currentTab = tabs.has(location.hash.slice(1)) ? location.hash.slice(1) : 'hoy';
let projectFilter = 'Todos';
let selectedProject = 'aurora';
let selectedDay = 0;
let selectedEvent = 'plan';
const initialUi = {
  healthMetric: 'sleep', nutritionDay: 0, mealOpen: '', deck: 'web', cardIndex: 0,
  cardFlipped: false, englishIndex: 0, englishAnswer: '', financeCategory: '', moviesFilter: 'Todas',
};
let ui = { ...initialUi };

const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  layers: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 9v12"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 1M4 17l2 1a7 7 0 0 0 12.5-3"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  sparkles: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3ZM19 17l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2ZM4 2l.5 2L6.5 4.5l-2 .5L4 7l-.5-2L1.5 4.5l2-.5L4 2Z"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  coffee: '<path d="M4 7h13v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7ZM17 9h2a3 3 0 0 1 0 6h-2M7 3v2M12 3v2"/>',
  heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>',
  activity: '<path d="M2 12h4l3-7 5 14 3-7h5"/>',
  utensils: '<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M18 3c-3 4-4 9-4 12h5V3m0 0v18"/>',
  book: '<path d="M4 4.5c2.9-1.2 5.7-1.2 8 .5 2.3-1.7 5.1-1.7 8-.5V20c-3-1.1-5.7-1.1-8 .5-2.3-1.6-5-1.6-8-.5V4.5ZM12 5v15"/>',
  languages: '<path d="M4 5h12M10 3v2m5 1a13 13 0 0 1-9 12m0-11a13 13 0 0 0 9 11M12 21l5-11 5 11m-8-4h6"/>',
  wallet: '<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 10h18M5 6V4a2 2 0 0 1 2-2h11M17 15h2"/>',
  basket: '<path d="m4 10 2 11h12l2-11H4Zm4 0 4-7 4 7M3 10h18M9 14v4m6-4v4"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4"/>',
  moon: '<path d="M20.5 15.4A9 9 0 0 1 8.6 3.5 9 9 0 1 0 20.5 15.4Z"/>',
};

function icon(name, size = 19) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.grid}</svg>`;
}

function renderStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach((element) => {
    element.innerHTML = icon(element.dataset.icon);
  });
}

function countDone(items) {
  return items.filter((item) => item.done).length;
}

function percent(done, total) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function sectionIntro(kicker, title, sub) {
  return `<div class="section-heading"><div><div class="section-kicker">${kicker}</div><h2>${title}</h2><p>${sub}</p></div><span class="section-context">ENTORNO DE EXPLORACIÓN <span class="context-dot"></span></span></div>`;
}

const showcaseSpaces = [
  { title: 'Cuerpo y bienestar', desc: 'Tu salud, entrenamientos y alimentación.', tone: 'green', symbol: 'heart', tabs: [['salud', 'Salud'], ['gimnasio', 'Gimnasio'], ['nutricion', 'Nutrición']] },
  { title: 'Aprender cada día', desc: 'Tarjetas de repaso y práctica de inglés.', tone: 'violet', symbol: 'book', tabs: [['mazos', 'Mazos'], ['ingles', 'Inglés']] },
  { title: 'La vida cotidiana', desc: 'Presupuesto, compras y entretenimiento.', tone: 'blue', symbol: 'wallet', tabs: [['finanzas', 'Finanzas'], ['compras', 'Compras'], ['peliculas', 'Películas']] },
];

function todayView() {
  const completedHabits = countDone(data.habits);
  const completedTasks = countDone(data.tasks);
  const nextEvents = data.agenda.filter((item) => item.day === 0);
  const remainingTasks = data.tasks.length - completedTasks;

  return `
    ${sectionIntro('01 / TU CENTRO DE CONTROL', 'Un día con intención.', 'Ordená lo importante. El resto puede esperar.')}
    <div class="date-bar"><div>${icon('sun', 18)}<span>${data.dateLabel}</span></div><span>${icon('info', 15)} Ejemplo con datos sintéticos</span></div>
    <div class="metrics">
      <article class="metric"><div class="metric-top"><span>HÁBITOS COMPLETADOS</span><span class="metric-icon green">${icon('check')}</span></div><div class="metric-value">${completedHabits}<span>/${data.habits.length}</span></div><div class="metric-caption">${percent(completedHabits, data.habits.length)}% de tu rutina de hoy</div><div class="metric-meter"><span style="width:${percent(completedHabits, data.habits.length)}%"></span></div></article>
      <article class="metric"><div class="metric-top"><span>TAREAS DEL DÍA</span><span class="metric-icon violet">${icon('layers')}</span></div><div class="metric-value">${remainingTasks}<span> pendientes</span></div><div class="metric-caption">${completedTasks} completadas en esta sesión</div><div class="metric-meter violet-meter"><span style="width:${percent(completedTasks, data.tasks.length)}%"></span></div></article>
      <article class="metric"><div class="metric-top"><span>PROYECTOS ACTIVOS</span><span class="metric-icon blue">${icon('target')}</span></div><div class="metric-value">${data.projects.filter((item) => item.status === 'En curso').length.toString().padStart(2, '0')}</div><div class="metric-caption">Organizados en un mismo lugar</div><button class="metric-link" type="button" data-tab="proyectos">Ver proyectos ${icon('arrow', 14)}</button></article>
      <article class="metric"><div class="metric-top"><span>EVENTOS DE HOY</span><span class="metric-icon amber">${icon('calendar')}</span></div><div class="metric-value">${nextEvents.length.toString().padStart(2, '0')}</div><div class="metric-caption">Tu agenda de un vistazo</div><button class="metric-link" type="button" data-tab="agenda">Explorar agenda ${icon('arrow', 14)}</button></article>
    </div>
    <div class="today-grid">
      <div class="main-column">
        <article class="focus-card"><span class="focus-orbit orbit-1"></span><span class="focus-orbit orbit-2"></span><div class="focus-label">${icon('target')} TU FOCO PRINCIPAL</div><h3>${data.focus}</h3><p>Una prioridad clara puede cambiar todo el día.</p><span class="focus-tag">PRIORIDAD DEL DÍA <span aria-hidden="true">↗</span></span></article>
        <section class="surface tasks-surface"><header class="surface-header"><div><div class="surface-eyebrow">PLAN DE ACCIÓN</div><h3>Tus próximas tareas</h3></div><span class="surface-count">${remainingTasks} pendientes</span></header><ul class="task-list">${data.tasks.map((task) => `<li><label class="task-row ${task.done ? 'is-done' : ''}"><input type="checkbox" data-task-check="${task.id}" ${task.done ? 'checked' : ''} aria-label="Marcar ${task.label} como ${task.done ? 'pendiente' : 'completada'}"/><span class="task-check" aria-hidden="true">${icon('check', 13)}</span><span class="task-text"><strong>${task.label}</strong><small>${task.project} <span aria-hidden="true">·</span> ${task.category}</small></span><span class="priority ${task.priority === 'Alta' ? 'high' : ''}">${task.priority}</span></label></li>`).join('')}</ul><div class="surface-footer">Probá completar una tarea. El cambio no se guarda. <span>${icon('arrow', 15)}</span></div></section>
      </div>
      <div class="side-column">
        <section class="surface habits-surface"><header class="surface-header"><div><div class="surface-eyebrow">PEQUEÑOS PASOS</div><h3>Hábitos de hoy</h3></div><div class="habits-ring" style="--progress:${percent(completedHabits, data.habits.length)}%" aria-label="${completedHabits} de ${data.habits.length} hábitos completados">${completedHabits}/${data.habits.length}</div></header><ul class="habit-list">${data.habits.map((habit) => `<li><label class="habit-row ${habit.done ? 'is-done' : ''}"><span class="habit-symbol ${habit.color}">${icon(habit.id === 'lectura' ? 'layers' : habit.id === 'movimiento' ? 'trend' : habit.id === 'planificacion' ? 'target' : 'coffee', 17)}</span><span class="habit-text"><strong>${habit.label}</strong><small>${habit.detail}</small></span><input type="checkbox" data-habit-check="${habit.id}" ${habit.done ? 'checked' : ''} aria-label="Marcar hábito ${habit.label} como ${habit.done ? 'pendiente' : 'completado'}"/><span class="habit-toggle" aria-hidden="true">${icon('check', 13)}</span></label></li>`).join('')}</ul></section>
        <section class="surface upcoming-surface"><header class="surface-header"><div><div class="surface-eyebrow">EN TU CALENDARIO</div><h3>Próximos eventos</h3></div><button class="text-action" type="button" data-tab="agenda" aria-label="Abrir agenda">${icon('arrow')}</button></header><ul class="upcoming-list">${nextEvents.slice(0, 3).map((event) => `<li><span class="upcoming-time">${event.time}</span><span class="upcoming-line ${event.color}"></span><span><strong>${event.title}</strong><small>${event.category}</small></span></li>`).join('')}</ul></section>
      </div>
    </div>
    <section class="module-launcher" aria-label="Explorar otras áreas de Vida 2.0">
      <div class="launcher-heading"><div class="section-kicker">MUCHO MÁS PARA EXPLORAR</div><h3>Tu vida, a tu manera.</h3><p>No tenés que usar todo. Elegí las áreas que te sirvan.</p></div>
      <div class="space-grid">${showcaseSpaces.map((space) => `<article class="space-card"><span class="space-symbol ${space.tone}">${icon(space.symbol, 22)}</span><h4>${space.title}</h4><p>${space.desc}</p><div class="space-links">${space.tabs.map(([tab,label]) => `<button type="button" data-tab="${tab}">${label} ${icon('arrow', 13)}</button>`).join('')}</div></article>`).join('')}</div>
      <div class="technology-note"><span>${icon('sparkles', 18)}</span><div><strong>También exploramos tecnología y actualidad.</strong><p>La aplicación original incluye módulos de seguimiento de herramientas y novedades. Los dejamos fuera de esta demo para concentrarnos en lo cotidiano; esta tarjeta no muestra noticias en tiempo real.</p></div><span class="technology-label">FUERA DE LA DEMO</span></div>
    </section>`;
}

function projectView() {
  const categories = ['Todos', 'Trabajo', 'Personal', 'Formación'];
  const visible = projectFilter === 'Todos' ? data.projects : data.projects.filter((item) => item.category === projectFilter);
  const project = data.projects.find((item) => item.id === selectedProject);
  return `
    ${sectionIntro('02 / DE LA IDEA A LA ACCIÓN', 'Proyectos que avanzan.', 'Un lugar para ver lo que estás construyendo y cuál es el próximo paso.')}
    <div class="projects-summary"><div class="summary-icon">${icon('layers', 27)}</div><div><strong>${data.projects.length} proyectos en tu espacio</strong><span>${data.projects.filter((item) => item.status === 'En curso').length} activos · ${data.projects.filter((item) => item.status !== 'En curso').length} en pausa</span></div><span class="summary-detail">UNA SOLA VISTA <span aria-hidden="true">↗</span></span></div>
    <div class="project-filters" aria-label="Filtrar proyectos">${categories.map((category) => `<button type="button" data-filter="${category}" class="filter-button ${projectFilter === category ? 'selected' : ''}" aria-pressed="${projectFilter === category}">${category}</button>`).join('')}</div>
    <div class="projects-grid">${visible.map((item, index) => `<button class="project-card ${selectedProject === item.id ? 'is-selected' : ''}" type="button" data-project="${item.id}" aria-pressed="${selectedProject === item.id}"><div class="project-top"><span class="project-index">${String(index + 1).padStart(2, '0')} / ${item.category.toUpperCase()}</span><span class="project-status ${item.status === 'En curso' ? 'active' : ''}">${item.status}</span></div><span class="project-symbol ${item.color}">${icon(item.id === 'aurora' ? 'sparkles' : item.id === 'boreal' ? 'grid' : 'layers', 27)}</span><h3>${item.name}</h3><p>${item.description}</p><div class="project-progress-header"><span>PROGRESO DE EJEMPLO</span><strong>${item.progress}%</strong></div><div class="progress-track ${item.color}"><span style="width:${item.progress}%"></span></div><div class="project-bottom"><span>${item.completed} de ${item.total} tareas</span><span>${icon('arrow', 18)}</span></div></button>`).join('')}</div>
    ${project && visible.some((item) => item.id === project.id) ? `<section class="project-details"><div><div class="surface-eyebrow">PROYECTO SELECCIONADO</div><h3>${project.name}</h3><p>${project.description}</p></div><div class="detail-item"><span>PRÓXIMO PASO</span><strong>${project.next}</strong></div><div class="detail-item"><span>FECHA OBJETIVO</span><strong>${project.deadline}</strong></div></section>` : '<p class="filter-help">Elegí un proyecto para ver el siguiente paso.</p>'}
    <div class="subtle-tip">${icon('info', 17)} Seleccioná una tarjeta para explorar su información. Los proyectos y porcentajes son ficticios.</div>`;
}

function agendaView() {
  const events = data.agenda.filter((event) => event.day === selectedDay);
  const selected = events.find((event) => event.id === selectedEvent) ?? events[0];
  return `
    ${sectionIntro('03 / TU TIEMPO, CON SENTIDO', 'Espacio para lo importante.', 'Visualizá compromisos y bloques de concentración sin perder perspectiva.')}
    <div class="agenda-layout"><div class="agenda-main"><div class="agenda-toolbar"><div><span class="surface-eyebrow">SEMANA DE EJEMPLO</span><h3>17 — 19 noviembre</h3></div><span class="agenda-badge">${icon('calendar', 15)} Agenda simulada</span></div><div class="day-tabs" role="group" aria-label="Seleccionar día">${days.map((day, index) => `<button type="button" data-day="${index}" class="day-tab ${selectedDay === index ? 'selected' : ''}" aria-pressed="${selectedDay === index}"><small>DÍA ${String(index + 1).padStart(2, '0')}</small><strong>${day}</strong><span>${data.agenda.filter((event) => event.day === index).length} eventos</span></button>`).join('')}</div><div class="timeline"><div class="timeline-heading"><span>HORARIO</span><span>ACTIVIDADES DEL DÍA</span></div>${events.map((event) => `<button class="timeline-row ${selected?.id === event.id ? 'selected' : ''}" type="button" data-event="${event.id}" aria-pressed="${selected?.id === event.id}"><span class="timeline-hour">${event.time}<small>${event.end}</small></span><span class="timeline-card ${event.color}"><span><strong>${event.title}</strong><small>${event.category}</small></span><span class="timeline-chevron">${icon('chevron', 16)}</span></span></button>`).join('')}</div></div><aside class="agenda-side"><div class="agenda-side-kicker">EN DETALLE</div><div class="event-icon ${selected.color}">${icon('calendar', 23)}</div><h3>${selected.title}</h3><p>${selected.description}</p><div class="event-meta"><div>${icon('clock', 17)}<span>${selected.time} — ${selected.end}</span></div><div>${icon('layers', 17)}<span>${selected.category}</span></div><div>${icon('calendar', 17)}<span>${days[selectedDay]}</span></div></div><div class="agenda-side-foot">Los eventos son solo de ejemplo. Ningún calendario está conectado.</div></aside></div>`;
}

function announce(message) {
  announcement.textContent = message;
}

function render() {
  panel.innerHTML = currentTab === 'hoy'
    ? todayView()
    : currentTab === 'proyectos'
      ? projectView()
      : currentTab === 'agenda'
        ? agendaView()
        : moduleView(currentTab, data, { icon, sectionIntro, ui });
  document.querySelectorAll('.main-nav .nav-item').forEach((button) => {
    const active = button.dataset.tab === currentTab;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.querySelector('#breadcrumb-current').textContent = labels[currentTab];
  const mobile = document.querySelector('#mobile-nav');
  if (mobile) mobile.value = currentTab;
}

function changeTab(tab) {
  if (!tabs.has(tab)) return;
  currentTab = tab;
  if (location.hash !== `#${tab}`) history.replaceState(null, '', `#${tab}`);
  render();
  document.querySelector('#panel .section-heading h2')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  announce(`Sección ${labels[tab]}`);
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('button, a');
  if (!target) return;
  if (target.dataset.tab) { changeTab(target.dataset.tab); return; }
  if (target.classList.contains('brand')) { event.preventDefault(); changeTab('hoy'); return; }
  if (target.dataset.action === 'reset') {
    data = structuredClone(initialData);
    projectFilter = 'Todos'; selectedProject = 'aurora'; selectedDay = 0; selectedEvent = 'plan';
    ui = { ...initialUi };
    currentTab = 'hoy';
    history.replaceState(null, '', '#hoy');
    render(); announce('Demo reiniciada. Todas las acciones volvieron a su estado inicial.');
    return;
  }
  if (target.dataset.filter) {
    projectFilter = target.dataset.filter;
    const visible = data.projects.filter((item) => projectFilter === 'Todos' || item.category === projectFilter);
    if (!visible.some((item) => item.id === selectedProject)) selectedProject = visible[0]?.id ?? '';
    render(); announce(`Filtro de proyectos: ${projectFilter}`);
    return;
  }
  if (target.dataset.project) {
    selectedProject = target.dataset.project; render();
    announce(`Proyecto ${data.projects.find((item) => item.id === selectedProject)?.name ?? ''} seleccionado`);
    return;
  }
  if (target.dataset.day) {
    selectedDay = Number(target.dataset.day);
    selectedEvent = data.agenda.find((item) => item.day === selectedDay)?.id ?? '';
    render(); announce(`Agenda de ${days[selectedDay]}`); return;
  }
  if (target.dataset.event) {
    selectedEvent = target.dataset.event; render();
    announce(`Detalle de ${data.agenda.find((item) => item.id === selectedEvent)?.title ?? ''}`);
    return;
  }
  if (target.dataset.healthMetric) {
    ui.healthMetric = target.dataset.healthMetric; render(); announce(`Indicador: ${ui.healthMetric}`); return;
  }
  if ('gymToggle' in target.dataset) {
    data.gym.completed = !data.gym.completed; render(); announce(data.gym.completed ? 'Sesión marcada como completa' : 'Sesión marcada como pendiente'); return;
  }
  if (target.dataset.nutritionDay) {
    ui.nutritionDay = Number(target.dataset.nutritionDay); ui.mealOpen = ''; render(); announce(`Comidas de ${data.nutrition.days[ui.nutritionDay].label}`); return;
  }
  if (target.dataset.meal) {
    ui.mealOpen = ui.mealOpen === target.dataset.meal ? '' : target.dataset.meal; render(); return;
  }
  if (target.dataset.deck) {
    ui.deck = target.dataset.deck; ui.cardIndex = 0; ui.cardFlipped = false; render(); announce(`Mazo ${data.decks.find((d) => d.id === ui.deck)?.title}`); return;
  }
  if ('flip' in target.dataset) {
    ui.cardFlipped = !ui.cardFlipped; render(); announce(ui.cardFlipped ? 'Respuesta revelada' : 'Pregunta visible'); return;
  }
  if ('nextCard' in target.dataset) {
    const deck = data.decks.find((d) => d.id === ui.deck);
    ui.cardIndex = (ui.cardIndex + 1) % deck.cards.length; ui.cardFlipped = false; render(); announce('Siguiente tarjeta'); return;
  }
  if (target.dataset.englishAnswer && !ui.englishAnswer) {
    ui.englishAnswer = target.dataset.englishAnswer; render(); announce(ui.englishAnswer === data.english.questions[ui.englishIndex].correct ? 'Respuesta correcta' : 'Respuesta incorrecta, con explicación'); return;
  }
  if ('nextEnglish' in target.dataset) {
    ui.englishIndex = (ui.englishIndex + 1) % data.english.questions.length; ui.englishAnswer = ''; render(); announce('Siguiente pregunta de inglés'); return;
  }
  if (target.dataset.financeCategory) {
    ui.financeCategory = ui.financeCategory === target.dataset.financeCategory ? '' : target.dataset.financeCategory; render(); return;
  }
  if (target.dataset.moviesFilter) {
    ui.moviesFilter = target.dataset.moviesFilter; render(); announce(`Películas: ${ui.moviesFilter}`); return;
  }
  if (target.dataset.movieToggle) {
    const movie = data.movies.find((item) => item.id === target.dataset.movieToggle);
    if (movie) { movie.watched = !movie.watched; movie.rating = movie.watched ? 4 : null; render(); announce(`${movie.title}: ${movie.watched ? 'vista' : 'por ver'}`); }
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'mobile-nav') { changeTab(target.value); return; }
  if (!(target instanceof HTMLInputElement)) return;
  if (target.dataset.habitCheck) {
    const habit = data.habits.find((item) => item.id === target.dataset.habitCheck);
    if (habit) { habit.done = target.checked; render(); announce(`${habit.label}: ${habit.done ? 'completado' : 'pendiente'}`); }
  }
  if (target.dataset.taskCheck) {
    const task = data.tasks.find((item) => item.id === target.dataset.taskCheck);
    if (task) { task.done = target.checked; render(); announce(`${task.label}: ${task.done ? 'completada' : 'pendiente'}`); }
  }
  if (target.dataset.shoppingCheck) {
    const item = data.shopping.find((entry) => entry.id === target.dataset.shoppingCheck);
    if (item) { item.checked = target.checked; render(); announce(`${item.name}: ${item.checked ? 'en la compra' : 'pendiente'}`); }
  }
});

window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1);
  if (tabs.has(tab)) { currentTab = tab; render(); }
});

renderStaticIcons();
render();
