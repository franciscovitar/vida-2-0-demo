/**
 * Vistas de la demo pública (solo plantillas). Este módulo no importa código de
 * la aplicación personal y nunca lee red, almacenamiento ni el navegador.
 */
import { icon } from './icons.js';
import {
  AREAS, LABELS, areaOfTab, areaProgress, average, dayNutrition, eventStatus, financeSummary,
  formatDecimal, formatMoney, formatNumber, gymSummary, habitArea, healthDeltas, parseExercise,
  signed, taskArea, toMinutes,
} from './logic.js';

const LONG_DAY = { 'Mié': 'miércoles', Jue: 'jueves', Vie: 'viernes', 'Sáb': 'sábado', Dom: 'domingo', Lun: 'lunes', Hoy: 'hoy' };
const AGENDA_DAYS = [
  { short: 'Mar', num: 17, title: 'Hoy, martes 17' },
  { short: 'Mié', num: 18, title: 'Miércoles 18' },
  { short: 'Jue', num: 19, title: 'Jueves 19' },
];
const COLOR_AREA = { violet: 'org', blue: 'org', green: 'care', amber: 'learn' };

/** Valores dinámicos: se aplican como variables CSS desde app.js (compatible con la CSP). */
const vars = (entries) => `data-vars="${Object.entries(entries).map(([k, v]) => `--${k}:${v}`).join(';')}"`;
const pct = (value) => `${Math.max(0, Math.min(100, Math.round(value)))}%`;

function pageHead(kicker, title, lead = '') {
  return `<header class="page-head"><p class="kicker">${kicker}</p><h1 tabindex="-1">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</header>`;
}

function note(text) {
  return `<p class="note">${icon('info', 16)}<span>${text}</span></p>`;
}

function segments(done, total, area) {
  return `<span class="segments a-${area}" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<span class="${i < done ? 'on' : ''}"></span>`).join('')}</span>`;
}

function ring(done, total, size = 60, stroke = 7, label = '') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = total ? (c * done) / total : 0;
  return `<span class="ring"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}"><circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/><circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${filled.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><span class="ring-label mono">${done}/${total}</span></span>`;
}

function taskRow(task) {
  const area = taskArea(task);
  return `<li><label class="check-row ${task.done ? 'is-done' : ''}"><input class="check-input" type="checkbox" data-task-check="${task.id}" ${task.done ? 'checked' : ''}/><span class="check-box" aria-hidden="true">${icon('check', 14)}</span><span class="check-text"><span class="check-label">${task.label}</span><span class="check-meta">${task.project} · ${task.category}</span></span><span class="check-tags"><span class="tag a-${area}">${AREAS[area].name}</span><span class="tag ${task.priority === 'Alta' ? 'tag-high' : ''}">${task.priority}</span></span></label></li>`;
}

function habitChip(habit) {
  const area = habitArea(habit);
  return `<label class="habit a-${area} ${habit.done ? 'is-on' : ''}"><input class="sr-input" type="checkbox" data-habit-check="${habit.id}" ${habit.done ? 'checked' : ''}/><span class="habit-mark" aria-hidden="true">${icon('check', 14)}</span><span>${habit.label}</span></label>`;
}

/* ───────────────────────────── Hoy ───────────────────────────── */

