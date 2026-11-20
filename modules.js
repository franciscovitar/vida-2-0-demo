/**
 * Vistas de la demo pública (solo plantillas). Este módulo no importa código de
 * la aplicación personal y nunca lee red, almacenamiento ni el navegador.
 */
import { icon } from './icons.js';
import { esc, note, pageHead, pct, ring, segments, vars } from './src/views/ui.js';
import { gymView } from './src/views/gym.js';
import { nutritionView } from './src/views/nutrition.js';
import { systemView } from './src/views/system.js';
import {
  AREAS, LABELS, areaOfTab, areaProgress, average, eventStatus, financeSummary,
  formatDecimal, formatMoney, formatNumber, habitArea, healthDeltas,
  signed, taskArea, toMinutes,
} from './logic.js';

const LONG_DAY = { 'Mié': 'miércoles', Jue: 'jueves', Vie: 'viernes', 'Sáb': 'sábado', Dom: 'domingo', Lun: 'lunes', Hoy: 'hoy' };
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
  const months = [...data.finances.months.slice(0, -1), Math.round(f.spent / 1000)];
  const max = Math.max(...months);
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
          <div class="month-bars a-life" role="img" aria-label="Gasto mensual entre ${Math.min(...months)} y ${max} mil pesos">${months.map((v, i) => `<span class="${i === months.length - 1 ? 'is-today' : ''}"><small class="mono">${v}</small><span ${vars({ h: pct((v / max) * 100) })}></span><small>${data.finances.monthLabels[i]}</small></span>`).join('')}</div>
          <p class="caption">Noviembre se recalcula con cada gasto que registres.</p>
        </section>
        <section class="card" aria-labelledby="mov-title"><div class="card-head"><h2 id="mov-title">Movimientos de esta visita</h2><button type="button" class="link-btn" data-open-capture="expense">Registrar gasto ${icon('arrow', 14)}</button></div>
          ${data.finances.movements.length ? `<ul class="movements">${data.finances.movements.map((m) => `<li><span><strong>${esc(m.description)}</strong><small>${esc(f.categories.find((c) => c.id === m.categoryId)?.name ?? '')}</small></span><span class="mono">−${formatMoney(m.amount)}</span></li>`).join('')}</ul>` : '<p class="empty-state">Todavía no registraste gastos. Probá con «Gasté 12.500 en el supermercado» desde Registrar.</p>'}
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
  salud: saludView, gimnasio: gymView, nutricion: nutritionView,
  mazos: mazosView, ingles: inglesView,
  finanzas: finanzasView, compras: comprasView, peliculas: peliculasView,
  sistema: (data, ui) => systemView(ui),
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
