/** Vista Salud: scores explicables, tendencias de 7 días, cobertura de 28 días y contexto de otros módulos. */
import { average, formatDecimal, formatNumber, healthDeltas, signed } from '../../logic.js';
import { BAND_LABEL, avg, healthScores, weeklyCardio } from '../domain/health.js';
import { energyStatus, totals } from '../domain/nutrition.js';
import { sessionSummary } from '../domain/gym.js';
import { withMeta } from './gym.js';
import { icon, note, pageHead, pct, shortDate, tabs, vars } from './ui.js';

const LONG_DAY = { 'Mié': 'miércoles', Jue: 'jueves', Vie: 'viernes', 'Sáb': 'sábado', Dom: 'domingo', Lun: 'lunes', Hoy: 'hoy' };

function scoreRing(score, size = 112) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const filled = score == null ? 0 : (c * score) / 100;
  return `<span class="score-ring"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="10"/><circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="10" stroke-dasharray="${filled.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><strong class="mono">${score ?? '—'}</strong></span>`;
}

function scoreCard(s, ui) {
  const open = ui.healthScore === s.id;
  return `<section class="card score-card band-${s.band}" aria-labelledby="sc-${s.id}">
    <div class="score-head"><div><h2 id="sc-${s.id}">${s.label}</h2><p class="muted small">${s.question}</p></div><span class="score-num mono">${s.score ?? '—'}<small>/100</small></span></div>
    <div class="score-meta"><span class="band-pill band-${s.band}">${BAND_LABEL[s.band]}</span><span class="muted small">Confianza ${s.confidence} % · cobertura ${Math.round(s.coverage * 100)} %</span></div>
    <button type="button" class="link-btn" data-health-score="${open ? '' : s.id}" aria-expanded="${open}">${open ? 'Ocultar' : 'Ver'} qué lo explica ${icon('chevron', 14)}</button>
    ${open ? `<ul class="contrib-list">${s.contributors.map((x) => `<li class="${x.score == null ? 'is-missing' : `is-${x.direction}`}">
      <span class="contrib-top"><strong>${x.label}</strong><span class="mono">${x.score == null ? 'sin dato' : x.score}</span></span>
      <span class="bar a-care ${x.score == null ? 'is-muted' : ''}" ${vars({ w: pct(x.score ?? 0) })}><span></span></span>
      <span class="muted small">Peso ${Math.round(x.weight * 100)} % · ${x.detail}</span></li>`).join('')}</ul>` : ''}
  </section>`;
}

function contextCard(data) {
  const gym = withMeta(data.gym);
  const session = sessionSummary(gym, data.gym.today);
  const stepsWeek = data.health.history.slice(-7).reduce((t, d) => t + (d.steps ?? 0), 0);
  const cardio = weeklyCardio(data.gym.cardio, stepsWeek);
  const t = totals(data.nutrition.days[0].meals, data.nutrition.catalog);
  const energy = energyStatus(t.kcal, data.nutrition.target);
  const sessions = data.gym.sessionsThisWeek + (data.gym.completed ? 1 : 0);
  return `<section class="card" aria-labelledby="ctx-title">
    <div class="card-head"><h2 id="ctx-title">Contexto de otros módulos</h2><span class="muted small">se actualiza con lo que registres</span></div>
    <ul class="context-list">
      <li><button type="button" class="context-item a-care" data-tab="gimnasio"><span>Entrenamiento</span><strong class="mono">${sessions}/${data.gym.goal}</strong><small>sesiones · ${session.setCount} series y ${formatNumber(session.volume)} kg hoy</small></button></li>
      <li><button type="button" class="context-item a-care" data-tab="gimnasio" data-gym-tab-target="cardio"><span>Cardio semanal</span><strong class="mono">${Math.round(cardio.ratio * 100)} %</strong><small>${formatNumber(cardio.total)} de ${formatNumber(cardio.target)} MET-min</small></button></li>
      <li><button type="button" class="context-item a-care" data-tab="nutricion"><span>Energía de hoy</span><strong class="mono">${formatNumber(t.kcal.value)}</strong><small>kcal · ${energy.state === 'within' ? 'dentro del rango' : energy.state === 'below' ? 'debajo del rango' : energy.state === 'above' ? 'sobre el rango' : 'parcial'}</small></button></li>
    </ul>
    <p class="muted small">Asociación no es causalidad: el contexto ayuda a leer los scores, no los explica por sí solo.</p>
  </section>`;
}

