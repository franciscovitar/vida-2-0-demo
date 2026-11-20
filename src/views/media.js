/** Vista Películas y series: biblioteca, progreso por temporada, calificaciones y resumen. Plantillas puras. */
import { formatNumber } from '../../logic.js';
import { esc, icon, note, pageHead, pct, tabs, vars } from './ui.js';
import { collectionEditor } from './collection-fields.js';

const STATUS = { watching: 'En curso', planned: 'Pendiente', completed: 'Terminada', paused: 'En pausa' };

export function seriesProgress(series) {
  const episodes = series.seasons.reduce((t, s) => t + s.episodes, 0);
  const watched = series.seasons.reduce((t, s) => t + s.watched, 0);
  const current = series.seasons.find((s) => s.watched < s.episodes) ?? series.seasons.at(-1);
  const status = series.paused && watched !== episodes ? 'paused' : watched === 0 ? 'planned' : watched === episodes ? 'completed' : 'watching';
  return { episodes, watched, current, status, minutes: watched * series.minutesPerEpisode };
}

function films(data, ui) {
  const watched = data.movies.filter((m) => m.watched).length;
  const options = [['Todas', data.movies.length], ['Por ver', data.movies.length - watched], ['Vistas', watched]];
  const visible = data.movies.filter((m) => ui.moviesFilter === 'Todas' || (ui.moviesFilter === 'Por ver' ? !m.watched : m.watched));
  return `
    <div class="chips" role="group" aria-label="Filtrar películas">${options.map(([o, n]) => `<button type="button" class="chip-btn" data-movies-filter="${o}" aria-pressed="${ui.moviesFilter === o}">${o} <span class="mono">${n}</span></button>`).join('')}</div>
    <div class="movie-grid">${visible.map((m) => `
      <article class="movie">
        <div class="poster poster-${m.color}" aria-hidden="true"><span class="mono">${m.year}</span><strong>${esc(m.title)}</strong></div>
        <h2 class="sr-only">${esc(m.title)}</h2>
        <p class="muted small">${esc(m.genre)} · ${m.watched ? (m.rating ? `${m.rating}/5` : 'vista sin calificar') : 'por ver'}${m.watchedOn ? ` · ${esc(m.watchedOn)}` : ''}</p>
        ${m.note ? `<p class="small movie-note">${esc(m.note)}</p>` : ''}
        <button type="button" class="btn ${m.watched ? 'btn-life' : 'btn-outline'} btn-block" data-movie-toggle="${esc(m.id)}" aria-pressed="${m.watched}">${m.watched ? `${icon('check', 16)} Vista` : 'Marcar como vista'}</button>
        <div class="item-actions"><button type="button" class="link-btn" data-collection-edit="media.movie|${esc(m.id)}">Editar ficha</button><button type="button" class="link-btn" data-collection-remove="media.movie|${esc(m.id)}">Quitar</button></div>
      </article>`).join('')}
    </div>
    ${visible.length ? '' : '<p class="empty">No hay películas en este filtro.</p>'}`;
}

function stars(series, season) {
  return `<span class="stars" role="group" aria-label="Calificar temporada ${season.n} de ${esc(series.title)}">${[1, 2, 3, 4, 5].map((r) => `<button type="button" class="star ${season.rating >= r ? 'is-on' : ''}" data-season-rate="${series.id}:${season.n}:${r}" aria-pressed="${season.rating === r}" aria-label="${r} de 5">★</button>`).join('')}</span>`;
}

function seriesTab(data, ui) {
  const rows = data.series.map((s) => ({ s, p: seriesProgress(s) }));
  const filter = ui.seriesFilter;
  const visible = rows.filter(({ p }) => filter === 'all' || p.status === filter);
  return `
    <div class="chips" role="group" aria-label="Filtrar series">${[['all', 'Todas'], ['watching', 'En curso'], ['planned', 'Pendientes'], ['paused', 'En pausa'], ['completed', 'Terminadas']].map(([id, label]) => `<button type="button" class="chip-btn" data-series-filter="${id}" aria-pressed="${filter === id}">${label} <span class="mono">${id === 'all' ? rows.length : rows.filter((r) => r.p.status === id).length}</span></button>`).join('')}</div>
    <div class="series-list">${visible.map(({ s, p }) => `
      <article class="card series" aria-labelledby="se-${esc(s.id)}">
        <div class="poster poster-${s.color} poster-sm" aria-hidden="true"><span class="mono">${s.year}</span><strong>${esc(s.title)}</strong></div>
        <div class="series-body">
          <div class="series-head"><div><h2 id="se-${esc(s.id)}">${esc(s.title)}</h2><p class="muted small">${esc(s.genre)} · ${s.seasons.length} ${s.seasons.length === 1 ? 'temporada' : 'temporadas'} · ${s.minutesPerEpisode} min por episodio</p></div><span class="state-pill is-${p.status === 'completed' ? 'add' : p.status === 'watching' ? 'watch' : 'idle'}">${STATUS[p.status]}</span></div>
          ${s.note ? `<p class="small movie-note">${esc(s.note)}</p>` : ''}
          <div class="series-progress"><span class="bar a-life" ${vars({ w: pct((p.watched / p.episodes) * 100) })}><span></span></span><span class="mono small">${p.watched}/${p.episodes} episodios</span></div>
          <ul class="seasons">${s.seasons.map((season) => `<li><span>Temporada ${season.n}</span><span class="mono small">${season.watched}/${season.episodes}</span>${season.watched === season.episodes ? stars(s, season) : '<span class="muted small">calificable al terminarla</span>'}</li>`).join('')}</ul>
          <div class="series-actions">
            ${p.watched !== p.episodes ? `<button type="button" class="btn btn-outline btn-sm" data-episode="${esc(s.id)}">${icon('plus', 14)} Vi un episodio · T${p.current.n}E${p.current.watched + 1}</button>` : ''}
            <button type="button" class="chip-btn chip-sm" data-collection-edit="media.season|${esc(s.id)}">${icon('plus', 13)} Temporada</button>
            <button type="button" class="chip-btn chip-sm" data-series-pause="${esc(s.id)}">${s.paused ? 'Reanudar' : 'Pausar'}</button>
            <button type="button" class="chip-btn chip-sm" data-collection-edit="media.series|${esc(s.id)}">Editar</button>
            <button type="button" class="chip-btn chip-sm" data-collection-remove="media.series|${esc(s.id)}">Quitar</button>
          </div>
        </div>
      </article>`).join('')}
    </div>`;
}

