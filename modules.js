/**
 * Presentational-only screens for the public showcase. This module imports no
 * internal Vida 2.0 modules and never reads network data or browser storage.
 */

const formatNumber = (n) => new Intl.NumberFormat('es-AR').format(n);
const money = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
const sum = (xs, field) => xs.reduce((total, item) => total + item[field], 0);

function cardHeader(eyebrow, title, extra = '') {
  return `<header class="surface-header"><div><div class="surface-eyebrow">${eyebrow}</div><h3>${title}</h3></div>${extra}</header>`;
}

function miniStat(title, value, detail, { icon, symbol = 'trend', tone = 'violet' }) {
  return `<div class="stat-tile"><span class="stat-tile-icon ${tone}">${icon(symbol, 18)}</span><span class="stat-tile-title">${title}</span><strong>${value}</strong><small>${detail}</small></div>`;
}

function bars(values, title, color = 'violet') {
  const max = Math.max(...values, 1);
  return `<div class="bar-chart ${color}" role="img" aria-label="${title}">${values.map((v, i) => `<div class="bar-column"><span style="height:${Math.max(8, Math.round((v / max) * 100))}%"></span><small>${['L', 'M', 'M', 'J', 'V', 'S', 'D'][i] ?? String(i + 1)}</small></div>`).join('')}</div>`;
}

function infoNote(icon, text) {
  return `<div class="module-disclaimer">${icon('info', 17)}<span>${text}</span></div>`;
}

function healthView(data, icon, sectionIntro, ui) {
  const metrics = {
    sleep: { title: 'Horas de sueño', values: data.health.sleepTrend, unit: 'h', tone: 'violet', average: 'Registro semanal ilustrativo' },
    steps: { title: 'Pasos', values: data.health.stepsTrend, unit: 'pasos', tone: 'green', average: 'Actividad diaria ilustrativa' },
    activity: { title: 'Minutos activos', values: data.health.activityTrend, unit: 'min', tone: 'blue', average: 'Movimiento semanal ilustrativo' },
  };
  const metric = metrics[ui.healthMetric];
  return `${sectionIntro('04 / BIENESTAR', 'Tu bienestar, de un vistazo.', 'Los números ayudan a entender tendencias. El contexto ayuda a interpretarlas.')}
    <div class="module-stats">
      ${miniStat('SUEÑO', `${data.health.sleepHours.toString().replace('.', ',')} h`, 'Última noche de ejemplo', { icon, symbol: 'moon' })}
      ${miniStat('PASOS', formatNumber(data.health.steps), 'Actividad de hoy', { icon, symbol: 'activity', tone: 'green' })}
      ${miniStat('FREC. EN REPOSO', `${data.health.restingPulse} ppm`, 'Dato ficticio', { icon, symbol: 'heart', tone: 'blue' })}
      ${miniStat('MINUTOS ACTIVOS', `${data.health.activeMinutes} min`, 'Movimiento de hoy', { icon, symbol: 'clock', tone: 'amber' })}
    </div>
    <div class="module-two-col">
      <section class="surface module-card">${cardHeader('PERSPECTIVA', 'Tu última semana')}<div class="chart-body"><div class="chart-switch">${Object.entries(metrics).map(([key, value]) => `<button type="button" data-health-metric="${key}" aria-pressed="${ui.healthMetric === key}" class="pill-button ${ui.healthMetric === key ? 'active' : ''}">${value.title}</button>`).join('')}</div><div class="chart-title"><strong>${metric.title}</strong><span>${metric.unit}</span></div>${bars(metric.values, `${metric.title}: datos simulados de siete días`, metric.tone)}<p class="muted-copy">${metric.average} · Cambiá el indicador para comparar otra serie.</p></div></section>
      <section class="surface module-card">${cardHeader('HÁBITOS Y BIENESTAR', 'Pequeños avances')}<div class="module-list">${data.habits.map((item) => `<div class="simple-line"><span class="list-dot ${item.color}"></span><span><strong>${item.label}</strong><small>${item.detail}</small></span><span class="line-state ${item.done ? 'done' : ''}">${item.done ? 'Hecho' : 'Pendiente'}</span></div>`).join('')}</div><button type="button" class="inline-cta" data-tab="hoy">Completar mis hábitos ${icon('arrow', 16)}</button></section>
    </div>${infoNote(icon, 'Valores inventados para mostrar la interfaz. No son recomendaciones ni interpretaciones médicas.')}`;
}

