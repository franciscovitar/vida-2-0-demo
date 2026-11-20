/**
 * Vistas de la demo pública (solo plantillas). Este módulo no importa código de
 * la aplicación personal y nunca lee red, almacenamiento ni el navegador.
 */
import { icon } from './icons.js';
import { esc, note, pageHead, ring, segments, vars } from './src/views/ui.js';
import { gymView } from './src/views/gym.js';
import { nutritionView } from './src/views/nutrition.js';
import { systemView } from './src/views/system.js';
import { financeView } from './src/views/finance.js';
import { healthView } from './src/views/health.js';
import { mediaView } from './src/views/media.js';
import { shoppingView } from './src/views/shopping.js';
import { studyView } from './src/views/study.js';
import { infoView } from './src/views/info.js';
import { AREAS, LABELS, areaOfTab, areaProgress, eventStatus, habitArea, taskArea, toMinutes } from './logic.js';

const AGENDA_DAYS = [
  { short: 'Mar', num: 17, title: 'Hoy, martes 17' },
  { short: 'Mié', num: 18, title: 'Miércoles 18' },
  { short: 'Jue', num: 19, title: 'Jueves 19' },
];
const COLOR_AREA = { violet: 'org', blue: 'org', green: 'care', amber: 'learn' };

function taskRow(task) {
  const area = taskArea(task);
  return `<li><label class="check-row ${task.done ? 'is-done' : ''}"><input class="check-input" type="checkbox" data-task-check="${task.id}" ${task.done ? 'checked' : ''}/><span class="check-box" aria-hidden="true">${icon('check', 14)}</span><span class="check-text"><span class="check-label">${esc(task.label)}</span><span class="check-meta">${esc(task.project)} · ${esc(task.category)}</span></span><span class="check-tags"><span class="tag a-${area}">${AREAS[area].name}</span><span class="tag ${task.priority === 'Alta' ? 'tag-high' : ''}">${task.priority}</span></span></label></li>`;
}

function habitChip(habit) {
  const area = habitArea(habit);
  return `<label class="habit a-${area} ${habit.done ? 'is-on' : ''}"><input class="sr-input" type="checkbox" data-habit-check="${habit.id}" ${habit.done ? 'checked' : ''}/><span class="habit-mark" aria-hidden="true">${icon('check', 14)}</span><span>${habit.label}</span></label>`;
}

/* ───────────────────────────── Hoy ───────────────────────────── */

const TOUR = [
  'Marcá una tarea del foco: el anillo y tus áreas se actualizan al instante.',
  'Bajá a «Tu día en cuatro áreas»: cada hábito suma al área a la que pertenece.',
  'Probá «Registrar»: contá un entrenamiento o una comida y mirá cómo cambian Gimnasio, Nutrición y tus áreas.',
];

