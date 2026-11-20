/** Vista Plan y logros: En qué quedé, objetivos con hitos, revisión semanal y logros. Plantillas puras. */
import { continuityState, daysSince, goalProgress, weekSnapshot } from '../domain/planning.js';
import { esc, fieldError, icon, note, pageHead, pct, shortDate, tabs, vars } from './ui.js';

const STATE = {
  ready: ['Al día', 'add'], stale: ['Sin avances hace más de 7 días', 'watch'], blocked: ['Bloqueado', 'over'],
  'blocked-stale': ['Bloqueado y sin avances', 'over'], unknown: ['Sin fecha verificable', 'idle'],
};
const CATEGORY = { ACADEMIC: 'Académico', PROJECT: 'Proyecto', PROFESSIONAL: 'Profesional', PERSONAL: 'Personal', OTHER: 'Otro' };
const ASSERTION = { SELF_REPORTED: 'Autoinformado', OWNER_VERIFIED: 'Verificado por su dueño' };

function continuityTab(data, ui) {
  const items = data.planning.continuity;
  return `<div class="continuity-grid">${items.map((item) => {
    const state = continuityState(item, data.today);
    const editing = ui.continuityEdit === item.id;
    const err = ui.formErrors[`cont-${item.id}`] ?? {};
    return `<article class="card continuity is-${STATE[state][1]}" aria-labelledby="ct-${item.id}">
      <div class="restock-head"><div><p class="eyebrow ${item.source === 'learning' ? 'a-learn' : 'a-org'}">${item.source === 'learning' ? 'Aprendizaje' : 'Proyecto'}</p><h2 id="ct-${item.id}">${esc(item.title)}</h2></div><span class="state-pill is-${STATE[state][1]}">${STATE[state][0]}</span></div>
      ${editing ? `<form class="continuity-form" data-capture-form="continuity" data-item="${item.id}" novalidate>
          <label class="field"><span>Próximo paso</span><input name="nextAction" maxlength="120" value="${esc(item.nextAction)}"/>${fieldError(err, 'nextAction')}</label>
          <label class="field"><span>Bloqueo (opcional)</span><input name="blocker" maxlength="120" value="${esc(item.blocker ?? '')}"/></label>
          <div class="row-actions"><button type="submit" class="btn btn-dark btn-sm">${icon('check', 14)} Guardar avance de hoy</button><button type="button" class="btn btn-ghost btn-sm" data-continuity-edit="">Cancelar</button></div>
        </form>`
        : `<dl class="next-step"><div><dt>Próximo paso</dt><dd>${esc(item.nextAction)}</dd></div>${item.blocker ? `<div class="is-blocker"><dt>Bloqueo</dt><dd>${esc(item.blocker)}</dd></div>` : ''}</dl>
        <p class="muted small">Último avance: ${shortDate(item.lastProgress)} · hace ${daysSince(item.lastProgress, data.today)} ${daysSince(item.lastProgress, data.today) === 1 ? 'día' : 'días'}</p>
        <button type="button" class="link-btn" data-continuity-edit="${item.id}">${icon('edit', 14)} Registrar avance</button>`}
    </article>`;
  }).join('')}</div>
  ${note('En el original, «En qué quedé» lee el próximo paso que ya está en Notion y en el catálogo académico: no infiere avances de conversaciones ni toma una fecha de la fuente como prueba de que algo se completó.')}`;
}

function goalsTab(data) {
  return `<div class="goal-list">${data.planning.goals.map((goal) => {
    const p = goalProgress(goal);
    return `<article class="card goal a-${goal.area}" aria-labelledby="gl-${goal.id}">
      <div class="goal-head"><div><h2 id="gl-${goal.id}">${esc(goal.title)}</h2><p class="muted small">Fecha objetivo ${shortDate(goal.due)} · ${p.next ? `siguiente hito: ${esc(p.next.label)}` : 'todos los hitos cumplidos'}</p></div><span class="score-num mono">${p.done}<small>/${p.total}</small></span></div>
      <span class="bar bar-lg" ${vars({ w: pct(p.ratio * 100) })}><span></span></span>
      <ul class="milestones">${goal.milestones.map((m) => `<li><label class="check-row a-${goal.area} ${m.done ? 'is-done' : ''}"><input class="check-input" type="checkbox" data-milestone-check="${goal.id}:${m.id}" ${m.done ? 'checked' : ''}/><span class="check-box" aria-hidden="true">${icon('check', 14)}</span><span class="check-text"><span class="check-label">${esc(m.label)}</span></span></label></li>`).join('')}</ul>
    </article>`;
  }).join('')}</div>
  ${note('El progreso sale de hitos cumplidos, no de horas invertidas: en el original, dedicar tiempo no prueba que algo esté listo.')}`;
}

