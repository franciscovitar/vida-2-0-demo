/** Vista Gimnasio: sesión de hoy con registro de series, progreso (e1RM) e historial. Plantillas puras. */
import { formatDecimal, formatNumber, parseExercise } from '../../logic.js';
import { STABLE_BAND, bestSet, e1rmSeries, epley, muscleSets, sessionSummary, setVolume, weeklyVolume } from '../domain/gym.js';
import { esc, fieldError, icon, note, pageHead, pct, segments, shortDate, tabs, vars } from './ui.js';

export const withMeta = (gym) => ({ ...gym, exercises: gym.exercises.map((e) => ({ ...e, ...gym.exerciseMeta[e.id] })) });

const fmtKg = (kg) => `${formatDecimal(kg, Number.isInteger(kg) ? 0 : kg * 4 % 2 ? 2 : 1)} kg`;
const setText = (s) => (s.seconds != null ? `${s.seconds} s` : `${fmtKg(s.kg)} × ${s.reps}`);

function comparisonChip(row) {
  if (row.exercise.mode === 'time') {
    const best = Math.max(0, ...row.sets.map((s) => s.seconds ?? 0));
    const prev = Math.max(0, ...(row.previous?.sets ?? []).map((s) => s.seconds ?? 0));
    if (!best || !prev) return '<span class="chip-cmp is-unknown">Sin comparación todavía</span>';
    return `<span class="chip-cmp ${best > prev ? 'is-up' : best < prev ? 'is-down' : 'is-stable'}">${best} s vs ${prev} s el ${shortDate(row.previous.date)}</span>`;
  }
  const { state, delta } = row.comparison;
  if (state === 'unknown') return '<span class="chip-cmp is-unknown">Registrá una serie para comparar</span>';
  const label = state === 'stable' ? 'Estable' : state === 'up' ? 'Mejor' : 'Menor';
  return `<span class="chip-cmp is-${state}" title="Cambio de e1RM contra la sesión comparable anterior">${label} · ${delta >= 0 ? '+' : '−'}${formatDecimal(Math.abs(delta * 100))} % e1RM vs ${shortDate(row.previous.date)}</span>`;
}

function setRow(exercise, slot, logged, ui) {
  const editing = logged && ui.gymEdit === logged.id;
  const n = slot.n ?? '+';
  if (editing) {
    const err = ui.formErrors[`edit-${logged.id}`] ?? {};
    return `<li class="set is-editing"><form class="set-form" data-capture-form="set-edit" data-set="${logged.id}" data-exercise="${exercise.id}" novalidate>
      <span class="mono">${n}</span>
      ${exercise.mode === 'time'
        ? `<label class="mini-field"><span class="sr-only">Segundos</span><input name="seconds" type="number" inputmode="numeric" min="5" max="600" value="${logged.seconds}" required/></label><span class="muted small">s</span>`
        : `<label class="mini-field"><span class="sr-only">Peso en kg</span><input name="kg" type="number" inputmode="decimal" step="0.25" min="0" max="400" value="${logged.kg}" required/></label><label class="mini-field"><span class="sr-only">Repeticiones</span><input name="reps" type="number" inputmode="numeric" min="1" max="100" value="${logged.reps}" required/></label>`}
      <span class="set-actions"><button type="submit" class="icon-btn icon-btn-ok" aria-label="Guardar serie">${icon('check', 16)}</button><button type="button" class="icon-btn" data-gym-edit="" aria-label="Cancelar edición">${icon('close', 16)}</button></span>
    </form>${fieldError(err, 'kg')}${fieldError(err, 'reps')}${fieldError(err, 'seconds')}</li>`;
  }
  const shown = logged ?? slot;
  const e1 = logged ? epley(logged.kg, logged.reps) : null;
  return `<li class="set ${logged ? 'is-done' : ''}">
    <span class="mono">${n}</span>
    <span class="mono">${shown.seconds != null ? '—' : shown.kg ? fmtKg(shown.kg) : 'Corporal'}</span>
    <span class="mono">${shown.seconds != null ? `${shown.seconds} s` : shown.reps}${e1 ? `<small class="e1rm">e1RM ${formatDecimal(e1)}</small>` : ''}</span>
    <span class="set-actions">
      ${logged ? `<button type="button" class="icon-btn" data-gym-edit="${logged.id}" aria-label="Editar serie ${n} de ${esc(exercise.name)}">${icon('edit', 15)}</button>` : ''}
      ${slot.planned ? `<button type="button" class="set-btn" data-gym-set="${slot.key}" aria-pressed="${Boolean(logged)}" aria-label="Serie ${slot.n} de ${esc(exercise.name)}">${icon('check', 16)}</button>` : `<button type="button" class="icon-btn" data-gym-remove="${logged.id}" aria-label="Eliminar serie extra de ${esc(exercise.name)}">${icon('close', 15)}</button>`}
    </span>
  </li>`;
}