const TOUR = [
  'Marcá una tarea del foco: el anillo y tus áreas se actualizan al instante.',
  'Bajá a «Tu día en cuatro áreas»: cada hábito suma al área a la que pertenece.',
  'Abrí un área para explorar Salud, Finanzas o Aprender. Todo es interactivo y se reinicia cuando quieras.',
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

function saludView(data, ui) {
  const { health } = data;
  const deltas = healthDeltas(data);
  const metrics = {
    sleep: { label: 'Sueño', unit: 'h', values: health.sleepTrend, today: health.sleepHours, fmt: (v) => formatDecimal(v), delta: `${signed(deltas.sleep, 1)} h`, d: deltas.sleep, title: 'Horas de sueño por noche', caption: 'Registro semanal ilustrativo' },
    steps: { label: 'Pasos', unit: 'pasos', values: health.stepsTrend, today: health.steps, fmt: formatNumber, delta: signed(deltas.steps), d: deltas.steps, title: 'Pasos por día', caption: 'Actividad diaria ilustrativa' },
    activity: { label: 'Minutos activos', unit: 'min', values: health.activityTrend, today: health.activeMinutes, fmt: formatNumber, delta: `${signed(deltas.activity)} min`, d: deltas.activity, title: 'Minutos de actividad', caption: 'Movimiento semanal ilustrativo' },
  };
  const m = metrics[ui.healthMetric] ?? metrics.sleep;
  const avg = average(m.values);
  const max = Math.max(...m.values) * 1.08;
  const labels = health.trendLabels;
  const above = Object.values(metrics).filter((x) => x.d > 0).length;
  const lead = above === 3 ? 'Hoy estás por encima de tu promedio en sueño, pasos y actividad.' : `Hoy superás tu promedio en ${above} de 3 indicadores.`;
  const maxIdx = m.values.indexOf(Math.max(...m.values));
  const minIdx = m.values.indexOf(Math.min(...m.values));
  const insight = {
    sleep: `Dormiste más de 7 horas en ${m.values.filter((v) => v > 7).length} de las últimas 7 noches. Tu mejor descanso fue el ${LONG_DAY[labels[maxIdx]]}.`,
    steps: `El día con más pasos fue el ${LONG_DAY[labels[maxIdx]]} (${formatNumber(m.values[maxIdx])}). El más quieto, el ${LONG_DAY[labels[minIdx]]}.`,
    activity: `${m.values.filter((v) => v > 40).length} días por encima de 40 minutos. Hoy estás ${m.today >= avg ? 'sobre' : 'debajo de'} tu promedio.`,
  }[ui.healthMetric] ?? '';

  return `${pageHead('Últimos 7 días', 'Tu bienestar, de un vistazo.', lead)}
    <div class="metric-tabs" role="group" aria-label="Elegir indicador">${Object.entries(metrics).map(([key, x]) => `
      <button type="button" class="metric-tab a-care" data-health-metric="${key}" aria-pressed="${ui.healthMetric === key}">
        <span class="metric-top"><span>${x.label}</span><span class="delta ${x.d >= 0 ? 'up' : 'down'}">${x.delta} vs. prom.</span></span>
        <span class="metric-value mono">${x.fmt(x.today)}<small> ${x.unit}</small></span>
      </button>`).join('')}
    </div>
    <div class="split">
      <section class="card" aria-labelledby="chart-title">
        <div class="card-head"><h2 id="chart-title">${m.title}</h2><span class="legend"><span class="legend-dash" aria-hidden="true"></span>Tu promedio: ${m.fmt(Number(avg.toFixed(1)))} ${m.unit}</span></div>
        <div class="bars a-care" role="img" aria-label="${m.title}. Hoy ${m.fmt(m.today)} ${m.unit}; promedio ${m.fmt(Number(avg.toFixed(1)))}." ${vars({ 'avg-n': (avg / max).toFixed(3) })}>
          <span class="avg-line" aria-hidden="true"></span>
          ${m.values.map((v, i) => `<span class="bar-col ${i === m.values.length - 1 ? 'is-today' : v >= avg ? 'is-above' : ''}"><span class="bar-fill" ${vars({ h: pct((v / max) * 100) })}><span class="bar-val mono">${m.fmt(v)}</span></span><span class="bar-day">${labels[i]}</span></span>`).join('')}
        </div>
        <p class="caption">${m.caption} · Cambiá el indicador para comparar otra serie.</p>
      </section>
      <aside class="stack">
        <div class="card"><p class="eyebrow a-care">Pulso en reposo</p><p class="big mono">${health.restingPulse}<small> lpm</small></p><p class="muted">Valor de hoy. La demo no incluye historial de pulso, así que no se muestra tendencia.</p></div>
        <div class="card"><p class="eyebrow">Lectura de la semana</p><p>${insight}</p><p class="muted small">Comparado contra tu propio promedio de 7 días.</p></div>
      </aside>
    </div>
    ${note('Valores inventados para mostrar la interfaz. No son recomendaciones ni interpretaciones médicas.')}`;
}

function gimnasioView(data, ui) {
  const summary = gymSummary(data, ui.gymSets);
  const max = Math.max(...data.gym.volume);
  return `${pageHead('Sesión de hoy', 'Progresá a tu ritmo.', `${data.gym.exercises.length} ejercicios · ${summary.total} series. Marcá cada serie a medida que la terminás.`)}
    <div class="gym-top card">
      <div><p class="eyebrow">Esta semana</p><p class="big mono">${summary.sessions}/${summary.goal}<small> sesiones</small></p></div>
      ${segments(summary.sessions, summary.goal, 'care')}
      <button type="button" class="btn ${data.gym.completed ? 'btn-ghost' : 'btn-dark'}" data-gym-toggle>${data.gym.completed ? `${icon('reset', 16)} Marcar como pendiente` : `${icon('check', 16)} Terminar sesión`}</button>
    </div>
    ${data.gym.completed ? `<p class="banner a-care" role="status"><strong>${summary.sessions >= summary.goal ? 'Meta semanal cumplida.' : 'Sesión guardada.'}</strong> ${summary.done} de ${summary.total} series · ${formatNumber(summary.lifted)} kg levantados (peso × repeticiones).</p>` : ''}
    <div class="exercise-grid">${data.gym.exercises.map((exercise) => {
      const p = parseExercise(exercise);
      return `<section class="card exercise" aria-labelledby="ex-${exercise.id}">
        <div class="card-head"><h2 id="ex-${exercise.id}">${exercise.name}</h2><span class="tag a-care">${exercise.muscle}</span></div>
        <div class="set-head kicker" aria-hidden="true"><span>Serie</span><span>Peso</span><span>Reps</span><span></span></div>
        <ul class="sets">${Array.from({ length: p.sets }, (_, i) => {
          const key = `${exercise.id}-${i + 1}`;
          const done = Boolean(ui.gymSets[key]);
          return `<li class="set ${done ? 'is-done' : ''}"><span class="mono">${i + 1}</span>${p.kg ? `<span class="mono">${exercise.weight}</span>` : '<span>Corporal</span>'}<span class="mono">${p.reps}</span><button type="button" class="set-btn" data-gym-set="${key}" aria-pressed="${done}" aria-label="Serie ${i + 1} de ${exercise.name}">${icon('check', 16)}</button></li>`;
        }).join('')}</ul>
      </section>`;
    }).join('')}
    </div>
    <section class="card" aria-labelledby="volume-title">
      <div class="card-head"><h2 id="volume-title">Volumen · últimas 6 semanas</h2><span class="muted mono">${data.gym.volume[0]} → ${data.gym.volume.at(-1)} (índice)</span></div>
      <div class="mini-bars a-care" role="img" aria-label="Índice de volumen de ${data.gym.volume[0]} a ${data.gym.volume.at(-1)} en seis semanas">${data.gym.volume.map((v, i) => `<span class="${i === data.gym.volume.length - 1 ? 'is-today' : ''}" ${vars({ h: pct((v / max) * 100) })}></span>`).join('')}</div>
    </section>
    ${note('Rutina y pesos ficticios. No son una prescripción de entrenamiento.')}`;
}

function nutricionView(data, ui) {
  const day = data.nutrition.days[ui.nutritionDay];
  const n = dayNutrition(day);
  const target = data.nutrition.targetCalories;
  const r = 54;
  const c = 2 * Math.PI * r;
  const left = target - n.calories;
  const macros = [['Proteínas', n.protein, n.shares.protein, 'm1'], ['Carbohidratos', n.carbs, n.shares.carbs, 'm2'], ['Grasas', n.fats, n.shares.fats, 'm3']];
  return `${pageHead('Diario de comidas', 'Comer con más claridad.', 'Un diario sencillo: comidas por momento del día y cómo se reparten las calorías.')}
    <div class="chips" role="group" aria-label="Elegir día">${data.nutrition.days.map((d, i) => `<button type="button" class="chip-btn" data-nutrition-day="${i}" aria-pressed="${ui.nutritionDay === i}">${d.label}</button>`).join('')}</div>
    <div class="split">
      <section class="card nutrition-summary a-care" aria-label="Resumen del día">
        <span class="kcal-ring"><svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label="${formatNumber(n.calories)} de ${formatNumber(target)} kcal"><circle class="ring-track" cx="66" cy="66" r="${r}" stroke-width="12"/><circle class="ring-fill" cx="66" cy="66" r="${r}" stroke-width="12" stroke-dasharray="${(c * Math.min(1, n.calories / target)).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 66 66)"/></svg><span><strong class="mono">${formatNumber(n.calories)}</strong><small>de ${formatNumber(target)} kcal</small></span></span>
        <div class="macros">${macros.map(([label, g, share, cls]) => `<div class="macro ${cls}"><span class="macro-top"><span>${label}</span><span class="mono">${g} g</span></span><span class="bar" ${vars({ w: `${share}%` })}><span></span></span></div>`).join('')}<p class="muted small">Barras: % de las calorías del día · ${left > 0 ? `quedan ${formatNumber(left)} kcal` : 'objetivo alcanzado'}</p></div>
      </section>
      <section class="card flush" aria-labelledby="meals-title">
        <div class="card-head padded"><h2 id="meals-title">Diario de comidas</h2><span class="muted">${day.meals.length} registros</span></div>
        <ul class="meals">${day.meals.map((meal) => {
          const open = ui.mealOpen === meal.id;
          return `<li><button type="button" class="meal" data-meal="${meal.id}" aria-expanded="${open}"><span class="mono meal-time">${meal.time}</span><span class="meal-text"><small>${meal.type}</small><strong>${meal.title}</strong></span><span class="mono meal-kcal">${meal.calories}<small>kcal</small></span>${icon('chevron', 16)}</button>${open ? `<dl class="meal-macros"><div><dt>Proteínas</dt><dd class="mono">${meal.protein} g</dd></div><div><dt>Carbohidratos</dt><dd class="mono">${meal.carbs} g</dd></div><div><dt>Grasas</dt><dd class="mono">${meal.fats} g</dd></div></dl>` : ''}</li>`;
        }).join('')}</ul>
        <p class="card-foot padded">Tocá una comida para ver sus macronutrientes.</p>
      </section>
    </div>
    ${note('Comidas, valores y objetivos completamente ficticios. Esta demo no ofrece asesoramiento nutricional.')}`;
}

/* ─────────────────────────── Aprender ─────────────────────────── */

function mazosView(data, ui) {
  const deck = data.decks.find((d) => d.id === ui.deck) ?? data.decks[0];
  const card = deck.cards[ui.cardIndex % deck.cards.length];
  const flipped = ui.cardFlipped;
  return `${pageHead('Repaso manual', 'Aprender, recordar, crecer.', 'Mazos pequeños para practicar con recuperación activa: pensá la respuesta antes de darla vuelta.')}
    <div class="deck-grid" role="group" aria-label="Elegir mazo">${data.decks.map((d) => `<button type="button" class="deck a-learn" data-deck="${d.id}" aria-pressed="${deck.id === d.id}"><strong>${d.title}</strong><small>${d.topic} · ${d.cards.length} tarjetas</small></button>`).join('')}</div>
    <div class="study">
      <button type="button" class="flash ${flipped ? 'is-flipped' : ''}" data-flip aria-label="${flipped ? 'Volver a la pregunta' : 'Revelar respuesta'}">
        <span class="flash-top"><span>${flipped ? 'Respuesta' : 'Pregunta'}</span><span class="mono">${ui.cardIndex + 1} / ${deck.cards.length}</span></span>
        <span class="flash-text">${flipped ? card.back : card.front}</span>
        <span class="flash-hint">${flipped ? 'Tocá para volver a la pregunta' : 'Tocá la tarjeta para ver la respuesta'}</span>
      </button>
      <div class="study-actions"><button type="button" class="btn btn-outline" data-card-again>Repetir</button><button type="button" class="btn btn-learn" data-next-card>La sabía</button></div>
      <div class="study-foot"><span class="dots" aria-hidden="true">${deck.cards.map((_, i) => `<span class="${i === ui.cardIndex ? 'is-current' : i < ui.cardIndex ? 'is-past' : ''}"></span>`).join('')}</span><span class="muted" role="status">Sabidas <strong class="mono t-learn">${ui.cardKnown}</strong> · Para repetir <strong class="mono t-care">${ui.cardAgain}</strong></span></div>
    </div>
    ${note('Repaso manual · sin algoritmo de repetición espaciada. Las tarjetas son sintéticas y no hay sincronización con Anki.')}`;
}

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

function finanzasView(data, ui) {
  const f = financeSummary(data);
  const selected = f.categories.find((c) => c.id === ui.financeCategory) ?? f.categories[0];
  const pacePct = Math.round(f.pace * 100);
  const max = Math.max(...data.finances.months);
  return `${pageHead(`Noviembre · día ${data.demoClock.dayOfMonth} de ${data.demoClock.daysInMonth}`, 'Tu dinero, más claro.', '')}
    <div class="money-hero"><p class="hero-number mono">${formatMoney(f.available)}<span> disponibles</span></p><p class="muted">de ${formatMoney(f.budget)} presupuestados · ingreso del mes ${formatMoney(f.income)}</p>
      <div class="seg-control" role="group" aria-label="Mostrar">${[['left', 'Disponible'], ['spent', 'Gastado']].map(([id, label]) => `<button type="button" data-finance-mode="${id}" aria-pressed="${ui.financeMode === id}">${label}</button>`).join('')}</div>
    </div>
    <div class="split">
      <section class="card" aria-labelledby="cats-title">
        <div class="card-head"><h2 id="cats-title">Categorías</h2><span class="legend"><span class="legend-tick" aria-hidden="true"></span>Ritmo del mes (${pacePct}%)</span></div>
        <div class="budget-list">${f.categories.map((c) => `
          <button type="button" class="budget ${c.overPace ? 'is-over' : ''}" data-finance-category="${c.id}" aria-pressed="${selected.id === c.id}">
            <span class="budget-top"><strong>${c.name}</strong><span class="mono">${ui.financeMode === 'spent' ? `${formatMoney(c.spent)} gastados` : `${formatMoney(c.left)} libres`}</span></span>
            <span class="budget-bar" ${vars({ w: pct(c.used * 100), pace: `${pacePct}%` })}><span class="fill"></span><span class="pace" aria-hidden="true"></span></span>
            <span class="budget-foot"><span class="status">${c.overPace ? 'Por encima del ritmo' : 'Dentro del ritmo'}</span><span class="mono muted">${Math.round(c.used * 100)}% de ${formatMoney(c.budget)}</span></span>
          </button>`).join('')}
        </div>
      </section>
      <aside class="stack">
        <section class="card a-life" aria-labelledby="cat-detail"><p class="kicker">RESTANTE EN LA CATEGORÍA</p><h2 id="cat-detail">${selected.name}</h2><p class="big mono">${formatMoney(selected.left)}</p>
          <p class="muted">${selected.overPace ? `Usaste ${Math.round(selected.used * 100)}% con el ${pacePct}% del mes transcurrido. Quedan ${f.daysLeft} días: ${formatMoney(selected.perDay)} por día mantiene el plan.` : `Vas dentro del plan. Podés usar ${formatMoney(selected.perDay)} por día durante los ${f.daysLeft} días que quedan.`}</p>
          <dl class="facts three"><div><dt>Presupuesto</dt><dd class="mono">${formatMoney(selected.budget)}</dd></div><div><dt>Gastado</dt><dd class="mono">${formatMoney(selected.spent)}</dd></div><div><dt>Por día</dt><dd class="mono">${formatMoney(selected.perDay)}</dd></div></dl>
        </section>
        <section class="card" aria-labelledby="months-title"><div class="card-head"><h2 id="months-title">Gasto de los últimos 6 meses</h2><span class="muted small">miles de $</span></div>
          <div class="month-bars a-life" role="img" aria-label="Gasto mensual entre ${Math.min(...data.finances.months)} y ${max} mil pesos">${data.finances.months.map((v, i) => `<span class="${i === data.finances.months.length - 1 ? 'is-today' : ''}"><small class="mono">${v}</small><span ${vars({ h: pct((v / max) * 100) })}></span><small>${data.finances.monthLabels[i]}</small></span>`).join('')}</div>
        </section>
      </aside>
    </div>
    ${note('Importes totalmente ficticios y orientados a demostración. No hay conexión con bancos ni asesoramiento financiero.')}`;
}

function comprasView(data) {
  const checked = data.shopping.filter((i) => i.checked).length;
  const groups = [...new Set(data.shopping.map((i) => i.category))];
  return `${pageHead('Lista de la semana', 'Compras sin olvidos.', `${data.shopping.length - checked} por comprar · ${checked} de ${data.shopping.length} productos marcados`)}
    <span class="bar bar-lg a-life" ${vars({ w: pct((checked / data.shopping.length) * 100) })}><span></span></span>
    <div class="shop-grid">${groups.map((g) => `<section class="card" aria-labelledby="g-${g}"><h2 id="g-${g}" class="eyebrow">${g}</h2><ul class="check-list">${data.shopping.filter((i) => i.category === g).map((i) => `<li><label class="check-row a-life ${i.checked ? 'is-done' : ''}"><input class="check-input" type="checkbox" data-shopping-check="${i.id}" ${i.checked ? 'checked' : ''}/><span class="check-box" aria-hidden="true">${icon('check', 14)}</span><span class="check-text"><span class="check-label">${i.name}</span></span><span class="muted">${i.amount}</span></label></li>`).join('')}</ul></section>`).join('')}</div>
    ${note('No se realizan compras ni pedidos. Los cambios se pierden al recargar.')}`;
}

function peliculasView(data, ui) {
  const watched = data.movies.filter((m) => m.watched).length;
  const options = [['Todas', data.movies.length], ['Por ver', data.movies.length - watched], ['Vistas', watched]];
  const visible = data.movies.filter((m) => ui.moviesFilter === 'Todas' || (ui.moviesFilter === 'Por ver' ? !m.watched : m.watched));
  return `${pageHead('Títulos y carteles inventados', 'Tus historias favoritas.', `${data.movies.length} títulos · ${watched} vistos`)}
    <div class="chips" role="group" aria-label="Filtrar películas">${options.map(([o, n]) => `<button type="button" class="chip-btn" data-movies-filter="${o}" aria-pressed="${ui.moviesFilter === o}">${o} <span class="mono">${n}</span></button>`).join('')}</div>
    <div class="movie-grid">${visible.map((m) => `
      <article class="movie">
        <div class="poster poster-${m.color}" aria-hidden="true"><span class="mono">${m.year}</span><strong>${m.title}</strong></div>
        <h2 class="sr-only">${m.title}</h2>
        <p class="muted small">${m.genre} · ${m.watched ? (m.rating ? `${m.rating}/5` : 'vista') : 'por ver'}</p>
        <button type="button" class="btn ${m.watched ? 'btn-life' : 'btn-outline'} btn-block" data-movie-toggle="${m.id}" aria-pressed="${m.watched}">${m.watched ? `${icon('check', 16)} Vista` : 'Marcar como vista'}</button>
      </article>`).join('')}
    </div>
    ${visible.length ? '' : '<p class="empty">No hay películas en este filtro.</p>'}
    ${note('Títulos y carteles inventados para esta demo. No hay integración con catálogos ni streaming.')}`;
}

const VIEWS = {
  hoy: hoyView, tareas: tareasView, proyectos: proyectosView, agenda: agendaView,
  salud: saludView, gimnasio: gimnasioView, nutricion: nutricionView,
  mazos: mazosView, ingles: inglesView,
  finanzas: finanzasView, compras: comprasView, peliculas: peliculasView,
};

/** Barra de sub-módulos del área actual (segmentos en mobile y desktop). */
export function areaNav(tab) {
  const key = areaOfTab(tab);
  if (!key) return '';
  const area = AREAS[key];
  return `<nav class="subnav a-${key}" aria-label="${area.name}"><span class="subnav-area"><span class="dot" aria-hidden="true"></span>${area.name}</span><span class="seg-control">${area.tabs.map((t) => `<button type="button" data-tab="${t}" ${t === tab ? 'aria-current="page"' : ''}>${LABELS[t]}</button>`).join('')}</span></nav>`;
}

export function moduleView(tab, data, ui) {
  const view = VIEWS[tab];
  if (!view) throw new Error(`Unknown public showcase module: ${tab}`);
  return areaNav(tab) + view(data, ui);
}
