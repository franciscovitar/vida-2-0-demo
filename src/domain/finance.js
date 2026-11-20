/**
 * Finanzas (puro). Adaptado del Finance OS de Vida 2.0:
 * - Safe-to-Spend (`safe-to-spend-v1.0.0`): liquidez elegible − reserva − obligaciones − metas − otros;
 *   se muestra max(0, raw) y un raw negativo queda como faltante explícito. Describe capacidad, no recomienda.
 * - Simulador de compra local: no escribe nada ni emite "comprá / no compres".
 * - Vista económica: las transferencias internas no cuentan como ingreso ni gasto.
 * - Resiliencia: participación del ingreso laboral y volatilidad mensual (desvío poblacional / media),
 *   solo con ≥ 3 meses observados.
 */

export const SAFE_TO_SPEND_VERSION = 'safe-to-spend-v1.0.0';

const sumAmounts = (items) => items.reduce((total, item) => total + item.amount, 0);

export function safeToSpend(planning) {
  const parts = {
    liquidity: planning.liquidity,
    reserve: planning.reserve,
    obligations: sumAmounts(planning.obligations),
    goals: sumAmounts(planning.goals),
    other: sumAmounts(planning.other),
  };
  for (const [key, value] of Object.entries(parts)) {
    if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${key} debe ser un entero no negativo`);
  }
  const committed = parts.reserve + parts.obligations + parts.goals + parts.other;
  const raw = parts.liquidity - committed;
  return {
    version: SAFE_TO_SPEND_VERSION,
    ...parts,
    committed,
    raw,
    value: Math.max(0, raw),
    shortfall: Math.max(0, -raw),
    status: raw > 0 ? 'available' : raw === 0 ? 'fully-committed' : 'shortfall',
  };
}

/** Escenario de compra: capacidad después de comprar, reserva consumida y exceso sobre la liquidez. */
export function purchaseScenario(planning, amount) {
  const before = safeToSpend(planning);
  if (!Number.isSafeInteger(amount) || amount <= 0) return { valid: false, before };
  const after = safeToSpend({ ...planning, liquidity: Math.max(0, planning.liquidity - amount) });
  const beyondSafe = Math.max(0, amount - before.value);
  const beyondLiquidity = Math.max(0, amount - planning.liquidity);
  // Parte de la compra que supera la capacidad libre pero todavía cabe en la liquidez: usa dinero comprometido.
  const protectedConsumed = Math.max(0, Math.min(amount, planning.liquidity) - before.value);
  return {
    valid: true,
    amount,
    before,
    after,
    beyondSafe,
    beyondLiquidity,
    protectedConsumed,
    state: beyondLiquidity > 0 ? 'beyond-liquidity' : beyondSafe > 0 ? 'uses-commitments' : 'within-capacity',
  };
}

/** Clasificación económica de movimientos: las transferencias propias no son ingreso ni gasto. */
export function economicSummary(movements) {
  const income = movements.filter((m) => m.kind === 'income').reduce((t, m) => t + m.amount, 0);
  const expense = movements.filter((m) => m.kind === 'expense').reduce((t, m) => t + m.amount, 0);
  const excluded = movements.filter((m) => m.kind === 'transfer').reduce((t, m) => t + m.amount, 0);
  return { income, expense, net: income - expense, excluded };
}

export function resilience(incomeHistory) {
  const months = incomeHistory.filter((m) => m.work + m.other > 0);
  const total = months.reduce((t, m) => t + m.work + m.other, 0);
  const earnedShare = total > 0 ? months.reduce((t, m) => t + m.work, 0) / total : null;
  if (months.length < 3) return { months: months.length, earnedShare, volatility: null };
  const values = months.map((m) => m.work + m.other);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((t, v) => t + (v - mean) ** 2, 0) / values.length;
  return { months: months.length, earnedShare, volatility: mean > 0 ? Math.sqrt(variance) / mean : null, mean };
}

/** Meses de cobertura de la reserva frente al gasto esencial mensual declarado. */
export function coverageMonths(planning, essentialMonthly) {
  if (!(essentialMonthly > 0)) return null;
  return { reserve: planning.reserve / essentialMonthly, liquidity: planning.liquidity / essentialMonthly };
}
