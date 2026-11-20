/** Vista Finanzas: presupuesto, capacidad (Safe-to-Spend + simulador), movimientos y resiliencia. */
import { financeSummary, formatMoney } from '../../logic.js';
import { coverageMonths, economicSummary, purchaseScenario, resilience, safeToSpend } from '../domain/finance.js';
import { EXAMPLE_STATEMENT, preflightStatement } from '../domain/importer.js';
import { esc, fieldError, icon, note, pageHead, pct, shortDate, tabs, vars } from './ui.js';

const pctText = (v) => `${Math.round(v * 100)} %`;

function budgetTab(data, ui, f) {
  const selected = f.categories.find((c) => c.id === ui.financeCategory) ?? f.categories[0];
  const pacePct = Math.round(f.pace * 100);
  const months = [...data.finances.months.slice(0, -1), Math.round(f.spent / 1000)];
  const max = Math.max(...months);
  return `
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
    </div>`;
}

function capacityTab(data, ui) {
  const planning = data.finances.planning;
  const s = safeToSpend(planning);
  const parts = [['reserve', 'Reserva protegida', s.reserve], ['obligations', 'Obligaciones próximas', s.obligations], ['goals', 'Metas comprometidas', s.goals], ['free', 'Disponible para gastar', s.value]];
  const base = Math.max(planning.liquidity, s.committed);
  const scenario = ui.purchase ? purchaseScenario(planning, ui.purchase) : null;
  const cover = coverageMonths(planning, planning.essentialMonthly);
  const err = ui.formErrors.purchase ?? {};
  const stateText = scenario && {
    'within-capacity': 'Entra dentro de la capacidad libre: no toca dinero comprometido.',
    'uses-commitments': `Supera la capacidad libre en ${formatMoney(scenario.beyondSafe)}: usaría dinero ya comprometido para reserva, obligaciones o metas.`,
    'beyond-liquidity': `Supera la liquidez elegible en ${formatMoney(scenario.beyondLiquidity)}.`,
  }[scenario.state];
  return `
    <section class="card capacity" aria-labelledby="s2s-title">
      <div class="card-head"><div><p class="eyebrow a-life">Safe-to-Spend · ${s.version}</p><h2 id="s2s-title" class="hero-number mono">${formatMoney(s.value)}<span> libres para gastar</span></h2></div><span class="status-pill ${s.status === 'available' ? 'is-impl' : 'is-flag'}">${s.status === 'available' ? 'Con capacidad' : s.status === 'shortfall' ? `Faltante de ${formatMoney(s.shortfall)}` : 'Todo comprometido'}</span></div>
      <div class="stack-bar" role="img" aria-label="Liquidez de ${formatMoney(planning.liquidity)} repartida entre compromisos y capacidad libre">${parts.map(([id, , v]) => `<span class="seg-${id}" ${vars({ w: pct((v / base) * 100) })}></span>`).join('')}</div>
      <dl class="formula">
        <div><dt>Liquidez elegible</dt><dd class="mono">${formatMoney(planning.liquidity)}</dd></div>
        ${parts.slice(0, 3).map(([id, label, v]) => `<div><dt><span class="key seg-${id}" aria-hidden="true"></span>− ${label}</dt><dd class="mono">${formatMoney(v)}</dd></div>`).join('')}
        <div class="is-total"><dt><span class="key seg-free" aria-hidden="true"></span>= Disponible</dt><dd class="mono">${formatMoney(s.value)}</dd></div>
      </dl>
      <p class="muted small">Describe capacidad, no es una recomendación de gastar. Cada gasto registrado reduce la liquidez elegible.</p>
    </section>
    <div class="split even">
      <section class="card" aria-labelledby="sim-title">
        <h2 id="sim-title">Simulador de compra</h2>
        <p class="muted small">Se calcula en esta pestaña; no registra nada.</p>
        <form class="sim-form" data-capture-form="purchase" novalidate>
          <label class="field"><span>Importe de la compra (ARS)</span><input name="amount" type="number" inputmode="numeric" min="1" step="1" value="${ui.purchase ?? ''}" placeholder="250000"/>${fieldError(err, 'amount')}</label>
          <button type="submit" class="btn btn-dark">Simular</button>
        </form>
        ${scenario ? `<div class="sim-result is-${scenario.state}" role="status"><p><strong>${stateText}</strong></p>
          <dl class="facts three"><div><dt>Capacidad después</dt><dd class="mono">${formatMoney(scenario.after.value)}</dd></div><div><dt>Comprometido usado</dt><dd class="mono">${formatMoney(scenario.protectedConsumed)}</dd></div><div><dt>Liquidez después</dt><dd class="mono">${formatMoney(Math.max(0, planning.liquidity - scenario.amount))}</dd></div></dl></div>` : ''}
      </section>
      <section class="card" aria-labelledby="commit-title">
        <h2 id="commit-title">Compromisos</h2>
        <ul class="movements">${planning.obligations.map((o) => `<li><span><strong>${esc(o.label)}</strong><small>vence ${shortDate(o.due)}</small></span><span class="mono">${formatMoney(o.amount)}</span></li>`).join('')}${planning.goals.map((g) => `<li><span><strong>${esc(g.label)}</strong><small>meta comprometida</small></span><span class="mono">${formatMoney(g.amount)}</span></li>`).join('')}<li><span><strong>Reserva protegida</strong><small>${cover ? `cubre ${cover.reserve.toFixed(1).replace('.', ',')} meses de gasto esencial` : ''}</small></span><span class="mono">${formatMoney(planning.reserve)}</span></li></ul>
      </section>
    </div>`;
}