function hoyView(data, ui) {
  const tasksDone = data.tasks.filter((t) => t.done).length;
  const remaining = data.tasks.length - tasksDone;
  const habitsDone = data.habits.filter((h) => h.done).length;
  const today = data.agenda.filter((event) => event.day === 0);
  const next = today.find((event) => eventStatus(event, data.demoClock) === 'next');
  const headline = remaining === 0
    ? 'Foco cumplido. Lo que queda del día es tuyo.'
    : `${remaining} ${remaining === 1 ? 'tarea queda' : 'tareas quedan'} para tu foco${next ? ` · ${next.title.toLowerCase()} a las ${next.time}` : ''}.`;
  const areas = areaProgress(data, ui);

  return `
    ${ui.tourOpen ? `<section class="tour" aria-label="Recorrido de la demo"><span class="kicker">Recorrido · ${ui.tourStep + 1} de 3</span><p>${TOUR[ui.tourStep]}</p><div class="tour-actions"><button type="button" class="btn btn-light" data-tour="next">${ui.tourStep === 2 ? 'Listo' : 'Siguiente'}</button><button type="button" class="icon-btn icon-btn-dark" data-tour="close" aria-label="Cerrar recorrido">${icon('close', 16)}</button></div></section>` : ''}
    ${pageHead(`${data.dateLabel.replace(/^(\w+), /u, '$1 ').replace(/ DE 2026$/, '')} · ${data.demoClock.time}`, `Buen día, ${data.persona}.`, headline)}
    <div class="cta-row">
      <button type="button" class="card cta-card is-primary" data-open-capture="" aria-haspopup="dialog"><span class="cta-icon" aria-hidden="true">${icon('plus', 20)}</span><span><strong>Registrar algo</strong><small>Contalo como lo dirías: «press de pecho, 3 series de 10 con 35 kilos»</small></span></button>
      <button type="button" class="card cta-card" data-tab="sistema"><span class="cta-icon is-soft" aria-hidden="true">${icon('code', 20)}</span><span><strong>Cómo funciona Vida 2.0</strong><small>De una conversación con ChatGPT a la fuente de verdad</small></span></button>
    </div>
    <div class="today-grid">
      <section class="card focus a-org" aria-labelledby="focus-title">
        <div class="focus-head"><div><p class="eyebrow">Foco de hoy</p><h2 id="focus-title">${data.focus}</h2></div>${ring(tasksDone, data.tasks.length, 60, 7, `${tasksDone} de ${data.tasks.length} tareas completadas`)}</div>
        <ul class="check-list">${data.tasks.map(taskRow).join('')}</ul>
        <p class="card-foot">${remaining} pendientes · los cambios viven en memoria</p>
      </section>
      <section class="card day-agenda" aria-labelledby="agenda-today">
        <div class="card-head"><h2 id="agenda-today">Agenda de hoy</h2><button type="button" class="link-btn" data-tab="agenda">Ver agenda ${icon('arrow', 14)}</button></div>
        <ol class="thread">${today.map((event) => {
          const status = eventStatus(event, data.demoClock);
          const area = COLOR_AREA[event.color] ?? 'org';
          const meta = status === 'past' ? `Terminado · ${toMinutes(event.end) - toMinutes(event.time)} min` : status === 'now' ? `Ahora · hasta ${event.end}` : `${toMinutes(event.end) - toMinutes(event.time)} min · ${event.category}`;
          return `<li class="thread-item is-${status} a-${area}"><span class="mono thread-time">${event.time}</span><span class="thread-dot" aria-hidden="true"></span><span class="thread-text"><strong>${event.title}</strong><small>${meta}</small></span></li>`;
        }).join('')}</ol>
      </section>
    </div>
    <section class="card habits-card" aria-labelledby="habits-title">
      <div class="habits-title"><h2 id="habits-title">Hábitos</h2><span class="muted"><span class="mono">${habitsDone}/${data.habits.length}</span> hoy</span></div>
      <div class="habit-row">${data.habits.map(habitChip).join('')}</div>
    </section>
    <section aria-labelledby="areas-title" class="areas">
      <div class="section-head"><h2 id="areas-title">Tu día en cuatro áreas</h2><p class="muted">Cada tarea, hábito o registro suma al área a la que pertenece.</p></div>
      <div class="area-grid">${areas.map((area) => `
        <button type="button" class="card area-tile a-${area.key}" data-tab="${area.tab}" aria-label="${area.name}: ${area.done} de ${area.total} hoy. Abrir ${LABELS[area.tab]}">
          <span class="area-name"><span class="dot" aria-hidden="true"></span>${area.name}<span class="area-open">Abrir ${icon('arrow', 14)}</span></span>
          <span class="area-count"><span class="mono">${area.done}/${area.total}</span> hoy</span>
          ${segments(area.done, area.total, area.key)}
          <span class="area-items">${area.items.map((item) => `<span class="area-item ${item.done ? 'is-done' : item.done === null ? 'is-info' : ''}">${item.done === null ? '' : item.done ? 'Hecho · ' : 'Pendiente · '}${item.label}</span>`).join('')}</span>
          <span class="area-stat"><strong class="mono">${area.stat}</strong><small>${area.statLabel}</small></span>
        </button>`).join('')}
      </div>
    </section>`;
}

/* ─────────────────────────── Organizar ─────────────────────────── */

const TASK_FILTERS = [['all', 'Todas'], ['Producto Aurora', 'Aurora'], ['Sitio Boreal', 'Boreal'], ['Ruta de aprendizaje', 'Aprendizaje']];

function tareasView(data, ui) {
  const open = data.tasks.filter((t) => !t.done).length;
  const visible = data.tasks.filter((t) => ui.taskFilter === 'all' || t.project === ui.taskFilter);
  const habitsDone = data.habits.filter((h) => h.done).length;
  return `${pageHead('Martes 17 de noviembre', 'Lo importante, primero.', `${open} ${open === 1 ? 'tarea abierta' : 'tareas abiertas'} y ${data.habits.length - habitsDone} ${data.habits.length - habitsDone === 1 ? 'hábito' : 'hábitos'} por completar hoy.`)}
    <div class="split">
      <section class="card flush" aria-labelledby="tasks-title">
        <div class="card-head padded"><h2 id="tasks-title">Tareas</h2><div class="chips" role="group" aria-label="Filtrar por proyecto">${TASK_FILTERS.map(([id, label]) => `<button type="button" class="chip-btn" data-task-filter="${id}" aria-pressed="${ui.taskFilter === id}">${label}</button>`).join('')}</div></div>
        ${visible.length ? `<ul class="check-list bordered">${visible.map(taskRow).join('')}</ul>` : '<p class="empty">No hay tareas en este proyecto.</p>'}
      </section>
      <section class="card" aria-labelledby="habits-today">
        <div class="card-head"><h2 id="habits-today">Hábitos de hoy</h2><span class="muted"><span class="mono">${habitsDone}/${data.habits.length}</span></span></div>
        <div class="habit-col">${data.habits.map(habitChip).join('')}</div>
        <p class="card-foot">Cada hábito suma a su área en «Hoy».</p>
      </section>
    </div>
    ${note('Tareas y hábitos de ejemplo. Los cambios se pierden al recargar o al reiniciar la demo.')}`;
}

