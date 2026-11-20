/** Vista Nutrición: registro desde catálogo, cobertura explícita, objetivo en rango y tendencias. Plantillas puras. */
import { formatDecimal, formatNumber } from '../../logic.js';
import { dailySeries, energyStatus, itemNutrients, macroShares, microWindow, totals } from '../domain/nutrition.js';
import { esc, fieldError, icon, note, pageHead, pct, tabs, vars } from './ui.js';

const MOMENTS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Colación'];
const g = (v) => `${formatDecimal(v, v < 10 && v % 1 ? 1 : 0)} g`;

function entryTitle(item, catalog) {
  if (!item.foodId) return esc(item.title);
  const food = catalog.find((f) => f.id === item.foodId);
  const portion = food.portions.find((p) => p.id === item.portionId);
  const qty = portion && portion.id !== 'g' ? `${formatDecimal(item.amount, item.amount % 1 ? 1 : 0)} ${portion.label}${item.amount > 1 && !portion.label.endsWith('s') ? (portion.label.match(/[aeiou]$/) ? 's' : 'es') : ''} · ` : '';
  return `${esc(food.name)} <small class="muted">${qty}${formatNumber(item.grams)} g</small>`;
}

function macroRow(label, total, target, cls) {
  const partial = !total.complete;
  const meta = partial ? `<small class="cov is-partial" title="Hay alimentos sin este dato: el valor es la suma de los conocidos">conocidos/parcial</small>` : '';
  const goal = target ? ` <small class="muted">/ ${target} g</small>` : '';
  return `<div class="macro ${cls}"><span class="macro-top"><span>${label} ${meta}</span><span class="mono">${g(total.value)}${goal}</span></span>${target && !partial ? `<span class="bar" ${vars({ w: pct((total.value / target) * 100) })}><span></span></span>` : `<span class="bar is-muted" ${vars({ w: pct(target ? (total.value / target) * 100 : 0) })}><span></span></span>`}</div>`;
}