function movementsTab(data, ui, f) {
  const visit = data.finances.movements.map((m) => ({ ...m, kind: 'expense' }));
  const all = [...visit, ...data.finances.ledger];
  const filter = ui.movementFilter;
  const visible = all.filter((m) => filter === 'all' || m.kind === filter);
  const econ = economicSummary(data.finances.ledger);
  const labels = { income: 'Ingreso', expense: 'Gasto', transfer: 'Excluido' };
  return `
    <dl class="stat-strip">
      <div><dt>Ingresos económicos</dt><dd class="mono">${formatMoney(econ.income)}</dd></div>
      <div><dt>Gastos del mes</dt><dd class="mono">${formatMoney(f.spent)}</dd></div>
      <div><dt>Excluido (no es ingreso ni gasto)</dt><dd class="mono">${formatMoney(econ.excluded)}</dd></div>
    </dl>
    <section class="card flush" aria-labelledby="ledger-title">
      <div class="card-head padded"><h2 id="ledger-title">Movimientos</h2><div class="chips" role="group" aria-label="Filtrar movimientos">${[['all', 'Todos'], ['income', 'Ingresos'], ['expense', 'Gastos'], ['transfer', 'Excluidos']].map(([id, label]) => `<button type="button" class="chip-btn" data-movement-filter="${id}" aria-pressed="${filter === id}">${label}</button>`).join('')}</div></div>
      ${visible.length ? `<ul class="ledger">${visible.map((m) => `<li class="is-${m.kind}"><span class="ledger-date mono">${shortDate(m.date)}</span><span class="ledger-text"><strong>${esc(m.description)}</strong><small>${labels[m.kind]}${m.kind === 'transfer' ? ' · no cuenta en la vista económica' : ''}</small></span><span class="mono">${m.kind === 'income' ? '+' : m.kind === 'expense' ? '−' : '↔'}${formatMoney(m.amount)}</span></li>`).join('')}</ul>` : '<p class="empty">No hay movimientos en este filtro todavía.</p>'}
      <p class="card-foot padded">Los gastos por categoría del mes ya están consolidados en Presupuesto; acá ves ingresos, transferencias y lo que registres en esta visita.</p>
    </section>`;
}