function summaryTab(data, ui, scores) {
  const today = data.health;
  const r = scores.readiness;
  return `
    <dl class="stat-strip four">
      <div><dt>Sueño</dt><dd class="mono">${formatDecimal(today.sleepHours)}<small> h</small></dd></div>
      <div><dt>Pasos</dt><dd class="mono">${formatNumber(today.steps)}</dd></div>
      <div><dt>FC en reposo</dt><dd class="mono">${today.restingPulse}<small> lpm</small></dd></div>
      <div><dt>Minutos activos</dt><dd class="mono">${today.activeMinutes}</dd></div>
    </dl>
    <section class="card readiness band-${r.band}" aria-labelledby="ready-title">
      ${scoreRing(r.score)}
      <div class="readiness-text"><p class="eyebrow a-care">Disposición de hoy</p><h2 id="ready-title">${BAND_LABEL[r.band]}</h2><p class="muted">${r.question} Se calcula como media geométrica de Sueño y Estabilidad cardio y solo existe si ambos tienen evidencia suficiente.</p>
        <span class="confidence"><span class="bar a-care" ${vars({ w: pct(r.confidence) })}><span></span></span><small>Confianza ${r.confidence} % · baja porque la demo no modela HRV ni continuidad del sueño</small></span></div>
    </section>
    <div class="score-grid">${scores.scores.map((s) => scoreCard(s, ui)).join('')}</div>
    ${contextCard(data)}`;
}

function trendsTab(data, ui) {
  const { health } = data;
  const deltas = healthDeltas(data);
  const metrics = {
    sleep: { label: 'Sueño', unit: 'h', values: health.sleepTrend, today: health.sleepHours, fmt: (v) => formatDecimal(v), delta: `${signed(deltas.sleep, 1)} h`, d: deltas.sleep, title: 'Horas de sueño por noche', caption: 'Registro semanal ilustrativo' },
    steps: { label: 'Pasos', unit: 'pasos', values: health.stepsTrend, today: health.steps, fmt: formatNumber, delta: signed(deltas.steps), d: deltas.steps, title: 'Pasos por día', caption: 'Actividad diaria ilustrativa' },
    activity: { label: 'Minutos activos', unit: 'min', values: health.activityTrend, today: health.activeMinutes, fmt: formatNumber, delta: `${signed(deltas.activity)} min`, d: deltas.activity, title: 'Minutos de actividad', caption: 'Movimiento semanal ilustrativo' },
  };
  const m = metrics[ui.healthMetric] ?? metrics.sleep;
  const mean = average(m.values);
  const max = Math.max(...m.values) * 1.08;
  const labels = health.trendLabels;
  const maxIdx = m.values.indexOf(Math.max(...m.values));
  const minIdx = m.values.indexOf(Math.min(...m.values));
  const insight = {
    sleep: `Dormiste más de 7 horas en ${m.values.filter((v) => v > 7).length} de las últimas 7 noches. Tu mejor descanso fue el ${LONG_DAY[labels[maxIdx]]}.`,
    steps: `El día con más pasos fue el ${LONG_DAY[labels[maxIdx]]} (${formatNumber(m.values[maxIdx])}). El más quieto, el ${LONG_DAY[labels[minIdx]]}.`,
    activity: `${m.values.filter((v) => v > 40).length} días por encima de 40 minutos. Hoy estás ${m.today >= mean ? 'sobre' : 'debajo de'} tu promedio.`,
  }[ui.healthMetric] ?? '';
  const hr = health.history.map((d) => d.restingHr);
  return `
    <div class="metric-tabs" role="group" aria-label="Elegir indicador">${Object.entries(metrics).map(([key, x]) => `
      <button type="button" class="metric-tab a-care" data-health-metric="${key}" aria-pressed="${ui.healthMetric === key}">
        <span class="metric-top"><span>${x.label}</span><span class="delta ${x.d >= 0 ? 'up' : 'down'}">${x.delta} vs. prom.</span></span>
        <span class="metric-value mono">${x.fmt(x.today)}<small> ${x.unit}</small></span>
      </button>`).join('')}
    </div>
    <div class="split">
      <section class="card" aria-labelledby="chart-title">
        <div class="card-head"><h2 id="chart-title">${m.title}</h2><span class="legend"><span class="legend-dash" aria-hidden="true"></span>Tu promedio: ${m.fmt(Number(mean.toFixed(1)))} ${m.unit}</span></div>
        <div class="bars a-care" role="img" aria-label="${m.title}. Hoy ${m.fmt(m.today)} ${m.unit}; promedio ${m.fmt(Number(mean.toFixed(1)))}." ${vars({ 'avg-n': (mean / max).toFixed(3) })}>
          <span class="avg-line" aria-hidden="true"></span>
          ${m.values.map((v, i) => `<span class="bar-col ${i === m.values.length - 1 ? 'is-today' : v >= mean ? 'is-above' : ''}"><span class="bar-fill" ${vars({ h: pct((v / max) * 100) })}><span class="bar-val mono">${m.fmt(v)}</span></span><span class="bar-day">${labels[i]}</span></span>`).join('')}
        </div>
        <p class="caption">${m.caption} · Cambiá el indicador para comparar otra serie.</p>
      </section>
      <aside class="stack">
        <div class="card"><p class="eyebrow a-care">Pulso en reposo</p><p class="big mono">${health.restingPulse}<small> lpm</small></p><p class="muted">Promedio de 28 días: ${formatDecimal(avg(hr))} lpm, con ${hr.filter((x) => x == null).length} días sin dato que no se cuentan como cero.</p></div>
        <div class="card"><p class="eyebrow">Lectura de la semana</p><p>${insight}</p><p class="muted small">Comparado contra tu propio promedio de 7 días.</p></div>
      </aside>
    </div>`;
}