function proyectosView(data, ui) {
  const categories = ['Todos', 'Trabajo', 'Personal', 'Formación'];
  const visible = ui.projectFilter === 'Todos' ? data.projects : data.projects.filter((p) => p.category === ui.projectFilter);
  const selected = visible.find((p) => p.id === ui.selectedProject);
  const active = data.projects.filter((p) => p.status === 'En curso').length;
  return `${pageHead('Del plan a la acción', 'Proyectos que avanzan.', `${data.projects.length} proyectos · ${active} en curso · ${data.projects.length - active} en pausa`)}
    <div class="chips" role="group" aria-label="Filtrar proyectos">${categories.map((c) => `<button type="button" class="chip-btn" data-filter="${c}" aria-pressed="${ui.projectFilter === c}">${c}</button>`).join('')}</div>
    <div class="project-grid">${visible.map((p) => `
      <button type="button" class="card project ${p.status === 'En curso' ? '' : 'is-paused'}" data-project="${p.id}" aria-pressed="${ui.selectedProject === p.id}">
        <span class="project-top"><strong>${p.name}</strong><span class="tag ${p.status === 'En curso' ? 'a-org' : ''}">${p.status}</span></span>
        <span class="muted">${p.description}</span>
        <span class="bar-line"><span class="bar" ${vars({ w: `${p.progress}%` })}><span></span></span><span class="mono">${p.completed}/${p.total}</span></span>
        <span class="kicker">${p.category} · ${p.deadline === 'SIN FECHA' ? 'Sin fecha' : `Entrega ${p.deadline.toLowerCase()}`}</span>
      </button>`).join('')}
    </div>
    ${selected ? `<section class="card detail-row" aria-label="Proyecto seleccionado"><div><p class="eyebrow">Proyecto seleccionado</p><h2>${selected.name}</h2></div><div><p class="kicker">Próximo paso</p><strong>${selected.next}</strong></div><div><p class="kicker">Progreso</p><strong class="mono">${selected.progress}%</strong></div></section>` : '<p class="empty">Elegí un proyecto para ver el siguiente paso.</p>'}
    ${note('Proyectos y porcentajes ficticios.')}`;
}

function agendaView(data, ui) {
  const events = data.agenda.filter((e) => e.day === ui.selectedDay);
  const selected = events.find((e) => e.id === ui.selectedEvent) ?? events[0];
  const start = 8 * 60;
  const end = 19 * 60;
  const pos = (time) => ((toMinutes(time) - start) / (end - start)) * 100;
  return `${pageHead('17 – 19 de noviembre', 'Espacio para lo importante.', 'Bloques del día en una línea de tiempo. Tocá un evento para ver el detalle.')}
    <div class="split">
      <section class="card" aria-labelledby="days-title">
        <h2 id="days-title" class="sr-only">Días</h2>
        <div class="day-tabs" role="group" aria-label="Elegir día">${AGENDA_DAYS.map((d, i) => `<button type="button" class="day-tab" data-day="${i}" aria-pressed="${ui.selectedDay === i}"><span>${d.short}</span><strong class="mono">${d.num}</strong><small>${data.agenda.filter((e) => e.day === i).length} eventos</small></button>`).join('')}</div>
        <div class="timegrid">
          ${[8, 10, 12, 14, 16, 18].map((h) => `<span class="hour mono" ${vars({ top: `${pos(`${h}:00`).toFixed(2)}%` })}>${String(h).padStart(2, '0')}:00</span>`).join('')}
          ${ui.selectedDay === 0 ? `<span class="now-line" ${vars({ top: `${pos(data.demoClock.time).toFixed(2)}%` })}><span class="sr-only">Hora de la demo ${data.demoClock.time}</span></span>` : ''}
          ${events.map((e) => {
            const short = toMinutes(e.end) - toMinutes(e.time) < 50;
            return `<button type="button" class="block a-${COLOR_AREA[e.color] ?? 'org'} ${short ? 'is-short' : ''}" data-event="${e.id}" aria-pressed="${selected?.id === e.id}" ${vars({ top: `${pos(e.time).toFixed(2)}%`, h: `${(pos(e.end) - pos(e.time)).toFixed(2)}%` })}><strong>${e.title}</strong><span class="mono">${e.time}–${e.end}</span></button>`;
          }).join('')}
        </div>
      </section>
      ${selected ? `<aside class="card event-detail a-${COLOR_AREA[selected.color] ?? 'org'}" aria-label="Detalle del evento"><p class="eyebrow">${selected.category}</p><h2>${selected.title}</h2><p>${selected.description}</p><dl class="facts"><div><dt>Horario</dt><dd class="mono">${selected.time} – ${selected.end}</dd></div><div><dt>Día</dt><dd>${AGENDA_DAYS[ui.selectedDay].title}</dd></div></dl></aside>` : ''}
    </div>
    ${note('Eventos de ejemplo. Ningún calendario está conectado.')}`;
}