function gymView(data, icon, sectionIntro) {
  const gym = data.gym;
  const done = gym.sessionsThisWeek + (gym.completed ? 1 : 0);
  return `${sectionIntro('05 / ENTRENAMIENTO', 'Progresá a tu ritmo.', 'Un espacio para visualizar rutinas, constancia y actividad física.')}
    <div class="module-stats three">
      ${miniStat('SESIONES ESTA SEMANA', `${done}/${gym.goal}`, 'Objetivo semanal de ejemplo', { icon, symbol: 'activity', tone: 'green' })}
      ${miniStat('RUTINA', 'Fuerza A', 'Cuerpo completo · 4 ejercicios', { icon, symbol: 'target' })}
      ${miniStat('ESTADO', gym.completed ? 'Lista' : 'Pendiente', gym.completed ? 'Sesión marcada' : 'Listo para entrenar', { icon, symbol: 'check', tone: 'blue' })}
    </div>
    <div class="module-two-col wide">
      <section class="surface module-card">${cardHeader('RUTINA DEL DÍA', 'Fuerza · Cuerpo completo', '<span class="surface-count">4 ejercicios</span>')}<div class="workout-list">${gym.exercises.map((exercise, index) => `<div class="workout-row"><span class="exercise-number">${String(index + 1).padStart(2, '0')}</span><div><strong>${exercise.name}</strong><small>${exercise.muscle}</small></div><span class="workout-sets">${exercise.sets}</span><span class="workout-weight">${exercise.weight}</span></div>`).join('')}</div><div class="module-action-row"><p>Las cargas y series son ilustrativas.</p><button type="button" data-gym-toggle class="primary-cta ${gym.completed ? 'is-done' : ''}">${icon(gym.completed ? 'refresh' : 'check', 16)} ${gym.completed ? 'Marcar como pendiente' : 'Marcar sesión completa'}</button></div></section>
      <section class="surface module-card">${cardHeader('CONSTANCIA', 'Movimiento semanal')}<div class="chart-body">${bars(gym.volume, 'Minutos semanales ficticios en seis períodos', 'green')}<p class="muted-copy">Minutos de actividad por período. Sin datos de un dispositivo real.</p><div class="soft-panel"><strong>El progreso es personal</strong><p>La experiencia real permite explorar el historial. Esta vista enseña el concepto sin conectarse a tus registros.</p></div></div></section>
    </div>${infoNote(icon, 'Rutina y pesos ficticios. No son una prescripción de entrenamiento.')}`;
}

