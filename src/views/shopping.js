/** Vista Compras: lista por categoría y reposición predictiva por cadencia. Plantillas puras. */
import { daysUntil, estimateCadence } from '../domain/replenishment.js';
import { esc, icon, note, pageHead, pct, shortDate, tabs, vars } from './ui.js';
import { collectionEditor } from './collection-fields.js';

const STATE = {
  OVERDUE: { label: 'Vencido', tone: 'over', order: 0 },
  ADD_TO_LIST: { label: 'Para agregar', tone: 'add', order: 1 },
  WATCH: { label: 'Atento', tone: 'watch', order: 2 },
  NOT_DUE: { label: 'Sin urgencia', tone: 'idle', order: 3 },
};
const CONFIDENCE = { HIGH: 'Confianza alta', MEDIUM: 'Confianza media', LOW: 'Confianza baja' };

export function replenishmentRows(data) {
  const now = new Date(`${data.today}T12:00:00Z`);
  return data.household.needs.map((need) => {
    const purchases = [...need.purchases, ...data.household.extraPurchases.filter((p) => p.needId === need.id)];
    const corrections = data.household.corrections.filter((c) => c.needId === need.id);
    const estimate = estimateCadence({ need, purchases, corrections, now });
    const inList = data.shopping.some((item) => item.needId === need.id && !item.checked);
    return { need, estimate, inList, lastPurchase: purchases.map((p) => p.purchasedAt).sort().at(-1), daysLeft: daysUntil(estimate.nextExpectedAt, now), lastCorrection: corrections.at(-1)?.type ?? null };
  }).sort((a, b) => STATE[a.estimate.state].order - STATE[b.estimate.state].order || (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
}

const when = (days) => (days == null ? 'sin estimación' : days < 0 ? `hace ${-days} ${-days === 1 ? 'día' : 'días'}` : days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`);

function listTab(data) {
  const checked = data.shopping.filter((i) => i.checked).length;
  const groups = [...new Set(data.shopping.map((i) => i.category))];
  return `
    <span class="bar bar-lg a-life" ${vars({ w: pct(data.shopping.length ? (checked / data.shopping.length) * 100 : 0) })}><span></span></span>
    <div class="shop-grid">${groups.map((g, groupIndex) => `<section class="card" aria-labelledby="shop-group-${groupIndex}"><h2 id="shop-group-${groupIndex}" class="eyebrow">${esc(g)}</h2><ul class="check-list">${data.shopping.filter((i) => i.category === g).map((i) => `<li class="shop-item"><label class="check-row a-life ${i.checked ? 'is-done' : ''}"><input class="check-input" type="checkbox" data-shopping-check="${esc(i.id)}" ${i.checked ? 'checked' : ''}/><span class="check-box" aria-hidden="true">${icon('check', 14)}</span><span class="check-text"><span class="check-label">${esc(i.name)}</span>${i.needId ? '<span class="check-meta">Sugerido por reposición · al marcarlo se registra la compra</span>' : ''}</span><span class="muted">${esc(i.amount)}</span></label><div class="item-actions"><button type="button" class="link-btn" data-collection-edit="shopping.item|${esc(i.id)}">Editar</button><button type="button" class="link-btn" data-collection-remove="shopping.item|${esc(i.id)}">Quitar</button></div></li>`).join('')}</ul></section>`).join('')}</div>
    ${groups.length ? '' : '<p class="empty">Tu lista está vacía. Agregá el primer producto para empezar.</p>'}`;
}

function restockTab(data) {
  const rows = replenishmentRows(data);
  const due = rows.filter((r) => ['OVERDUE', 'ADD_TO_LIST'].includes(r.estimate.state)).length;
  return `
    <dl class="stat-strip">
      <div><dt>Para reponer ahora</dt><dd class="mono">${due}</dd></div>
      <div><dt>En observación</dt><dd class="mono">${rows.filter((r) => r.estimate.state === 'WATCH').length}</dd></div>
      <div><dt>Productos con historial</dt><dd class="mono">${rows.length}</dd></div>
    </dl>
    <ul class="restock-list">${rows.map(({ need, estimate: e, inList, lastPurchase, daysLeft, lastCorrection }) => `
      <li class="card restock is-${STATE[e.state].tone}">
        <div class="restock-head"><div><strong>${esc(need.name)}</strong><small class="muted">${esc(need.category)} · ${esc(need.amount)}</small></div><span class="state-pill is-${STATE[e.state].tone}">${STATE[e.state].label}</span></div>
        <p class="restock-line">${e.expectedIntervalDays ? `Cada ~${Math.round(e.expectedIntervalDays)} días · próxima ${when(daysLeft)}${e.nextExpectedAt ? ` (${shortDate(e.nextExpectedAt.slice(0, 10))})` : ''}` : 'Sin historial suficiente'}</p>
        <p class="muted small">${e.observations ? CONFIDENCE[e.confidence] : 'Sin datos para predecir'} · ${e.observations} ${e.observations === 1 ? 'compra' : 'compras'}${e.anomalies ? ` · ${e.anomalies} intervalo atípico descartado` : ''}${lastPurchase ? ` · última ${shortDate(lastPurchase.slice(0, 10))}` : ''}${lastCorrection ? ` · corregido: «${{ STILL_HAVE: 'todavía tengo', LOW: 'queda poco', OUT: 'se acabó' }[lastCorrection]}»` : ''}</p>
        <div class="restock-actions">
          ${inList ? '<span class="tag a-life">En la lista</span>' : `<button type="button" class="btn btn-sm ${['OVERDUE', 'ADD_TO_LIST'].includes(e.state) ? 'btn-dark' : 'btn-outline'}" data-restock-add="${need.id}">${icon('plus', 14)} Agregar a la lista</button>`}
          <button type="button" class="chip-btn chip-sm" data-restock-correct="${need.id}:STILL_HAVE">Todavía tengo</button>
          <button type="button" class="chip-btn chip-sm" data-restock-correct="${need.id}:LOW">Queda poco</button>
          <button type="button" class="chip-btn chip-sm" data-restock-correct="${need.id}:OUT">Se acabó</button>
          <button type="button" class="chip-btn chip-sm" data-restock-bought="${need.id}">Lo compré hoy</button>
        </div>
      </li>`).join('')}
    </ul>
    ${note('Motor portado de Vida 2.0: mediana ponderada de los intervalos entre compras (lo reciente pesa más), descarte de atípicos por MAD y confianza según la regularidad. Con confianza baja no sugiere nada automáticamente. Historial ficticio.')}`;
}

export function shoppingView(data, ui) {
  const checked = data.shopping.filter((i) => i.checked).length;
  const tab = ui.shoppingTab;
  return `${pageHead('Vivir · lista de compras', 'Compras sin olvidos.', `${data.shopping.length - checked} por comprar · ${checked} de ${data.shopping.length} productos marcados`)}
    <div class="module-actions"><p class="muted small">Armá tu lista y registrá compras ficticias. Los productos nuevos empiezan sin historial de reposición.</p><button type="button" class="btn btn-dark btn-sm" data-collection-edit="shopping.item">${icon('plus', 15)} Agregar producto</button></div>
    ${ui.collectionEditor?.kind === 'shopping.item' ? collectionEditor('shopping.item', ui.collectionEditor.values ?? (data.shopping.find((i) => i.id === ui.collectionEditor.id) ?? {}), data, ui.formErrors.collection ?? {}, ui.collectionEditor.id ? 'Editar producto' : 'Nuevo producto') : ''}
    ${tabs('shopping-tab', tab, [['list', 'Lista'], ['restock', 'Reposición']])}
    ${tab === 'restock' ? restockTab(data) : listTab(data)}
    ${note('No se realizan compras ni pedidos. Los cambios se pierden al recargar.')}`;
}
