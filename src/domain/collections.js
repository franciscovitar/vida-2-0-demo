/** Registros manuales del showcase. Sin backend: solo modifican el estado de esta pestaña. */
const nextRecordId = (data, prefix) => `${prefix}-${(data.seq = (data.seq ?? 0) + 1)}`;

const value = (raw) => String(raw ?? '').trim();
const lengthError = (v, min, max, label) => v.length < min || v.length > max ? `${label}: entre ${min} y ${max} caracteres.` : null;
const numeric = (v, min, max, label) => !Number.isInteger(Number(v)) || value(v) === '' || Number(v) < min || Number(v) > max ? `${label}: entre ${min} y ${max}.` : null;
const addError = (errors, name, error) => { if (error) errors[name] = error; };

export function validateCollection(data, kind, raw) {
  const errors = {};
  const name = value(raw.name ?? raw.title);
  if (kind === 'shopping.item') {
    addError(errors, 'name', lengthError(name, 2, 80, 'Producto'));
    addError(errors, 'category', lengthError(value(raw.category), 2, 40, 'Categoría'));
    addError(errors, 'amount', lengthError(value(raw.amount), 1, 40, 'Cantidad y unidad'));
    if (data.shopping.some((i) => i.id !== raw.id && !i.checked && i.name.toLowerCase() === name.toLowerCase())) errors.name = 'Ese producto ya está pendiente en la lista.';
  } else if (kind === 'media.movie' || kind === 'media.series') {
    addError(errors, 'title', lengthError(name, 2, 100, 'Título'));
    addError(errors, 'genre', lengthError(value(raw.genre), 2, 40, 'Género'));
    addError(errors, 'year', numeric(raw.year, 1900, 2100, 'Año'));
    addError(errors, 'note', value(raw.note).length > 240 ? 'Máximo 240 caracteres.' : null);
    if (kind === 'media.movie') {
      if (!['planned', 'watched'].includes(raw.status)) errors.status = 'Elegí un estado.';
      if (value(raw.rating) && (raw.status !== 'watched' || numeric(raw.rating, 1, 5, 'Calificación'))) errors.rating = 'Calificá de 1 a 5, solo si la viste.';
      if (value(raw.watchedOn) && (!/^\d{4}-\d{2}-\d{2}$/.test(raw.watchedOn) || Number.isNaN(Date.parse(`${raw.watchedOn}T12:00:00Z`)) || raw.watchedOn > data.today || raw.status !== 'watched')) errors.watchedOn = 'Ingresá una fecha válida hasta hoy, para una película vista.';
    } else {
      addError(errors, 'minutesPerEpisode', numeric(raw.minutesPerEpisode, 5, 180, 'Minutos por episodio'));
      if (!raw.id) addError(errors, 'episodes', numeric(raw.episodes, 1, 60, 'Episodios de la primera temporada'));
    }
  } else if (kind === 'media.season') {
    if (!data.series.some((s) => s.id === raw.seriesId)) errors.seriesId = 'Serie no encontrada.';
    addError(errors, 'episodes', numeric(raw.episodes, 1, 60, 'Episodios'));
  } else if (kind === 'study.deck') {
    addError(errors, 'title', lengthError(name, 2, 80, 'Nombre del mazo'));
    addError(errors, 'topic', lengthError(value(raw.topic), 2, 40, 'Materia'));
    if (!raw.id) {
      addError(errors, 'front', lengthError(value(raw.front), 3, 240, 'Primera pregunta'));
      addError(errors, 'back', lengthError(value(raw.back), 3, 600, 'Respuesta'));
    }
  } else if (kind === 'study.card') {
    const deck = data.decks.find((d) => d.id === raw.deckId);
    if (!deck) errors.deckId = 'Elegí un mazo válido.';
    else if (value(raw.index) && (!Number.isInteger(Number(raw.index)) || !deck.cards[Number(raw.index)])) errors.index = 'Tarjeta no encontrada.';
    addError(errors, 'front', lengthError(value(raw.front), 3, 240, 'Pregunta'));
    addError(errors, 'back', lengthError(value(raw.back), 3, 600, 'Respuesta'));
  } else {
    errors.kind = 'Tipo de registro no admitido.';
  }
  if (raw.id && ['shopping.item', 'media.movie', 'media.series', 'study.deck'].includes(kind)) {
    const collection = { 'shopping.item': data.shopping, 'media.movie': data.movies, 'media.series': data.series, 'study.deck': data.decks }[kind];
    if (!collection.some((x) => x.id === raw.id)) errors.id = 'El registro ya no existe.';
  }
  return { ok: !Object.keys(errors).length, errors };
}

