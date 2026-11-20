/** Centro de información: lecturas de ejemplo con procedencia, radar tecnológico y automatizaciones. */
import { esc, icon, note, pageHead, tabs } from './ui.js';

export const FEEDBACK = Object.freeze([
  ['USEFUL', 'Útil'], ['ALREADY_KNEW', 'Ya lo sabía'], ['TOO_BASIC', 'Muy básico'],
  ['TOO_DETAILED', 'Demasiado detalle'], ['NOT_RELEVANT', 'No me sirve'], ['WANT_DEEPER', 'Quiero profundizar'],
]);
const FRONTS = [['all', 'Todo'], ['ia', 'IA'], ['carrera', 'Carrera y futuro'], ['tecnologia', 'Tecnología explicada'], ['sistema', 'Tu sistema']];
const FRONT_LABEL = Object.fromEntries(FRONTS);
const RADAR = { ADOPTION: ['Adoptado', 'add'], ASSESS_NOW: ['Evaluar ahora', 'watch'], WATCH: ['Observar', 'idle'], HOLD: ['En pausa', 'over'] };
const RUN = { succeeded: ['Completada', 'add'], skipped: ['Omitida', 'idle'], failed: ['Falló', 'over'], cancelled: ['Cancelada', 'idle'] };
const fmt = (at) => `${at.slice(8, 10)}/${at.slice(5, 7)} ${at.slice(11, 16)}`;

function readings(data, ui) {
  const pieces = data.info.pieces.filter((p) => ui.infoFront === 'all' || p.front === ui.infoFront);
  return `
    <div class="chips" role="group" aria-label="Filtrar por frente">${FRONTS.map(([id, label]) => `<button type="button" class="chip-btn" data-info-front="${id}" aria-pressed="${ui.infoFront === id}">${label}</button>`).join('')}</div>
    <div class="piece-list">${pieces.map((p) => {
      const open = ui.infoOpen === p.id;
      const current = data.info.feedback[p.id] ?? null;
      return `<article class="card piece" aria-labelledby="pc-${p.id}">
        <p class="piece-meta"><span class="tag a-learn">${FRONT_LABEL[p.front]}</span><span class="muted small">${p.kind} · ${p.minutes} min · pieza de ejemplo</span></p>
        <h2 id="pc-${p.id}">${esc(p.title)}</h2>
        <p class="muted">${esc(p.summary)}</p>
        <button type="button" class="link-btn" data-info-open="${open ? '' : p.id}" aria-expanded="${open}">${open ? 'Cerrar' : 'Leer'} ${icon('chevron', 14)}</button>
        ${open ? `<div class="piece-body"><ul class="bullets">${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <p class="provenance">${icon('info', 14)} <span><strong>Procedencia:</strong> ${p.sources.map(esc).join(' · ')}. En el sistema real, cada pieza pasa por evidencia → selección → borrador → aprobación humana → publicación, y la web falla cerrada si la procedencia no es consistente.</span></p>
          <div class="feedback-row" role="group" aria-label="Tu opinión sobre esta pieza">${FEEDBACK.map(([id, label]) => `<button type="button" class="chip-btn chip-sm" data-info-feedback="${p.id}:${id}" aria-pressed="${current === id}">${label}</button>`).join('')}</div></div>` : ''}
      </article>`;
    }).join('')}</div>
    ${note('Piezas explicativas escritas para la demo, sin fechas de actualidad ni titulares: no son noticias. En Vida 2.0 real las publica el Personal AI System con fuentes verificables y Vida solo las muestra.')}`;
}

function radar(data) {
  return `<section class="card flush" aria-labelledby="radar-title"><div class="card-head padded"><h2 id="radar-title">Radar tecnológico</h2><span class="muted small">disposición actual por herramienta</span></div>
    <ul class="ledger radar">${data.info.radar.map((t) => `<li><span class="state-pill is-${RADAR[t.status][1]}">${RADAR[t.status][0]}</span><span class="ledger-text"><strong>${esc(t.name)}</strong><small>${esc(t.reason)}</small></span><span></span></li>`).join('')}</ul></section>
    ${note('Ejemplo genérico de cómo el módulo Professional registra decisiones sobre herramientas (adoptar, evaluar, observar, pausar). No refleja una lista real ni recomendaciones.')}`;
}

function automations(data) {
  return `<div class="automation-list">${data.info.automations.map((a) => `
    <article class="card automation ${a.enabled ? '' : 'is-off'}" aria-labelledby="au-${a.id}">
      <div class="automation-head"><div><h2 id="au-${a.id}">${esc(a.label)}</h2><p class="muted small">${esc(a.description)} · ${a.schedule}</p></div>
        <button type="button" class="switch" role="switch" aria-checked="${a.enabled}" data-automation-toggle="${a.id}" aria-label="${a.enabled ? 'Pausar' : 'Activar'} ${esc(a.label)}"><span></span></button></div>
      <ul class="runs">${a.runs.slice(0, 3).map((r) => `<li><span class="state-pill is-${RUN[r.state][1]}">${RUN[r.state][0]}</span><span class="mono small">${fmt(r.at)}</span><span class="small">${esc(r.detail)}</span></li>`).join('') || '<li class="muted small">Sin ejecuciones todavía.</li>'}</ul>
      <button type="button" class="btn btn-outline btn-sm" data-automation-run="${a.id}">Ejecutar ahora (simulado)</button>
    </article>`).join('')}</div>
    ${note('Simulación local: no se ejecuta nada fuera del navegador. En el original, el runtime corre detrás de flags que solo aceptan «true», con firma HMAC, idempotencia, kill switch por workflow y un store cifrado con AES-256-GCM.')}`;
}

export function infoView(data, ui) {
  const tab = ui.infoTab;
  return `${pageHead('Aprender · lecturas, radar y automatizaciones', 'Centro de información.', 'Lo que Vida 2.0 integra de afuera: lecturas con procedencia, decisiones sobre tecnología y automatizaciones controladas.')}
    ${tabs('info-tab', tab, [['readings', 'Lecturas'], ['radar', 'Radar tecnológico'], ['automations', 'Automatizaciones']])}
    ${tab === 'radar' ? radar(data) : tab === 'automations' ? automations(data) : readings(data, ui)}`;
}