function resilienceTab(data) {
  const r = resilience(data.finances.incomeHistory);
  const max = Math.max(...data.finances.incomeHistory.map((m) => m.work + m.other));
  return `
    <dl class="stat-strip">
      <div><dt>Ingreso de trabajo</dt><dd class="mono">${r.earnedShare == null ? '—' : pctText(r.earnedShare)}</dd></div>
      <div><dt>Volatilidad mensual</dt><dd class="mono">${r.volatility == null ? '—' : `${(r.volatility * 100).toFixed(1).replace('.', ',')} %`}</dd></div>
      <div><dt>Meses observados</dt><dd class="mono">${r.months}</dd></div>
    </dl>
    <section class="card" aria-labelledby="income-title">
      <div class="card-head"><h2 id="income-title">Ingresos de los últimos 6 meses</h2><span class="muted small">trabajo + financieros</span></div>
      <div class="month-bars a-life" role="img" aria-label="Ingreso mensual estable alrededor de ${formatMoney(r.mean)}">${data.finances.incomeHistory.map((m, i, all) => `<span class="${i === all.length - 1 ? 'is-today' : ''}"><small class="mono">${Math.round((m.work + m.other) / 1000)}</small><span ${vars({ h: pct(((m.work + m.other) / max) * 100) })}></span><small>${m.month}</small></span>`).join('')}</div>
      <p class="caption">Volatilidad = desvío estándar poblacional ÷ promedio; solo se muestra con 3 meses o más. Son indicadores descriptivos separados: no se combinan en un «score financiero».</p>
    </section>`;
}

function importarTab(data) {
  const preview = preflightStatement(EXAMPLE_STATEMENT, data.finances);
  const counts = (status) => preview.rows.filter((r) => r.status === status).length;
  const names = { candidate: 'Incorporar', duplicate: 'Duplicado', review: 'Revisión', invalid: 'Inválido' };
  return `<section class="card" aria-labelledby="import-title">
    <div class="card-head"><div><p class="eyebrow a-life">Preflight + conciliación</p><h2 id="import-title">Extracto de prueba · 8 filas</h2></div><span class="tag">100 % simulado</span></div>
    <p class="muted">Esta muestra local reproduce la secuencia de un importador real: leer, validar, clasificar, detectar duplicados y confirmar. No podés subir extractos reales desde esta demo.</p>
    <dl class="stat-strip import-stats"><div><dt>Candidatos</dt><dd class="mono">${counts('candidate')}</dd></div><div><dt>Duplicados</dt><dd class="mono">${counts('duplicate')}</dd></div><div><dt>Revisar</dt><dd class="mono">${counts('review')}</dd></div><div><dt>Inválidos</dt><dd class="mono">${counts('invalid')}</dd></div></dl>
    <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Fecha / ref.</th><th scope="col">Detalle</th><th scope="col">Importe</th><th scope="col">Conciliación</th></tr></thead><tbody>
      ${preview.rows.map((r) => `<tr><td class="mono">${esc(r.date)}<small class="micro-ref muted">${esc(r.reference)}</small></td><td>${esc(r.description)}<small class="micro-ref muted">${esc(r.reason)}</small></td><td class="mono">${formatMoney(Number.isSafeInteger(r.amount) ? Math.abs(r.amount) : 0)}</td><td><span class="state-pill ${r.status === 'candidate' ? 'is-add' : r.status === 'duplicate' ? '' : 'is-watch'}">${names[r.status]}</span></td></tr>`).join('')}
    </tbody></table></div>
    <div class="import-action"><p class="muted small">Las filas ambiguas o inválidas quedan fuera. Las transferencias propias se registran sin computar ingreso ni gasto. Podés deshacer la importación.</p>
      <button type="button" class="btn btn-dark" data-finance-import="example" ${preview.eligible ? '' : 'disabled'}>${preview.eligible ? `Confirmar ${preview.eligible} movimientos` : 'Todo conciliado'}</button></div>
  </section>${note('El botón trabaja únicamente sobre datos sintéticos en memoria. Repetir la importación no genera duplicados; «Reiniciar demo» restaura el extracto de muestra.')}`;
}

export function financeView(data, ui) {
  const f = financeSummary(data);
  const tab = ui.financeTab;
  return `${pageHead(`Noviembre · día ${data.demoClock.dayOfMonth} de ${data.demoClock.daysInMonth}`, 'Tu dinero, más claro.', '')}
    ${tabs('finance-tab', tab, [['budget', 'Presupuesto'], ['capacity', 'Capacidad'], ['movements', 'Movimientos'], ['import', 'Importar'], ['resilience', 'Resiliencia']])}
    ${tab === 'capacity' ? capacityTab(data, ui) : tab === 'movements' ? movementsTab(data, ui, f) : tab === 'import' ? importarTab(data) : tab === 'resilience' ? resilienceTab(data) : budgetTab(data, ui, f)}
    ${note('Importes totalmente ficticios y orientados a demostración. No hay conexión con bancos ni asesoramiento financiero.')}`;
}