function nutritionView(data, icon, sectionIntro, ui) {
  const day = data.nutrition.days[ui.nutritionDay];
  const calories = sum(day.meals, 'calories');
  const protein = sum(day.meals, 'protein');
  const carbs = sum(day.meals, 'carbs');
  const fats = sum(day.meals, 'fats');
  const ratio = Math.min(100, Math.round(calories / data.nutrition.targetCalories * 100));
  const macro = [['Proteínas', protein, 110, 'violet'], ['Carbohidratos', carbs, 280, 'blue'], ['Grasas', fats, 80, 'amber']];
  return `${sectionIntro('06 / NUTRICIÓN', 'Comer con más claridad.', 'Un diario sencillo para visualizar comidas y distribución de nutrientes.')}
    <div class="choice-row">${data.nutrition.days.map((item, i) => `<button type="button" data-nutrition-day="${i}" aria-pressed="${ui.nutritionDay === i}" class="pill-button ${ui.nutritionDay === i ? 'active' : ''}">${item.label}</button>`).join('')}</div>
    <div class="module-two-col"><section class="surface module-card">${cardHeader('RESUMEN DIARIO', 'Tu alimentación de hoy')}<div class="nutrition-summary"><div class="calorie-ring" style="--ring:${ratio}%"><div><strong>${formatNumber(calories)}</strong><span>kcal de ejemplo</span></div></div><div><span class="surface-eyebrow">OBJETIVO DE DEMOSTRACIÓN</span><h3>${formatNumber(data.nutrition.targetCalories)} kcal</h3><p>Los valores cambian según el día seleccionado.</p></div></div><div class="macro-list">${macro.map(([label, amount, target, tone]) => `<div><div class="macro-title"><span>${label}</span><strong>${amount} g</strong></div><div class="progress-track ${tone}"><span style="width:${Math.min(100,Math.round(amount / target * 100))}%"></span></div></div>`).join('')}</div></section>
    <section class="surface module-card">${cardHeader('DIARIO DE COMIDAS', 'Lo que comiste', `<span class="surface-count">${day.meals.length} registros</span>`)}<div class="module-list">${day.meals.map((meal) => `<button type="button" class="meal-row" data-meal="${meal.id}" aria-expanded="${ui.mealOpen === meal.id}"><span class="meal-time">${meal.time}</span><span><strong>${meal.title}</strong><small>${meal.type}${ui.mealOpen === meal.id ? ` · P ${meal.protein} g · C ${meal.carbs} g · G ${meal.fats} g` : ''}</small></span><b>${meal.calories} kcal</b></button>`).join('')}</div><p class="muted-copy module-padding">Seleccioná una comida para ver sus macronutrientes.</p></section></div>${infoNote(icon, 'Comidas, valores y objetivos completamente ficticios. Esta demo no ofrece asesoramiento nutricional.')}`;
}

function decksView(data, icon, sectionIntro, ui) {
  const deck = data.decks.find((item) => item.id === ui.deck) ?? data.decks[0];
  const card = deck.cards[ui.cardIndex % deck.cards.length];
  return `${sectionIntro('07 / APRENDER', 'Aprender, recordar, crecer.', 'Mazos pequeños de tarjetas para practicar conceptos de forma activa.')}
    <div class="deck-selector">${data.decks.map((item) => `<button type="button" data-deck="${item.id}" aria-pressed="${deck.id === item.id}" class="deck-select ${deck.id === item.id ? 'selected' : ''}"><span class="project-symbol ${item.color}">${icon('book', 24)}</span><strong>${item.title}</strong><small>${item.cards.length} tarjetas · ${item.topic}</small></button>`).join('')}</div>
    <div class="study-panel"><div class="study-panel-top"><span>REPASO DE EJEMPLO</span><span>TARJETA ${ui.cardIndex + 1} DE ${deck.cards.length}</span></div><button type="button" class="flash-card ${ui.cardFlipped ? 'revealed' : ''}" data-flip aria-label="${ui.cardFlipped ? 'Volver a la pregunta' : 'Revelar respuesta'}"><span class="flash-kicker">${ui.cardFlipped ? 'RESPUESTA' : 'PREGUNTA'}</span><strong>${ui.cardFlipped ? card.back : card.front}</strong><small>${ui.cardFlipped ? 'Tocá para volver a la pregunta' : 'Pensá la respuesta y tocá para revelarla'}</small></button><div class="study-actions"><span>${icon('info', 16)} Repaso manual · sin algoritmo de repetición</span><button type="button" data-next-card class="primary-cta">Siguiente tarjeta ${icon('arrow', 16)}</button></div></div>${infoNote(icon, 'Las tarjetas son sintéticas. No hay sincronización con Anki ni un planificador automático de repasos.')}`;
}