function coverageTab(data, scores) {
  const rows = [['sleepHours', 'Sueño'], ['steps', 'Pasos'], ['restingHr', 'FC en reposo'], ['hrv', 'HRV']];
  const history = data.health.history;
  return `
    <section class="card" aria-labelledby="cov-title">
      <div class="card-head"><h2 id="cov-title">Cobertura de los últimos 28 días</h2><span class="legend"><span class="cov-dot is-on" aria-hidden="true"></span>con dato <span class="cov-dot" aria-hidden="true"></span>sin dato</span></div>
      <div class="cov-grid" role="table" aria-label="Días con dato por métrica">
        ${rows.map(([key, label]) => { const present = history.filter((d) => d[key] != null).length; return `<div class="cov-row" role="row"><span class="cov-label" role="rowheader">${label}<small class="mono">${present}/${history.length}</small></span><span class="cov-cells" role="cell">${history.map((d) => `<span class="cov-dot ${d[key] != null ? 'is-on' : ''}" title="${shortDate(d.date)}: ${d[key] != null ? 'con dato' : 'sin dato'}"></span>`).join('')}</span></div>`; }).join('')}
      </div>
      <p class="caption">${shortDate(history[0].date)} → ${shortDate(history.at(-1).date)}. Un día sin dato baja la confianza del score; nunca se completa con ceros ni con un promedio inventado.</p>
    </section>
    <section class="card" aria-labelledby="pipe-title"><h2 id="pipe-title">De dónde vienen estos datos en el sistema real</h2><p class="muted">Huawei Band → Huawei Health → Apple Health → Health Auto Export → Drive (archivo crudo) → Health Sync (Apps Script, reconciliación) → Google Sheets → Vida. La web nunca lee los archivos crudos.</p><button type="button" class="link-btn" data-tab="sistema">Ver el flujo completo ${icon('arrow', 14)}</button></section>
    <p class="muted small">Versión de cálculo: ${scores.version}. HRV con dato: ${scores.coverage.hrv} de ${scores.coverage.days} días.</p>`;
}

export function healthView(data, ui) {
  const scores = healthScores(data.health.history);
  const tab = ui.healthTab;
  const deltas = healthDeltas(data);
  const above = [deltas.sleep, deltas.steps, deltas.activity].filter((d) => d > 0).length;
  const lead = above === 3 ? 'Hoy estás por encima de tu promedio en sueño, pasos y actividad.' : `Hoy superás tu promedio en ${above} de 3 indicadores.`;
  return `${pageHead('Últimos 7 y 28 días', 'Tu bienestar, de un vistazo.', lead)}
    ${tabs('health-tab', tab, [['summary', 'Resumen'], ['trends', 'Tendencias'], ['coverage', 'Cobertura']])}
    ${tab === 'trends' ? trendsTab(data, ui) : tab === 'coverage' ? coverageTab(data, scores) : summaryTab(data, ui, scores)}
    ${note('Valores inventados para mostrar la interfaz. No son recomendaciones ni interpretaciones médicas.')}`;
}