function exerciseCard(row, ui, data) {
  const { exercise } = row;
  const plan = parseExercise(exercise);
  const today = data.gym.today;
  const slots = Array.from({ length: plan.sets }, (_, i) => ({ n: i + 1, key: `${exercise.id}-${i + 1}`, planned: true, kg: plan.kg, reps: plan.repsNumber || null, seconds: exercise.mode === 'time' ? Number.parseInt(plan.reps, 10) : null }));
  const extras = today.filter((s) => s.exerciseId === exercise.id && !s.planned);
  const last = [...today].reverse().find((s) => s.exerciseId === exercise.id) ?? row.previous?.sets.at(-1);
  const err = ui.formErrors[`set-${exercise.id}`] ?? {};
  return `<section class="card exercise" aria-labelledby="ex-${exercise.id}">
    <div class="card-head"><h2 id="ex-${exercise.id}">${esc(exercise.name)}</h2><span class="tag a-care">${exercise.muscle}</span></div>
    <div class="exercise-meta">${comparisonChip(row)}${row.personalRecord ? '<span class="chip-cmp is-record">Récord personal (e1RM)</span>' : ''}</div>
    <div class="set-head kicker" aria-hidden="true"><span>Serie</span><span>${exercise.mode === 'time' ? '' : 'Peso'}</span><span>${exercise.mode === 'time' ? 'Tiempo' : 'Reps'}</span><span></span></div>
    <ul class="sets">
      ${slots.map((slot) => setRow(exercise, slot, today.find((s) => s.id === slot.key), ui)).join('')}
      ${extras.map((s) => setRow(exercise, { n: '+', planned: false }, s, ui)).join('')}
    </ul>
    <form class="inline-add" data-capture-form="set" data-exercise="${exercise.id}" novalidate aria-label="Agregar serie a ${esc(exercise.name)}">
      ${exercise.mode === 'time'
        ? `<label class="mini-field"><span>Segundos</span><input name="seconds" type="number" inputmode="numeric" min="5" max="600" value="${last?.seconds ?? 30}" required/></label>`
        : `<label class="mini-field"><span>Kg</span><input name="kg" type="number" inputmode="decimal" step="0.25" min="0" max="400" value="${last?.kg ?? plan.kg}" required/></label><label class="mini-field"><span>Reps</span><input name="reps" type="number" inputmode="numeric" min="1" max="100" value="${last?.reps ?? plan.repsNumber}" required/></label>`}
      <button type="submit" class="btn btn-outline btn-sm">${icon('check', 15)} Agregar serie</button>
    </form>
    ${fieldError(err, 'kg')}${fieldError(err, 'reps')}${fieldError(err, 'seconds')}
  </section>`;
}

function hoyTab(data, ui, gym, summary) {
  const sessions = data.gym.sessionsThisWeek + (data.gym.completed ? 1 : 0);
  const planned = gym.exercises.reduce((t, e) => t + parseExercise(e).sets, 0);
  return `
    <div class="gym-top card">
      <div><p class="eyebrow">Esta semana</p><p class="big mono">${sessions}/${data.gym.goal}<small> sesiones</small></p></div>
      ${segments(sessions, data.gym.goal, 'care')}
      <button type="button" class="btn ${data.gym.completed ? 'btn-ghost' : 'btn-dark'}" data-gym-toggle>${data.gym.completed ? `${icon('reset', 16)} Marcar como pendiente` : `${icon('check', 16)} Terminar sesión`}</button>
    </div>
    ${data.gym.completed ? `<p class="banner a-care" role="status"><strong>${sessions >= data.gym.goal ? 'Meta semanal cumplida.' : 'Sesión guardada.'}</strong> ${summary.setCount} de ${planned} series · ${formatNumber(summary.volume)} kg levantados (peso × repeticiones).</p>` : ''}
    <dl class="stat-strip">
      <div><dt>Series hoy</dt><dd class="mono">${summary.setCount}<small>/${planned}</small></dd></div>
      <div><dt>Volumen</dt><dd class="mono">${formatNumber(summary.volume)}<small> kg</small></dd></div>
      <div><dt>Récords e1RM</dt><dd class="mono">${summary.records}</dd></div>
    </dl>
    <div class="exercise-grid">${summary.exercises.map((row) => exerciseCard(row, ui, data)).join('')}</div>
    ${note(`Tocá ✓ para registrar una serie planificada o usá «Agregar serie» con tu carga real. Cada cambio se puede editar o deshacer. e1RM (Epley) es un índice personal solo para series de 1–15 repeticiones; cambios dentro de ±${STABLE_BAND * 100} % se consideran estables.`)}`;
}