function englishView(data, icon, sectionIntro, ui) {
  const q = data.english.questions[ui.englishIndex];
  const answered = ui.englishAnswer !== '';
  const correct = answered && ui.englishAnswer === q.correct;
  return `${sectionIntro('08 / INGLÉS', 'Cinco minutos para mejorar.', 'Una práctica corta para avanzar de a poco, todos los días.')}
    <div class="module-stats three">${miniStat('UNIDAD', '01', data.english.unit, { icon, symbol: 'languages' })}${miniStat('CONSTANCIA DE EJEMPLO', `${data.english.streak} días`, 'Racha ficticia', { icon, symbol: 'sun', tone: 'amber' })}${miniStat('PREGUNTAS', `${ui.englishIndex + 1}/${data.english.questions.length}`, 'Lección corta', { icon, symbol: 'check', tone: 'green' })}</div>
    <section class="surface english-panel"><div class="english-top"><span>COMPLETÁ LA ORACIÓN</span><span>ENGLISH PRACTICE <span aria-hidden="true">✦</span></span></div><h3>${q.prompt}</h3><p>Elegí una opción. Recibís una explicación al responder.</p><div class="english-choices">${q.choices.map((choice, i) => `<button type="button" data-english-answer="${choice}" ${answered ? 'disabled' : ''} class="english-choice ${answered && choice === q.correct ? 'correct' : answered && choice === ui.englishAnswer ? 'wrong' : ''}"><span>${String.fromCharCode(65 + i)}</span>${choice}${answered && choice === q.correct ? icon('check', 18) : ''}</button>`).join('')}</div>${answered ? `<div class="english-feedback ${correct ? 'correct' : 'wrong'}"><strong>${correct ? '¡Muy bien!' : 'Casi. Seguí practicando.'}</strong><p>${q.note}</p></div><button type="button" class="primary-cta" data-next-english>${ui.englishIndex === data.english.questions.length - 1 ? 'Volver a empezar' : 'Siguiente pregunta'} ${icon('arrow', 16)}</button>` : ''}</section>${infoNote(icon, 'Preguntas predefinidas, sin IA generativa, evaluación adaptativa ni registro de aprendizaje.')}`;
}

function financesView(data, icon, sectionIntro, ui) {
  const { finances } = data;
  const spent = sum(finances.categories, 'spent');
  const budget = sum(finances.categories, 'budget');
  const selected = finances.categories.find((item) => item.id === ui.financeCategory);
  return `${sectionIntro('09 / VIDA COTIDIANA', 'Tu dinero, más claro.', 'Un resumen comprensible de tus gastos, categorías y objetivos.')}
    <div class="module-stats three">${miniStat('INGRESO DEL MES', money(finances.monthlyIncome), 'Ejemplo mensual', { icon, symbol: 'wallet', tone: 'green' })}${miniStat('GASTOS DEL MES', money(spent), 'Total simulado', { icon, symbol: 'trend', tone: 'amber' })}${miniStat('DISPONIBLE', money(finances.monthlyIncome - spent), 'Ingreso menos gastos', { icon, symbol: 'check', tone: 'violet' })}</div>
    <div class="module-two-col wide"><section class="surface module-card">${cardHeader('PRESUPUESTO', 'Gastos por categoría', '<span class="surface-count">ARS · Ejemplo</span>')}<div class="budget-list">${finances.categories.map((item) => `<button class="budget-row ${ui.financeCategory === item.id ? 'selected' : ''}" type="button" data-finance-category="${item.id}" aria-pressed="${ui.financeCategory === item.id}"><span class="budget-top"><strong>${item.name}</strong><small>${money(item.spent)} / ${money(item.budget)}</small></span><span class="progress-track ${item.color}"><span style="width:${Math.min(100,Math.round(item.spent / item.budget * 100))}%"></span></span></button>`).join('')}</div></section><section class="surface module-card">${cardHeader('LECTURA RÁPIDA', selected ? selected.name : 'Tu presupuesto')}<div class="budget-highlight"><span>${selected ? 'RESTANTE EN LA CATEGORÍA' : 'PRESUPUESTO TOTAL DE EJEMPLO'}</span><strong>${money(selected ? selected.budget - selected.spent : budget)}</strong><p>${selected ? `Uso actual: ${Math.round(selected.spent / selected.budget * 100)}% del presupuesto previsto.` : 'Seleccioná una categoría para ver cuánto queda disponible.'}</p></div><div class="soft-panel"><strong>¿Qué muestra esta vista?</strong><p>Una distribución clara de gastos ficticios. No hay cuentas bancarias, movimientos reales ni predicciones.</p></div></section></div>${infoNote(icon, 'Importes totalmente ficticios y orientados a demostración. No hay conexión con bancos ni asesoramiento financiero.')}`;
}