/* ─────────────────────────── Cuidarme ─────────────────────────── */

/* ─────────────────────────── Aprender ─────────────────────────── */

function inglesView(data, ui) {
  const q = data.english.questions[ui.englishIndex];
  const answered = ui.englishAnswer !== '';
  const correct = answered && ui.englishAnswer === q.correct;
  return `${pageHead(data.english.unit, 'Cinco minutos para mejorar.', 'Completá la oración. Cada respuesta trae una explicación breve.')}
    <div class="streak a-learn">${icon('star', 20)}<span><strong>${data.english.streak} días</strong> de racha · pregunta ${ui.englishIndex + 1} de ${data.english.questions.length}</span>${segments(ui.englishIndex + (answered ? 1 : 0), data.english.questions.length, 'learn')}</div>
    <section class="card quiz" aria-labelledby="quiz-q">
      <h2 id="quiz-q" class="quiz-prompt">${q.prompt}</h2>
      <div class="choices" role="group" aria-label="Opciones">${q.choices.map((choice) => {
        const state = answered && choice === q.correct ? 'is-correct' : answered && choice === ui.englishAnswer ? 'is-wrong' : '';
        const mark = state === 'is-correct' ? 'Correcta' : state === 'is-wrong' ? 'Tu respuesta' : '';
        return `<button type="button" class="choice ${state}" data-english-answer="${choice}" ${answered ? 'disabled' : ''}><span>${choice}</span>${mark ? `<small>${mark}</small>` : ''}</button>`;
      }).join('')}</div>
      ${answered ? `<div class="feedback ${correct ? 'is-correct' : 'is-wrong'}" role="status"><strong>${correct ? '¡Muy bien!' : `Casi. Seguí practicando: la respuesta es «${q.correct}».`}</strong><p>${q.note}</p></div><button type="button" class="btn btn-dark btn-block" data-next-english>${ui.englishIndex === data.english.questions.length - 1 ? 'Volver a empezar' : 'Siguiente pregunta'}</button>` : ''}
    </section>
    ${note('Preguntas predefinidas, sin IA generativa, evaluación adaptativa ni registro de aprendizaje.')}`;
}

/* ───────────────────────────── Vivir ───────────────────────────── */

const VIEWS = {
  hoy: hoyView, tareas: tareasView, proyectos: proyectosView, agenda: agendaView,
  salud: healthView, gimnasio: gymView, nutricion: nutritionView,
  mazos: studyView, ingles: inglesView, informacion: infoView,
  finanzas: financeView, compras: shoppingView, peliculas: mediaView,
  sistema: (data, ui) => systemView(ui),
};

/** Etiquetas cortas para los segmentos (los nombres completos siguen en la barra lateral y en «Ir a»). */
const SHORT_LABELS = { tareas: 'Tareas', mazos: 'Mazos', informacion: 'Información' };

/** Barra de sub-módulos del área actual (segmentos en mobile y desktop). */
export function areaNav(tab) {
  const key = areaOfTab(tab);
  if (!key) return '';
  const area = AREAS[key];
  return `<nav class="subnav a-${key}" aria-label="${area.name}"><span class="subnav-area"><span class="dot" aria-hidden="true"></span>${area.name}</span><span class="seg-control">${area.tabs.map((t) => `<button type="button" data-tab="${t}" ${t === tab ? 'aria-current="page"' : ''}>${SHORT_LABELS[t] ?? LABELS[t]}</button>`).join('')}</span></nav>`;
}

export function moduleView(tab, data, ui) {
  const view = VIEWS[tab];
  if (!view) throw new Error(`Unknown public showcase module: ${tab}`);
  return areaNav(tab) + view(data, ui);
}