function addForm(data, ui) {
  const catalog = data.nutrition.catalog;
  const draft = ui.foodDraft;
  const food = catalog.find((f) => f.id === draft.foodId) ?? catalog[0];
  const err = ui.formErrors.food ?? {};
  return `<form class="card add-food" data-capture-form="food" novalidate aria-labelledby="add-food-title">
    <h2 id="add-food-title">Agregar alimento</h2>
    <div class="form-grid">
      <label class="field"><span>Alimento</span><select name="foodId" data-food-select>${catalog.map((f) => `<option value="${f.id}" ${f.id === food.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select>${fieldError(err, 'food')}</label>
      <label class="field"><span>Cantidad</span><input name="amount" type="number" inputmode="decimal" min="0.25" step="0.25" value="${esc(draft.amount)}" required/>${fieldError(err, 'amount')}</label>
      <label class="field"><span>Porción</span><select name="portionId">${food.portions.map((p) => `<option value="${p.id}" ${p.id === draft.portionId ? 'selected' : ''}>${p.label}${p.id === 'g' ? '' : ` (${p.grams} g)`}</option>`).join('')}</select></label>
      <label class="field"><span>Momento</span><select name="moment">${MOMENTS.map((m) => `<option ${m === draft.moment ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
    </div>
    <p class="muted small">Por 100 g: ${formatNumber(food.per100.kcal)} kcal · P ${food.per100.protein} g · C ${food.per100.carbs} g · G ${food.per100.fat} g · fibra ${food.per100.fiber == null ? 'sin dato' : `${food.per100.fiber} g`}</p>
    <button type="submit" class="btn btn-dark">${icon('check', 16)} Agregar al día</button>
  </form>`;
}

function hoyTab(data, ui) {
  const day = data.nutrition.days[ui.nutritionDay];
  const catalog = data.nutrition.catalog;
  const target = data.nutrition.target;
  const t = totals(day.meals, catalog);
  const status = energyStatus(t.kcal, target);
  const shares = macroShares(t);
  const r = 54; const c = 2 * Math.PI * r;
  const statusText = {
    within: `Dentro del rango ${formatNumber(target.kcalLow)}–${formatNumber(target.kcalHigh)} kcal`,
    below: `Faltan ${formatNumber(status.diff ?? 0)} kcal para el mínimo del rango`,
    above: `${formatNumber(status.diff ?? 0)} kcal sobre el máximo del rango`,
    partial: 'Energía parcial: no se compara contra el objetivo',
  }[status.state];
  const groups = MOMENTS.map((m) => ({ m, items: day.meals.filter((x) => x.type === m) })).filter((x) => x.items.length);
  const isToday = ui.nutritionDay === 0;
  return `
    <div class="chips" role="group" aria-label="Elegir día">${data.nutrition.days.map((d, i) => `<button type="button" class="chip-btn" data-nutrition-day="${i}" aria-pressed="${ui.nutritionDay === i}">${d.label}</button>`).join('')}</div>
    ${day.note ? `<p class="banner-soft">${icon('info', 16)} ${day.note} Este día no entra en los promedios de Tendencias.</p>` : ''}
    <div class="split">
      <section class="card nutrition-summary a-care" aria-label="Resumen del día">
        <span class="kcal-ring"><svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label="${formatNumber(t.kcal.value)} kcal; objetivo ${formatNumber(target.kcalLow)} a ${formatNumber(target.kcalHigh)}"><circle class="ring-track" cx="66" cy="66" r="${r}" stroke-width="12"/><circle class="ring-fill" cx="66" cy="66" r="${r}" stroke-width="12" stroke-dasharray="${(c * Math.min(1, t.kcal.value / target.kcalHigh)).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 66 66)"/></svg><span><strong class="mono">${formatNumber(t.kcal.value)}</strong><small>kcal</small></span></span>
        <div class="macros">
          <p class="energy-status is-${status.state}">${statusText}</p>
          ${macroRow('Proteínas', t.protein, target.protein, 'm1')}
          ${macroRow('Carbohidratos', t.carbs, null, 'm2')}
          ${macroRow('Grasas', t.fat, null, 'm3')}
          ${macroRow('Fibra', t.fiber, target.fiber, 'm4')}
          <p class="muted small">${shares ? `Reparto de energía: P ${shares.protein}% · C ${shares.carbs}% · G ${shares.fat}%` : 'Reparto de energía no disponible con macros parciales.'}</p>
        </div>
      </section>
      <section class="card flush" aria-labelledby="meals-title">
        <div class="card-head padded"><h2 id="meals-title">Diario de comidas</h2><span class="muted">${day.meals.length} registros</span></div>
        ${groups.length ? groups.map(({ m, items }) => `<div class="moment"><p class="moment-title">${m}</p><ul class="meals">${items.map((meal) => {
          if (meal.foodId) {
            const n = itemNutrients(meal, catalog);
            return `<li><div class="meal is-food"><span class="mono meal-time">${meal.time}</span><span class="meal-text"><small>Del catálogo</small><strong>${entryTitle(meal, catalog)}</strong></span><span class="mono meal-kcal">${formatNumber(n.kcal)}<small>kcal</small></span><button type="button" class="icon-btn" data-food-remove="${meal.id}" aria-label="Quitar ${esc(catalog.find((f) => f.id === meal.foodId)?.name)}">${icon('close', 15)}</button></div></li>`;
          }
          const open = ui.mealOpen === meal.id;
          return `<li><button type="button" class="meal" data-meal="${meal.id}" aria-expanded="${open}"><span class="mono meal-time">${meal.time}</span><span class="meal-text"><small>${meal.type}</small><strong>${esc(meal.title)}</strong></span><span class="mono meal-kcal">${meal.calories}<small>kcal</small></span>${icon('chevron', 16)}</button>${open ? `<dl class="meal-macros"><div><dt>Proteínas</dt><dd class="mono">${meal.protein} g</dd></div><div><dt>Carbohidratos</dt><dd class="mono">${meal.carbs} g</dd></div><div><dt>Grasas</dt><dd class="mono">${meal.fats} g</dd></div></dl>` : ''}</li>`;
        }).join('')}</ul></div>`).join('') : '<p class="empty">Todavía no hay comidas este día.</p>'}
        <p class="card-foot padded">Los platos registrados no traen fibra: por eso la fibra figura como parcial. Desconocido nunca se cuenta como cero.</p>
      </section>
    </div>
    ${isToday ? addForm(data, ui) : ''}`;
}

function tendenciasTab(data) {
  const catalog = data.nutrition.catalog;
  const target = data.nutrition.target;
  const days = [...data.nutrition.history, ...[...data.nutrition.days].reverse().map((d) => ({ date: d.date, label: d.label.replace('Hoy, martes', 'Hoy'), items: d.meals, closed: d.closed }))];
  const s = dailySeries(days, catalog, target);
  const max = Math.max(target.kcalHigh * 1.15, ...s.points.map((p) => p.kcal));
  return `
    <dl class="stat-strip">
      <div><dt>Promedio (días completos)</dt><dd class="mono">${s.avgKcal == null ? '—' : formatNumber(s.avgKcal)}<small> kcal</small></dd></div>
      <div><dt>Días dentro del rango</dt><dd class="mono">${s.withinDays}<small>/${s.comparableDays}</small></dd></div>
      <div><dt>Proteína promedio</dt><dd class="mono">${s.avgProtein == null ? '—' : formatNumber(s.avgProtein)}<small> g</small></dd></div>
    </dl>
    <section class="card" aria-labelledby="trend-title">
      <div class="card-head"><h2 id="trend-title">Energía por día · últimos ${s.points.length} días</h2><span class="legend"><span class="legend-band" aria-hidden="true"></span>Rango ${formatNumber(target.kcalLow)}–${formatNumber(target.kcalHigh)} kcal</span></div>
      <div class="trend-bars a-care" role="img" aria-label="Energía diaria; ${s.comparableDays} días completos, ${s.withinDays} dentro del rango" ${vars({ lo: (target.kcalLow / max).toFixed(3), hi: (target.kcalHigh / max).toFixed(3) })}>
        <span class="range-band" aria-hidden="true"></span>
        ${s.points.map((p) => `<span class="tcol ${p.complete ? `is-${p.status}` : 'is-partial'}"><span class="tfill" ${vars({ h: pct((p.kcal / max) * 100) })}></span><small>${esc(p.label)}</small></span>`).join('')}
      </div>
      <p class="caption">Barras rayadas: días en curso o con registro incompleto; se muestran pero no entran en el promedio.</p>
    </section>
    ${note('Las tendencias combinan 12 días sintéticos con lo que registres hoy. En Vida 2.0 real, Nutrition Intelligence materializa resúmenes diarios en Google Sheets y Vida recompone desde los registros crudos si están desactualizados.')}`;
}

function nutrientesTab(data, ui) {
  const days = [...data.nutrition.history, ...data.nutrition.days.map((d) => ({ date: d.date, items: d.meals, closed: d.closed }))];
  const windowDays = ui.nutritionWindow ?? 28;
  const report = microWindow(days, data.nutrition.catalog, data.today, windowDays);
  return `
    <div class="chips" role="group" aria-label="Ventana de micronutrientes">${[7, 14, 28, 90].map((n) => `<button type="button" class="chip-btn" data-nutrition-window="${n}" aria-pressed="${windowDays === n}">${n} días</button>`).join('')}</div>
    <dl class="stat-strip"><div><dt>Días registrados en la ventana</dt><dd class="mono">${report.registeredDays}<small>/${windowDays}</small></dd></div>
      <div><dt>Señales con evidencia suficiente</dt><dd class="mono">${report.signals.length}</dd></div>
      <div><dt>Criterio de atención</dt><dd class="mono">3+<small> días evaluables</small></dd></div></dl>
    <section class="card flush" aria-labelledby="micro-title">
      <div class="card-head padded"><h2 id="micro-title">Micronutrientes · promedios comparables</h2><span class="tag a-care">Referencias ilustrativas</span></div>
      <div class="table-wrap"><table class="data-table micro-table"><thead><tr><th scope="col">Nutriente</th><th scope="col">Promedio diario</th><th scope="col">Cobertura</th><th scope="col">Días bajos</th><th scope="col">Lectura</th></tr></thead><tbody>
        ${report.nutrients.map((n) => `<tr><th scope="row">${n.label}<small class="muted micro-ref">Referencia: ${formatDecimal(n.reference)} ${n.unit}</small></th>
          <td class="mono">${n.average === null ? '—' : `${formatDecimal(n.average)} ${n.unit}`}${n.average === null ? '' : `<span class="bar a-care" ${vars({ w: pct(n.average / n.reference * 100) })}><span></span></span>`}</td>
          <td class="mono">${n.evaluable}/${report.registeredDays}</td><td class="mono">${n.lowDays}/${n.evaluable}</td>
          <td><span class="state-pill ${n.signal ? 'is-watch' : n.evaluable < 3 ? '' : 'is-add'}">${n.signal ? 'Atención' : n.evaluable < 3 ? 'Sin evidencia' : 'Sin señal'}</span></td></tr>`).join('')}
      </tbody></table></div>
      <p class="card-foot padded">«Atención» = al menos 3 días evaluables, 2 días bajo el 80 % de la referencia y presencia en ≥50 % de esos días. No es un diagnóstico de deficiencia.</p>
    </section>
    ${note('Un día con comidas compuestas sin receta, datos faltantes o registro abierto se excluye del promedio de ese micronutriente. Por eso la cobertura cambia según la ventana. Las referencias y las cantidades son ficticias y redondeadas; no incluyen suplementos.')}`;
}

function catalogoTab(data) {
  return `<section class="card flush" aria-labelledby="cat-title"><div class="card-head padded"><h2 id="cat-title">Catálogo de la demo</h2><span class="muted small">valores aproximados por 100 g</span></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Alimento</th><th scope="col">kcal</th><th scope="col">Prot.</th><th scope="col">Carb.</th><th scope="col">Grasa</th><th scope="col">Fibra</th><th scope="col">Porciones</th></tr></thead>
    <tbody>${data.nutrition.catalog.map((f) => `<tr><th scope="row">${esc(f.name)}</th><td class="mono">${f.per100.kcal}</td><td class="mono">${f.per100.protein}</td><td class="mono">${f.per100.carbs}</td><td class="mono">${f.per100.fat}</td><td class="mono">${f.per100.fiber ?? '<span class="cov is-partial">sin dato</span>'}</td><td>${f.portions.filter((p) => p.id !== 'g').map((p) => `${p.label} ${p.grams} g`).join(' · ')}</td></tr>`).join('')}</tbody></table></div></section>
    ${note('Catálogo ficticio con valores de referencia redondeados, solo para demostrar cálculos. No reemplaza una base de composición de alimentos.')}`;
}

export function nutritionView(data, ui) {
  const tab = ui.nutritionTab;
  return `${pageHead('Diario de comidas', 'Comer con más claridad.', 'Registrá alimentos por porción y mirá energía, macros y cobertura actualizarse al instante.')}
    ${tabs('nutrition-tab', tab, [['hoy', 'Hoy'], ['tendencias', 'Tendencias'], ['nutrientes', 'Nutrientes'], ['catalogo', 'Catálogo']])}
    ${tab === 'tendencias' ? tendenciasTab(data) : tab === 'nutrientes' ? nutrientesTab(data, ui) : tab === 'catalogo' ? catalogoTab(data) : hoyTab(data, ui)}
    ${note('Comidas, valores y objetivos completamente ficticios. Esta demo no ofrece asesoramiento nutricional.')}`;
}