function lineChart(points) {
  if (points.length < 2) return '<p class="empty">Hace falta más de una sesión para dibujar la tendencia.</p>';
  const w = 640; const h = 200; const pad = 28;
  const values = points.map((p) => p.e1rm);
  const min = Math.min(...values) * 0.96; const max = Math.max(...values) * 1.03;
  const x = (i) => pad + (i * (w - pad * 2)) / (points.length - 1);
  const y = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
  const path = points.map((p, i) => `${x(i).toFixed(1)},${y(p.e1rm).toFixed(1)}`).join(' ');
  return `<svg class="line-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="e1RM por sesión: de ${formatDecimal(values[0])} a ${formatDecimal(values.at(-1))} kg">
    <line class="axis" x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}"/>
    <polyline class="line" points="${path}"/>
    ${points.map((p, i) => `<circle class="pt ${p.isToday ? 'is-today' : ''}" cx="${x(i).toFixed(1)}" cy="${y(p.e1rm).toFixed(1)}" r="${p.isToday ? 6 : 4}"><title>${shortDate(p.date)}: ${fmtKg(p.kg)} × ${p.reps} → e1RM ${formatDecimal(p.e1rm)} kg</title></circle>`).join('')}
    <text class="lbl" x="${pad}" y="${h - 6}">${shortDate(points[0].date)}</text>
    <text class="lbl" x="${w - pad}" y="${h - 6}" text-anchor="end">${points.at(-1).isToday ? 'Hoy' : shortDate(points.at(-1).date)}</text>
    <text class="lbl" x="${pad}" y="${y(points[0].e1rm) - 10}">${formatDecimal(points[0].e1rm)}</text>
    <text class="lbl strong" x="${w - pad}" y="${y(points.at(-1).e1rm) - 12}" text-anchor="end">${formatDecimal(points.at(-1).e1rm)} kg</text>
  </svg>`;
}

