/** Importador DEMOSTRATIVO de una muestra fija, sin selector de archivos ni conexión bancaria. */
export const EXAMPLE_STATEMENT = `fecha;detalle;importe;tipo;categoria;referencia
2026-11-03;Sueldo;1500000;income;other;EX-001
2026-11-12;Supermercado;18500;expense;food;EX-002
2026-11-13;Café y merienda;6500;expense;leisure;EX-003
2026-11-14;Transferencia entre cuentas propias;80000;transfer;other;EX-004
2026-11-15;Compra sin categoría;4000;expense;unknown;EX-005
2026-11-12;Supermercado;18500;expense;food;EX-002
2026-11-16;Movimiento negativo;-1500;expense;other;EX-006
2026-11-16;Devolución;3500;income;other;EX-007`;

const COLUMNS = ['fecha', 'detalle', 'importe', 'tipo', 'categoria', 'referencia'];
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
const identity = (row) => `${row.date}|${row.kind}|${row.amount}|${normalize(row.description)}`;
const civilDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

/** Preflight reproducible: validez, referencia duplicada, conciliación contra el registro y revisión. */
export function preflightStatement(text, finances) {
  const lines = String(text).trim().split(/\r?\n/);
  if (normalize(lines.shift()) !== COLUMNS.join(';')) return { ok: false, error: 'Encabezado incompatible con el extracto de muestra.', rows: [], eligible: 0 };
  const seen = new Map();
  const existing = new Set([...finances.ledger, ...finances.movements.map((m) => ({ ...m, kind: 'expense' }))].map(identity));
  const categories = new Set(finances.categories.map((c) => c.id));
  const rows = lines.map((line, index) => {
    const cells = line.split(';').map((s) => s.trim());
    const [date, description, rawAmount, kind, categoryId, reference] = cells;
    const amount = Number(rawAmount);
    const row = { line: index + 2, date, description, amount, kind, categoryId, reference };
    if (cells.length !== COLUMNS.length || !civilDate(date) || !description || !reference || !Number.isSafeInteger(amount) || amount <= 0 || !['income', 'expense', 'transfer'].includes(kind)) {
      return { ...row, status: 'invalid', reason: 'Fecha, tipo o importe inválido' };
    }
    if (kind === 'expense' && !categories.has(categoryId)) return { ...row, status: 'review', reason: 'Categoría desconocida: requiere revisión' };
    const signature = identity(row);
    if (seen.has(reference)) return { ...row, status: seen.get(reference) === signature ? 'duplicate' : 'review', reason: seen.get(reference) === signature ? 'Repetido en el archivo' : 'Referencia reutilizada con contenido distinto' };
    seen.set(reference, signature);
    if (finances.importedFingerprints?.[reference]) {
      const isSame = finances.importedFingerprints[reference] === signature;
      return { ...row, status: isSame ? 'duplicate' : 'review', reason: isSame ? 'Ya importado' : 'Referencia importada con datos distintos' };
    }
    if (existing.has(signature)) return { ...row, status: 'duplicate', reason: 'Ya existe en movimientos' };
    return { ...row, status: 'candidate', reason: kind === 'transfer' ? 'Transferencia excluida del balance económico' : 'Listo para incorporar' };
  });
  return { ok: true, rows, eligible: rows.filter((r) => r.status === 'candidate').length };
}

/** Revalida contra el estado actual: reejecutar o presionar dos veces no duplica registros. */
export function applyExampleImport(data, text = EXAMPLE_STATEMENT) {
  const report = preflightStatement(text, data.finances);
  if (!report.ok || !report.eligible) return 0;
  data.finances.importedFingerprints ??= {};
  for (const row of report.rows.filter((r) => r.status === 'candidate')) {
    const entry = { id: `import-${row.reference}`, date: row.date, description: row.description, amount: row.amount };
    if (row.kind === 'expense') {
      data.finances.movements.push({ ...entry, categoryId: row.categoryId });
      data.finances.categories.find((c) => c.id === row.categoryId).spent += row.amount;
      data.finances.planning.liquidity = Math.max(0, data.finances.planning.liquidity - row.amount);
    } else {
      data.finances.ledger.push({ ...entry, kind: row.kind });
      if (row.kind === 'income') data.finances.planning.liquidity += row.amount;
    }
    data.finances.importedFingerprints[row.reference] = identity(row);
  }
  return report.eligible;
}