function shoppingView(data, icon, sectionIntro) {
  const count = data.shopping.filter((item) => item.checked).length;
  const groups = [...new Set(data.shopping.map((item) => item.category))];
  return `${sectionIntro('10 / LO COTIDIANO', 'Compras sin olvidos.', 'Una lista simple que acompaña el día a día y se organiza por categoría.')}
    <div class="shopping-summary"><span class="shopping-icon">${icon('basket', 25)}</span><div><strong>Compra de la semana</strong><span>${count} de ${data.shopping.length} productos marcados</span></div><div class="shopping-count">${Math.round(count / data.shopping.length * 100)}%</div></div>
    <div class="shopping-progress"><span style="width:${Math.round(count / data.shopping.length * 100)}%"></span></div><div class="shopping-columns">${groups.map((group) => `<section class="surface shopping-group">${cardHeader('LISTA DE EJEMPLO', group)}<div class="shopping-items">${data.shopping.filter((item) => item.category === group).map((item) => `<label class="shopping-row ${item.checked ? 'checked' : ''}"><input type="checkbox" data-shopping-check="${item.id}" ${item.checked ? 'checked' : ''}/><span class="shopping-checkbox" aria-hidden="true">${icon('check', 13)}</span><strong>${item.name}</strong><small>${item.amount}</small></label>`).join('')}</div></section>`).join('')}</div>${infoNote(icon, 'No se realizan compras ni pedidos. Marcá productos: los cambios se pierden al recargar.')}`;
}

function moviesView(data, icon, sectionIntro, ui) {
  const options = ['Todas', 'Por ver', 'Vistas'];
  const visible = data.movies.filter((item) => ui.moviesFilter === 'Todas' || (ui.moviesFilter === 'Por ver' ? !item.watched : item.watched));
  const watched = data.movies.filter((item) => item.watched).length;
  return `${sectionIntro('11 / ENTRETENIMIENTO', 'Tus historias favoritas.', 'Guardá lo que querés ver y llevá un registro de tus películas.')}
    <div class="movies-toolbar"><div><strong>Mi colección de ejemplo</strong><span>${data.movies.length} títulos · ${watched} vistos</span></div><div class="choice-row">${options.map((option) => `<button type="button" data-movies-filter="${option}" aria-pressed="${ui.moviesFilter === option}" class="pill-button ${ui.moviesFilter === option ? 'active' : ''}">${option}</button>`).join('')}</div></div>
    <div class="movie-grid">${visible.map((movie) => `<article class="movie-card"><div class="movie-poster poster-${movie.color}"><span class="poster-symbol" aria-hidden="true">${movie.symbol}</span><span class="poster-caption">VIDA 2.0 · FICCIÓN</span></div><div class="movie-info"><span>${movie.genre.toUpperCase()} · ${movie.year}</span><h3>${movie.title}</h3><p>${movie.watched ? `Vista · ${'★'.repeat(movie.rating)}${'☆'.repeat(5 - movie.rating)}` : 'En tu lista para ver'}</p><button type="button" data-movie-toggle="${movie.id}" class="movie-action">${movie.watched ? 'Marcar como pendiente' : 'Marcar como vista'} ${icon('arrow', 14)}</button></div></article>`).join('')}</div>${infoNote(icon, 'Títulos y pósteres son inventados para esta demo. No hay integración con catálogos ni streaming.')}`;
}

export function moduleView(tab, data, { icon, sectionIntro, ui }) {
  switch (tab) {
    case 'salud': return healthView(data, icon, sectionIntro, ui);
    case 'gimnasio': return gymView(data, icon, sectionIntro, ui);
    case 'nutricion': return nutritionView(data, icon, sectionIntro, ui);
    case 'mazos': return decksView(data, icon, sectionIntro, ui);
    case 'ingles': return englishView(data, icon, sectionIntro, ui);
    case 'finanzas': return financesView(data, icon, sectionIntro, ui);
    case 'compras': return shoppingView(data, icon, sectionIntro);
    case 'peliculas': return moviesView(data, icon, sectionIntro, ui);
    default: throw new Error(`Unknown public showcase module: ${tab}`);
  }
}
