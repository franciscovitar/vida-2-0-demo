/** Campos compartidos entre los formularios de cada módulo y el registro global. */
import { esc, fieldError, icon } from './ui.js';

const input = (name, label, raw, attrs = '', errors = {}) => `<label class="field"><span>${label}</span><input name="${name}" value="${esc(raw ?? '')}" ${attrs}/>${fieldError(errors, name)}</label>`;
const area = (name, label, raw, errors = {}) => `<label class="field editor-wide"><span>${label}</span><textarea name="${name}" rows="2" maxlength="600">${esc(raw ?? '')}</textarea>${fieldError(errors, name)}</label>`;
const select = (name, label, choices, current) => `<label class="field"><span>${label}</span><select name="${name}">${choices.map(([id, label]) => `<option value="${esc(id)}" ${String(id) === String(current) ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>`;

export const COLLECTION_KINDS = {
  'shopping.item': 'Producto de compras', 'media.movie': 'Película', 'media.series': 'Serie', 'media.season': 'Temporada', 'study.deck': 'Mazo de estudio', 'study.card': 'Tarjeta de estudio',
};

export function collectionFields(kind, v, data, errors = {}) {
  if (kind === 'shopping.item') return `${input('name', 'Producto', v.name, 'maxlength="80" placeholder="Ej.: Café molido"', errors)}
    ${input('category', 'Categoría', v.category ?? 'Almacén', 'maxlength="40" placeholder="Almacén"', errors)}
    ${input('amount', 'Cantidad y unidad', v.amount ?? '1 paquete', 'maxlength="40" placeholder="500 g"', errors)}`;
  if (kind === 'media.movie') return `${input('title', 'Título', v.title, 'maxlength="100" placeholder="Ej.: La estación lunar"', errors)}
    ${input('genre', 'Género', v.genre ?? 'Drama', 'maxlength="40"', errors)}
    ${input('year', 'Año', v.year ?? 2025, 'type="number" min="1900" max="2100"', errors)}
    ${select('status', 'Estado', [['planned', 'Por ver'], ['watched', 'Vista']], v.status ?? (v.watched ? 'watched' : 'planned'))}
    ${select('rating', 'Calificación (si la viste)', [['', 'Sin calificar'], ...[1, 2, 3, 4, 5].map((n) => [n, `${n}/5`])], v.rating ?? '')}
    ${input('watchedOn', 'Fecha en que la viste (opcional)', v.watchedOn ?? '', `type="date" max="${data.today}"`, errors)}
    ${area('note', 'Comentario personal (opcional)', v.note, errors)}`;
  if (kind === 'media.series') return `${input('title', 'Título', v.title, 'maxlength="100"', errors)}
    ${input('genre', 'Género', v.genre ?? 'Drama', 'maxlength="40"', errors)}
    ${input('year', 'Año', v.year ?? 2025, 'type="number" min="1900" max="2100"', errors)}
    ${input('minutesPerEpisode', 'Minutos por episodio', v.minutesPerEpisode ?? 45, 'type="number" min="5" max="180"', errors)}
    ${v.id ? '' : input('episodes', 'Episodios de la primera temporada', v.episodes ?? 8, 'type="number" min="1" max="60"', errors)}
    ${area('note', 'Comentario (opcional)', v.note, errors)}`;
  if (kind === 'media.season') return input('episodes', 'Episodios de la nueva temporada', v.episodes ?? 8, 'type="number" min="1" max="60"', errors);
  if (kind === 'study.deck') return `${input('title', 'Nombre del mazo', v.title, 'maxlength="80" placeholder="Ej.: Fundamentos de diseño"', errors)}
    ${input('topic', 'Materia o tema', v.topic ?? 'Aprendizaje', 'maxlength="40"', errors)}
    ${v.id ? '' : `${area('front', 'Primera pregunta', v.front, errors)}${area('back', 'Respuesta', v.back, errors)}`}`;
  if (kind === 'study.card') return `${v.deckId ? '' : select('deckId', 'Mazo', data.decks.map((d) => [d.id, d.title]), v.deckId ?? data.decks[0]?.id)}
    ${area('front', 'Pregunta', v.front, errors)}${area('back', 'Respuesta', v.back, errors)}`;
  return '';
}

export function collectionEditor(kind, model, data, errors = {}, title = '') {
  const label = title || `${model.id || model.index !== undefined ? 'Editar' : 'Agregar'} ${COLLECTION_KINDS[kind].toLowerCase()}`;
  const dataset = [model.id && `data-id="${esc(model.id)}"`, model.deckId && `data-deck-id="${esc(model.deckId)}"`, model.index !== undefined && `data-index="${model.index}"`, model.seriesId && `data-series-id="${esc(model.seriesId)}"`].filter(Boolean).join(' ');
  return `<section class="card inline-editor" aria-label="${esc(label)}"><h2>${esc(label)}</h2>
    <form data-capture-form="collection" data-kind="${kind}" ${dataset} novalidate>
      <div class="form-grid">${collectionFields(kind, model, data, errors)}</div>
      <div class="editor-actions"><button type="submit" class="btn btn-dark btn-sm">${icon('check', 15)} Guardar</button><button type="button" class="btn btn-outline btn-sm" data-editor-close>Cancelar</button></div>
    </form></section>`;
}
