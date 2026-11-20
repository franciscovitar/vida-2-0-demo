/** Vista Inglés: práctica con feedback, perfil del laboratorio y sesiones. Plantillas puras. */
import { esc, fieldError, icon, note, pageHead, segments, shortDate, tabs } from './ui.js';

const STATE = { strong: ['Fuerte', 'add'], stable: ['Estable', 'add'], developing: ['En desarrollo', 'watch'], insufficient: ['Sin evidencia suficiente', 'idle'] };
const TREND = { improving: '↗ mejorando', stable: '→ estable', inconsistent: '↕ irregular', insufficient: '— sin datos' };
const TYPES = { conversation: 'Conversación', listening: 'Escucha', writing: 'Escritura', reading: 'Lectura' };
const VOCAB = { active: 'Activa', learning: 'Aprendiendo', new: 'Nueva' };

function practice(data, ui) {
  const q = data.english.questions[ui.englishIndex];
  const answered = ui.englishAnswer !== '';
  const correct = answered && ui.englishAnswer === q.correct;
  const weakness = !correct && answered ? data.english.lab.weaknesses.find((w) => w.id === q.pattern) : null;
  const inDeck = weakness && data.decks.find((d) => d.id === 'english').cards.some((c) => c.front === weakness.card.front);
  return `
    <div class="streak a-learn">${icon('star', 20)}<span><strong>${data.english.streak} días</strong> de racha · pregunta ${ui.englishIndex + 1} de ${data.english.questions.length}</span>${segments(ui.englishIndex + (answered ? 1 : 0), data.english.questions.length, 'learn')}</div>
    <section class="card quiz" aria-labelledby="quiz-q">
      <h2 id="quiz-q" class="quiz-prompt">${q.prompt}</h2>
      <div class="choices" role="group" aria-label="Opciones">${q.choices.map((choice) => {
        const state = answered && choice === q.correct ? 'is-correct' : answered && choice === ui.englishAnswer ? 'is-wrong' : '';
        const mark = state === 'is-correct' ? 'Correcta' : state === 'is-wrong' ? 'Tu respuesta' : '';
        return `<button type="button" class="choice ${state}" data-english-answer="${choice}" ${answered ? 'disabled' : ''}><span>${choice}</span>${mark ? `<small>${mark}</small>` : ''}</button>`;
      }).join('')}</div>
      ${answered ? `<div class="feedback ${correct ? 'is-correct' : 'is-wrong'}" role="status"><strong>${correct ? '¡Muy bien!' : `Casi. Seguí practicando: la respuesta es «${q.correct}».`}</strong><p>${q.note}</p></div>
        ${weakness ? `<div class="pattern-hint"><p>${icon('info', 15)} <span>Coincide con un patrón recurrente de tu perfil: <strong>${esc(weakness.pattern)}</strong>.</span></p>${inDeck ? '<span class="tag a-learn">Ya está en el mazo «Inglés cotidiano»</span>' : `<button type="button" class="btn btn-outline btn-sm" data-english-card="${weakness.id}">${icon('plus', 14)} Crear tarjeta en el mazo</button>`}</div>` : ''}
        <button type="button" class="btn btn-dark btn-block" data-next-english>${ui.englishIndex === data.english.questions.length - 1 ? 'Volver a empezar' : 'Siguiente pregunta'}</button>` : ''}
    </section>
    ${note('Preguntas predefinidas, sin IA generativa, evaluación adaptativa ni registro de aprendizaje.')}`;
}

