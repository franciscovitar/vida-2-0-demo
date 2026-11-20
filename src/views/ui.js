/** Helpers de presentación compartidos por las vistas (plantillas puras, sin DOM). */
import { icon } from '../../icons.js';

/** Escapa texto que puede venir del visitante antes de interpolarlo en HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Valores dinámicos: se aplican como variables CSS desde app.js (compatible con la CSP). */
export const vars = (entries) => `data-vars="${Object.entries(entries).map(([k, v]) => `--${k}:${v}`).join(';')}"`;
export const pct = (value) => `${Math.max(0, Math.min(100, Math.round(value)))}%`;

export function pageHead(kicker, title, lead = '') {
  return `<header class="page-head"><p class="kicker">${kicker}</p><h1 tabindex="-1">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</header>`;
}

export function note(text) {
  return `<p class="note">${icon('info', 16)}<span>${text}</span></p>`;
}

export function segments(done, total, area) {
  return `<span class="segments a-${area}" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<span class="${i < done ? 'on' : ''}"></span>`).join('')}</span>`;
}

export function ring(done, total, size = 60, stroke = 7, label = '') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = total ? (c * Math.min(done, total)) / total : 0;
  return `<span class="ring"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}"><circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/><circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${filled.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><span class="ring-label mono">${done}/${total}</span></span>`;
}

/** Pestañas internas de un módulo (progresive disclosure). */
export function tabs(name, current, options) {
  return `<div class="seg-control module-tabs" role="group" aria-label="Secciones">${options.map(([id, label]) => `<button type="button" data-${name}="${id}" aria-pressed="${current === id}">${label}</button>`).join('')}</div>`;
}

export function fieldError(errors, key) {
  return errors?.[key] ? `<span class="field-error" role="alert">${esc(errors[key])}</span>` : '';
}

const SHORT_DATE = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const shortDate = (iso) => SHORT_DATE.format(new Date(`${iso}T12:00:00Z`)).replace('.', '');

export { icon };