function reviewTab(data, ui) {
  const snapshot = weekSnapshot(data);
  const err = ui.formErrors.review ?? {};
  const draft = ui.reviewDraft ?? {};
  return `
    <section class="card" aria-labelledby="wk-title">
      <div class="card-head"><h2 id="wk-title">Semana del 16 al 22 de noviembre</h2><span class="muted small">compuesta desde cada módulo, en vivo</span></div>
      <dl class="week-grid">${snapshot.map((s) => `<div><dt>${s.label}</dt><dd class="mono">${s.value}</dd><small>${s.source}</small></div>`).join('')}</dl>
    </section>
    <form class="card review-form" data-capture-form="review" novalidate aria-labelledby="rv-title">
      <h2 id="rv-title">Cerrar la semana</h2>
      <div class="form-grid">
        <label class="field field-wide"><span>¿Qué salió bien?</span><textarea name="wentWell" rows="2" maxlength="280">${esc(draft.wentWell ?? '')}</textarea>${fieldError(err, 'wentWell')}</label>
        <label class="field field-wide"><span>¿Qué ajustarías?</span><textarea name="adjust" rows="2" maxlength="280">${esc(draft.adjust ?? '')}</textarea>${fieldError(err, 'adjust')}</label>
        <label class="field field-wide"><span>Foco de la próxima semana</span><textarea name="focus" rows="2" maxlength="280">${esc(draft.focus ?? '')}</textarea>${fieldError(err, 'focus')}</label>
      </div>
      <button type="submit" class="btn btn-dark">${icon('check', 16)} Guardar revisión</button>
    </form>
    <section aria-labelledby="past-title" class="stack"><h2 id="past-title">Revisiones anteriores</h2>${data.planning.reviews.map((r) => `<article class="card review"><p class="eyebrow a-org">Semana ${esc(r.week)} · cerrada el ${shortDate(r.closedAt)}</p><dl class="review-dl"><div><dt>Salió bien</dt><dd>${esc(r.wentWell)}</dd></div><div><dt>Ajustar</dt><dd>${esc(r.adjust)}</dd></div><div><dt>Foco</dt><dd>${esc(r.focus)}</dd></div></dl>${r.snapshot ? `<p class="muted small">${r.snapshot.map((s) => `${s.label}: ${s.value}`).join(' · ')}</p>` : ''}</article>`).join('')}</section>
    ${note('En el sistema real, la automatización «Revisión semanal» arma este resumen y queda pendiente de aprobación; nada se publica sin una decisión humana.')}`;
}

function achievementsTab(data, ui) {
  const err = ui.formErrors.achievement ?? {};
  const list = [...data.planning.achievements].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  return `<ul class="achievement-list">${list.map((a) => `<li class="card achievement"><span class="achievement-icon" aria-hidden="true">${icon('star', 18)}</span><div><strong>${esc(a.title)}</strong><p class="muted small">${CATEGORY[a.category]} · ${a.date ? shortDate(a.date) : 'fecha desconocida'}</p></div><span class="tag ${a.assertion === 'OWNER_VERIFIED' ? 'a-learn' : ''}">${ASSERTION[a.assertion]}</span></li>`).join('')}</ul>
    <form class="card add-food" data-capture-form="achievement" novalidate aria-labelledby="ach-title">
      <h2 id="ach-title">Agregar un logro</h2>
      <div class="form-grid">
        <label class="field"><span>Logro</span><input name="title" maxlength="100" placeholder="Terminé el curso de testing"/>${fieldError(err, 'title')}</label>
        <label class="field"><span>Categoría</span><select name="category">${Object.entries(CATEGORY).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label>
        <label class="field"><span>Fecha (opcional)</span><input name="date" type="date" max="${data.today}"/>${fieldError(err, 'date')}</label>
      </div>
      <p class="muted small">Se guarda como «Autoinformado». En el original, solo los logros aceptados y no sensibles aparecen en Vida.</p>
      <button type="submit" class="btn btn-dark">${icon('check', 16)} Guardar logro</button>
    </form>`;
}

export function planningView(data, ui) {
  const tab = ui.planTab;
  const stale = data.planning.continuity.filter((i) => continuityState(i, data.today) !== 'ready').length;
  return `${pageHead('Organizar · continuidad y objetivos', 'Plan y logros.', `${stale} de ${data.planning.continuity.length} frentes necesitan atención · ${data.planning.goals.length} objetivos activos`)}
    ${tabs('plan-tab', tab, [['continuity', 'En qué quedé'], ['goals', 'Objetivos'], ['review', 'Revisión semanal'], ['achievements', 'Logros']])}
    ${tab === 'goals' ? goalsTab(data) : tab === 'review' ? reviewTab(data, ui) : tab === 'achievements' ? achievementsTab(data, ui) : continuityTab(data, ui)}`;
}