function progresoTab(data, ui, gym) {
  const loadExercises = gym.exercises.filter((e) => e.mode === 'load');
  const selected = loadExercises.find((e) => e.id === ui.gymExercise) ?? loadExercises[0];
  const series = e1rmSeries(gym, selected.id, data.gym.today, data.today);
  const recent = [...series].reverse().slice(0, 5);
  const weeks = weeklyVolume(gym, data.gym.today, data.today);
  const maxVol = Math.max(1, ...weeks.map((w) => w.volume));
  const muscles = muscleSets(gym, data.gym.today, data.today);
  const maxSets = Math.max(1, ...muscles.map((m) => m.sets));
  const first = series[0]; const last = series.at(-1);
  return `
    <div class="chips" role="group" aria-label="Elegir ejercicio">${loadExercises.map((e) => `<button type="button" class="chip-btn" data-gym-exercise="${e.id}" aria-pressed="${e.id === selected.id}">${esc(e.name)}</button>`).join('')}</div>
    <div class="split">
      <section class="card" aria-labelledby="e1rm-title">
        <div class="card-head"><h2 id="e1rm-title">Fuerza estimada · ${esc(selected.name)}</h2><span class="muted small">${series.length} sesiones</span></div>
        ${lineChart(series)}
        <p class="caption">De ${formatDecimal(first.e1rm)} a ${formatDecimal(last.e1rm)} kg de e1RM (${last.e1rm >= first.e1rm ? '+' : '−'}${formatDecimal(Math.abs((last.e1rm - first.e1rm) / first.e1rm) * 100)} %). El set observado sigue visible en cada punto.</p>
      </section>
      <section class="card" aria-labelledby="recent-title">
        <h2 id="recent-title">Mejores series recientes</h2>
        <table class="data-table"><thead><tr><th scope="col">Fecha</th><th scope="col">Serie</th><th scope="col">e1RM</th></tr></thead>
        <tbody>${recent.map((p) => `<tr class="${p.isToday ? 'is-today' : ''}"><td>${p.isToday ? 'Hoy' : shortDate(p.date)}</td><td class="mono">${fmtKg(p.kg)} × ${p.reps}</td><td class="mono">${formatDecimal(p.e1rm)}</td></tr>`).join('')}</tbody></table>
      </section>
    </div>
    <div class="split even">
      <section class="card" aria-labelledby="vol-title">
        <div class="card-head"><h2 id="vol-title">Volumen semanal</h2><span class="muted small">kg × reps · últimas 6 semanas</span></div>
        <div class="month-bars a-care" role="img" aria-label="Volumen semanal de las últimas seis semanas">${weeks.map((w, i) => `<span class="${i === weeks.length - 1 ? 'is-today' : ''}"><small class="mono">${formatNumber(w.volume / 1000)}k</small><span ${vars({ h: pct((w.volume / maxVol) * 100) })}></span><small>${i === weeks.length - 1 ? 'Esta' : `−${weeks.length - 1 - i}`}</small></span>`).join('')}</div>
      </section>
      <section class="card" aria-labelledby="muscle-title">
        <div class="card-head"><h2 id="muscle-title">Series por grupo muscular</h2><span class="muted small">últimos 7 días</span></div>
        <ul class="hbars">${muscles.map((m) => `<li><span>${m.muscle}</span><span class="bar a-care" ${vars({ w: pct((m.sets / maxSets) * 100) })}><span></span></span><span class="mono">${m.sets}</span></li>`).join('')}</ul>
      </section>
    </div>
    ${note('Distribución descriptiva, no una prescripción. En Vida 2.0 real estas comparaciones salen del historial canónico en Google Sheets; acá, de 12 sesiones sintéticas.')}`;
}

function historialTab(data, gym, summary) {
  const sessions = [...gym.history].reverse();
  const today = data.gym.today.length ? `<li class="card session is-today"><div class="session-head"><strong>Hoy · en curso</strong><span class="mono">${summary.setCount} series · ${formatNumber(summary.volume)} kg</span></div><div class="session-sets">${summary.exercises.filter((r) => r.sets.length).map((r) => `<span class="tag">${esc(r.exercise.name)} · ${r.best ? setText(r.best) : setText(r.sets[0])}</span>`).join('')}</div></li>` : '';
  return `<ol class="session-list">${today}${sessions.map((s) => {
    const volume = s.sets.reduce((t, x) => t + setVolume(x), 0);
    const byExercise = gym.exercises.map((e) => ({ e, sets: s.sets.filter((x) => x.exerciseId === e.id) })).filter((x) => x.sets.length);
    return `<li class="card session"><div class="session-head"><strong>${shortDate(s.date)}</strong><span class="mono">${s.sets.length} series · ${formatNumber(volume)} kg</span></div><div class="session-sets">${byExercise.map(({ e, sets }) => { const b = bestSet(sets); return `<span class="tag">${esc(e.name)} · ${b ? setText(b) : setText(sets[0])}</span>`; }).join('')}</div></li>`;
  }).join('')}</ol>`;
}

export function gymView(data, ui) {
  const gym = withMeta(data.gym);
  const summary = sessionSummary(gym, data.gym.today);
  const tab = ui.gymTab;
  return `${pageHead('Sesión de hoy', 'Progresá a tu ritmo.', `${gym.exercises.length} ejercicios planificados · historial de ${gym.history.length} sesiones. Registrá series y mirá cómo cambian tus comparaciones.`)}
    ${tabs('gym-tab', tab, [['hoy', 'Hoy'], ['progreso', 'Progreso'], ['historial', 'Historial']])}
    ${tab === 'progreso' ? progresoTab(data, ui, gym) : tab === 'historial' ? historialTab(data, gym, summary) : hoyTab(data, ui, gym, summary)}
    ${note('Rutina y pesos ficticios. No son una prescripción de entrenamiento.')}`;
}