function summaryTab(data) {
  const seriesRows = data.series.map((s) => ({ s, p: seriesProgress(s) }));
  const ratings = [...data.movies.filter((m) => m.watched && m.rating).map((m) => m.rating), ...data.series.flatMap((s) => s.seasons.filter((x) => x.rating).map((x) => x.rating))];
  const genres = new Map();
  for (const m of data.movies.filter((x) => x.watched)) genres.set(m.genre, (genres.get(m.genre) ?? 0) + 1);
  for (const { s, p } of seriesRows) if (p.watched) genres.set(s.genre, (genres.get(s.genre) ?? 0) + 1);
  const maxGenre = Math.max(1, ...genres.values());
  return `
    <dl class="stat-strip four">
      <div><dt>Películas vistas</dt><dd class="mono">${data.movies.filter((m) => m.watched).length}</dd></div>
      <div><dt>Episodios vistos</dt><dd class="mono">${seriesRows.reduce((t, r) => t + r.p.watched, 0)}</dd></div>
      <div><dt>Horas de series</dt><dd class="mono">${formatNumber(seriesRows.reduce((t, r) => t + r.p.minutes, 0) / 60)}</dd></div>
      <div><dt>Calificación promedio</dt><dd class="mono">${ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1).replace('.', ',') : '—'}<small>/5</small></dd></div>
    </dl>
    <section class="card" aria-labelledby="genre-title"><h2 id="genre-title">Títulos vistos por género</h2>${genres.size ? `<ul class="hbars">${[...genres].map(([g, n]) => `<li><span>${esc(g)}</span><span class="bar a-life" ${vars({ w: pct((n / maxGenre) * 100) })}><span></span></span><span class="mono">${n}</span></li>`).join('')}</ul>` : '<p class="muted">Todavía no hay títulos vistos.</p>'}</section>
    ${note('El original suma calificación por temporada, revisionados, notas externas y una ruta cinéfila propia. Las afinidades personales quedan fuera de la demo por ser demasiado específicas.')}`;
}

export function mediaView(data, ui) {
  const watched = data.movies.filter((m) => m.watched).length;
  const tab = ui.mediaTab;
  return `${pageHead('Vivir · títulos y carteles inventados', 'Tus historias favoritas.', `${data.movies.length} títulos · ${watched} vistos`)}
    <div class="module-actions"><p class="muted small">Registrá títulos, notas y progreso con datos de ejemplo. Sin catálogo ni streaming real.</p><button type="button" class="btn btn-dark btn-sm" data-collection-edit="${tab === 'series' ? 'media.series' : 'media.movie'}">${icon('plus', 15)} ${tab === 'series' ? 'Agregar serie' : 'Agregar película'}</button></div>
    ${ui.collectionEditor?.kind?.startsWith('media.') ? (() => {
      const edit = ui.collectionEditor;
      const kind = edit.kind;
      const model = edit.values ?? (kind === 'media.movie' ? data.movies.find((m) => m.id === edit.id) : kind === 'media.series' ? data.series.find((s) => s.id === edit.id) : { seriesId: edit.seriesId }) ?? {};
      return collectionEditor(kind, model, data, ui.formErrors.collection ?? {}, kind === 'media.season' ? 'Nueva temporada' : edit.id ? 'Editar ficha' : `Agregar ${kind === 'media.movie' ? 'película' : 'serie'}`);
    })() : ''}
    ${tabs('media-tab', tab, [['films', 'Películas'], ['series', 'Series'], ['summary', 'Resumen']])}
    ${tab === 'series' ? seriesTab(data, ui) : tab === 'summary' ? summaryTab(data) : films(data, ui)}
    ${note('Títulos y carteles inventados para esta demo. No hay integración con catálogos ni streaming.')}`;
}