function profile(data) {
  const lab = data.english.lab;
  return `
    <section class="card lab-hero"><div><p class="eyebrow a-learn">Nivel de trabajo · base ${lab.baseline}</p><h2 class="hero-number">${lab.workingLevel}</h2><p class="muted">Actualizado el ${shortDate(lab.updated)}. Es una estimación de trabajo, no una certificación: cada dimensión declara su confianza y cuánta evidencia la respalda.</p></div></section>
    <div class="dimension-grid">${lab.dimensions.map((d) => `<article class="card dimension"><div class="restock-head"><strong>${d.label}</strong><span class="state-pill is-${STATE[d.state][1]}">${STATE[d.state][0]}</span></div><p class="muted small">${TREND[d.trend]} · confianza ${d.confidence === 'medium' ? 'media' : d.confidence === 'low' ? 'baja' : 'alta'} · ${d.evidence} ${d.evidence === 1 ? 'sesión' : 'sesiones'} de evidencia</p></article>`).join('')}</div>
    <div class="split even">
      <section class="card" aria-labelledby="weak-title"><h2 id="weak-title">Patrones a trabajar</h2><ul class="movements">${lab.weaknesses.map((w) => { const inDeck = data.decks.find((d) => d.id === 'english').cards.some((c) => c.front === w.card.front); return `<li><span><strong>${esc(w.pattern)}</strong><small>${w.evidence} apariciones · ${TREND[w.trend]}</small></span>${inDeck ? '<span class="tag a-learn">En el mazo</span>' : `<button type="button" class="chip-btn chip-sm" data-english-card="${w.id}">Crear tarjeta</button>`}</li>`; }).join('')}</ul></section>
      <section class="card" aria-labelledby="voc-title"><h2 id="voc-title">Vocabulario</h2><ul class="movements">${lab.vocabulary.map((v) => `<li><span><strong>${esc(v.expression)}</strong><small>${esc(v.meaning)}</small></span><span class="tag">${VOCAB[v.status]}</span></li>`).join('')}</ul></section>
    </div>
    ${note('Estructura tomada del English Speaking Lab del original (dimensiones, tendencia, confianza, evidencia); el contenido es ficticio. Vida no infiere ni escribe nivel de inglés: solo muestra la evaluación del laboratorio.')}`;
}

function sessions(data, ui) {
  const lab = data.english.lab;
  const err = ui.formErrors.englishSession ?? {};
  const minutes = lab.sessions.reduce((t, s) => t + s.minutes, 0);
  return `
    <dl class="stat-strip">
      <div><dt>Sesiones en noviembre</dt><dd class="mono">${lab.sessions.length}</dd></div>
      <div><dt>Minutos de práctica</dt><dd class="mono">${minutes}</dd></div>
      <div><dt>Racha</dt><dd class="mono">${data.english.streak}<small> días</small></dd></div>
    </dl>
    <section class="card flush" aria-labelledby="ses-title"><div class="card-head padded"><h2 id="ses-title">Historial</h2></div>
      <ul class="ledger">${[...lab.sessions].reverse().map((s) => `<li><span class="ledger-date mono">${shortDate(s.date)}</span><span class="ledger-text"><strong>${esc(s.focus)}</strong><small>${TYPES[s.type]}</small></span><span class="mono">${s.minutes} min</span></li>`).join('')}</ul></section>
    <form class="card add-food" data-capture-form="english-session" novalidate aria-labelledby="ses-add">
      <h2 id="ses-add">Registrar práctica</h2>
      <div class="form-grid">
        <label class="field"><span>Tipo</span><select name="type">${Object.entries(TYPES).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label>
        <label class="field"><span>Minutos</span><input name="minutes" type="number" inputmode="numeric" min="5" max="180" value="20"/>${fieldError(err, 'minutes')}</label>
        <label class="field"><span>Foco</span><input name="focus" maxlength="80" placeholder="Explicar un proyecto"/>${fieldError(err, 'focus')}</label>
      </div>
      <button type="submit" class="btn btn-dark">${icon('check', 16)} Guardar sesión</button>
    </form>`;
}

export function englishView(data, ui) {
  const tab = ui.englishTab;
  return `${pageHead(data.english.unit, 'Cinco minutos para mejorar.', 'Completá la oración. Cada respuesta trae una explicación breve.')}
    ${tabs('english-tab', tab, [['practice', 'Práctica'], ['profile', 'Perfil'], ['sessions', 'Sesiones']])}
    ${tab === 'profile' ? profile(data) : tab === 'sessions' ? sessions(data, ui) : practice(data, ui)}`;
}