/** Llamar únicamente tras validateCollection(). */
export function saveCollection(data, kind, raw) {
  if (kind === 'shopping.item') {
    const item = data.shopping.find((i) => i.id === raw.id);
    const name = value(raw.name);
    const category = value(raw.category);
    const amount = value(raw.amount);
    let need = item?.needId ? data.household.needs.find((n) => n.id === item.needId) : null;
    if (!need || (!need.isDemoAdded && [name, category, amount].some((v, i) => v !== [need.name, need.category, need.amount][i]))) {
      need = data.household.needs.find((n) => n.name.toLowerCase() === name.toLowerCase() && n.category === category && n.amount === amount) ?? null;
    }
    if (!need) {
      need = { id: nextRecordId(data, 'need'), name, category, amount, purchases: [], manualSeedIntervalDays: null, isDemoAdded: true };
      data.household.needs.push(need);
    } else if (need.isDemoAdded) Object.assign(need, { name, category, amount });
    if (item) Object.assign(item, { name, category, amount, needId: need.id });
    else data.shopping.push({ id: nextRecordId(data, 'shop'), name, category, amount, needId: need.id, checked: false });
    return `producto «${name}» ${item ? 'actualizado' : 'agregado'}`;
  }
  if (kind === 'media.movie') {
    const previous = data.movies.find((m) => m.id === raw.id);
    const movie = { title: value(raw.title), genre: value(raw.genre), year: Number(raw.year), watched: raw.status === 'watched', rating: raw.status === 'watched' && value(raw.rating) ? Number(raw.rating) : null, watchedOn: raw.status === 'watched' ? value(raw.watchedOn) || null : null, note: value(raw.note), color: previous?.color ?? 'violet', symbol: previous?.symbol ?? '✧' };
    if (previous) Object.assign(previous, movie);
    else data.movies.push({ id: nextRecordId(data, 'movie'), ...movie });
    return `película «${movie.title}» ${previous ? 'actualizada' : 'agregada'}`;
  }
  if (kind === 'media.series') {
    const previous = data.series.find((s) => s.id === raw.id);
    const series = { title: value(raw.title), genre: value(raw.genre), year: Number(raw.year), minutesPerEpisode: Number(raw.minutesPerEpisode), note: value(raw.note) };
    if (previous) Object.assign(previous, series);
    else data.series.push({ id: nextRecordId(data, 'series'), ...series, color: 'blue', paused: false, seasons: [{ n: 1, episodes: Number(raw.episodes), watched: 0, rating: null }] });
    return `serie «${series.title}» ${previous ? 'actualizada' : 'agregada'}`;
  }
  if (kind === 'media.season') {
    const series = data.series.find((s) => s.id === raw.seriesId);
    series.seasons.push({ n: series.seasons.length + 1, episodes: Number(raw.episodes), watched: 0, rating: null });
    return `temporada ${series.seasons.length} agregada a «${series.title}»`;
  }
  if (kind === 'study.deck') {
    const previous = data.decks.find((d) => d.id === raw.id);
    if (previous) Object.assign(previous, { title: value(raw.title), topic: value(raw.topic) });
    else data.decks.push({ id: nextRecordId(data, 'deck'), title: value(raw.title), topic: value(raw.topic), color: 'green', cards: [{ front: value(raw.front), back: value(raw.back) }] });
    return `mazo «${value(raw.title)}» ${previous ? 'actualizado' : 'creado'}`;
  }
  if (kind === 'study.card') {
    const deck = data.decks.find((d) => d.id === raw.deckId);
    const index = value(raw.index) ? Number(raw.index) : null;
    const card = { front: value(raw.front), back: value(raw.back) };
    if (index !== null) {
      deck.cards[index] = card;
      delete data.study[`${deck.id}:${index}`]; // La pregunta cambió: no conservar un recuerdo anterior.
    } else deck.cards.push(card);
    return `tarjeta ${index === null ? 'agregada' : 'actualizada'} en «${deck.title}»`;
  }
  throw new Error(`Tipo no soportado: ${kind}`);
}

export function removeCollection(data, kind, id, index = '') {
  if (kind === 'study.card') {
    const deck = data.decks.find((d) => d.id === id);
    const n = Number(index);
    if (!deck || deck.cards.length <= 1 || !Number.isInteger(n) || !deck.cards[n]) return false;
    const old = data.study;
    const future = deck.cards.slice(n + 1).map((_, offset) => old[`${id}:${n + offset + 1}`]);
    deck.cards.splice(n, 1);
    for (let i = n; i <= deck.cards.length; i++) delete old[`${id}:${i}`];
    // Conservar los estados de tarjetas posteriores a la eliminada, ya desplazadas.
    future.forEach((state, offset) => { if (state) old[`${id}:${n + offset}`] = state; });
    return true;
  }
  const collection = { 'shopping.item': data.shopping, 'media.movie': data.movies, 'media.series': data.series, 'study.deck': data.decks }[kind];
  if (!collection || (kind === 'study.deck' && collection.length <= 1)) return false;
  const at = collection.findIndex((item) => item.id === id);
  if (at < 0) return false;
  collection.splice(at, 1);
  if (kind === 'study.deck') for (const key of Object.keys(data.study)) if (key.startsWith(`${id}:`)) delete data.study[key];
  return true;
}
