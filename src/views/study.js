/** Vista Mazos: repaso con calificación, intervalos simplificados y respuesta escrita evaluada. */
import { deckStats, intervalLabel, previewIntervals, SCHEDULER_VERSION } from '../domain/study.js';
import { esc, fieldError, note, pageHead } from './ui.js';

export function studyView(data, ui) {
  const deck = data.decks.find((d) => d.id === ui.deck) ?? data.decks[0];
  const index = ui.cardIndex % deck.cards.length;
  const card = deck.cards[index];
  const key = `${deck.id}:${index}`;
  const state = data.study[key] ?? null;
  const preview = previewIntervals(state);
  const flipped = ui.cardFlipped;
  const answer = ui.answerResult?.key === key ? ui.answerResult : null;
  const scheduled = deck.cards.map((c, i) => ({ c, s: data.study[`${deck.id}:${i}`] })).filter((x) => x.s);
  return `${pageHead('Repaso manual', 'Aprender, recordar, crecer.', 'Pensá la respuesta, dala vuelta y calificá qué tan bien la recordaste: eso decide cuándo vuelve a aparecer.')}
    <div class="deck-grid" role="group" aria-label="Elegir mazo">${data.decks.map((d) => { const st = deckStats(d, data.study); return `<button type="button" class="deck a-learn" data-deck="${d.id}" aria-pressed="${deck.id === d.id}"><strong>${d.title}</strong><small>${d.topic} · ${d.cards.length} tarjetas</small><small class="deck-stats">${st.fresh} nuevas · ${st.learning} en sesión · ${st.scheduled} programadas</small></button>`; }).join('')}</div>
    <div class="study">
      <button type="button" class="flash ${flipped ? 'is-flipped' : ''}" data-flip aria-label="${flipped ? 'Volver a la pregunta' : 'Revelar respuesta'}">
        <span class="flash-top"><span>${flipped ? 'Respuesta' : 'Pregunta'}${state ? ` · repasada ${state.reps} ${state.reps === 1 ? 'vez' : 'veces'}` : ' · nueva'}</span><span class="mono">${index + 1} / ${deck.cards.length}</span></span>
        <span class="flash-text">${flipped ? card.back : card.front}</span>
        <span class="flash-hint">${flipped ? 'Tocá para volver a la pregunta' : 'Tocá la tarjeta para ver la respuesta'}</span>
      </button>
      ${card.accepted && !flipped ? `<form class="answer-form" data-capture-form="answer" data-card="${key}" novalidate>
        <label class="field"><span>¿Querés escribir tu respuesta primero?</span><input name="answer" autocomplete="off" maxlength="80" value="${esc(answer?.given ?? '')}"/></label>
        <button type="submit" class="btn btn-outline">Comprobar</button>${fieldError(ui.formErrors.answer, 'answer')}
      </form>` : ''}
      ${answer ? `<p class="answer-result ${answer.correct ? 'is-correct' : 'is-wrong'}" role="status">${answer.correct ? '¡Correcto! Coincide con una respuesta aceptada.' : `No coincide con las respuestas aceptadas («${esc(card.accepted.join('», «'))}»). Revisala y calificá con honestidad.`}</p>` : ''}
      <div class="rating-row" role="group" aria-label="Calificar el recuerdo">
        <button type="button" class="rate is-again" data-card-again><strong>Repetir</strong><small>Otra vez · ${preview.again}</small></button>
        <button type="button" class="rate is-hard" data-card-rate="hard"><strong>Difícil</strong><small>${preview.hard}</small></button>
        <button type="button" class="rate is-good" data-next-card><strong>La sabía</strong><small>Bien · ${preview.good}</small></button>
        <button type="button" class="rate is-easy" data-card-rate="easy"><strong>Fácil</strong><small>${preview.easy}</small></button>
      </div>
      <div class="study-foot"><span class="dots" aria-hidden="true">${deck.cards.map((_, i) => `<span class="${i === index ? 'is-current' : i < index ? 'is-past' : ''}"></span>`).join('')}</span><span class="muted" role="status">Sabidas <strong class="mono t-learn">${ui.cardKnown}</strong> · Para repetir <strong class="mono t-care">${ui.cardAgain}</strong></span></div>
      ${scheduled.length ? `<section class="card schedule" aria-labelledby="sched-title"><h2 id="sched-title">Próximos repasos de este mazo</h2><ul class="movements">${scheduled.map(({ c, s }) => `<li><span><strong>${c.front}</strong><small>${s.reps} ${s.reps === 1 ? 'repaso' : 'repasos'} · ${s.lapses} ${s.lapses === 1 ? 'olvido' : 'olvidos'} · facilidad ${s.ease.toFixed(2).replace('.', ',')}</small></span><span class="mono">${intervalLabel(s.dueIn)}</span></li>`).join('')}</ul></section>` : ''}
    </div>
    ${note(`Programación simplificada y determinista (${SCHEDULER_VERSION}), sin algoritmo de repetición espaciada real: Vida 2.0 usa FSRS con intentos guardados offline e idempotentes. Las tarjetas son sintéticas y no hay sincronización con Anki.`)}`;
}
