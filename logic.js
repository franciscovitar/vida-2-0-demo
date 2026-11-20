/**
 * Cálculos puros de la demo. No leen el DOM, la red ni el almacenamiento:
 * todo se deriva de los datos ficticios de data.js y del estado en memoria.
 */

export const AREAS = Object.freeze({
  org: { key: 'org', name: 'Organizar', tabs: ['tareas', 'proyectos', 'agenda'] },
  care: { key: 'care', name: 'Cuidarme', tabs: ['salud', 'gimnasio', 'nutricion'] },
  learn: { key: 'learn', name: 'Aprender', tabs: ['mazos', 'ingles'] },
  life: { key: 'life', name: 'Vivir', tabs: ['finanzas', 'compras', 'peliculas'] },
});

export const LABELS = Object.freeze({
  hoy: 'Hoy',
  tareas: 'Tareas y hábitos', proyectos: 'Proyectos', agenda: 'Agenda',
  salud: 'Salud', gimnasio: 'Gimnasio', nutricion: 'Nutrición',
  mazos: 'Mazos de estudio', ingles: 'Inglés',
  finanzas: 'Finanzas', compras: 'Compras', peliculas: 'Películas',
});

export function areaOfTab(tab) {
  return Object.values(AREAS).find((area) => area.tabs.includes(tab))?.key ?? null;
}

const HABIT_AREA = { Aprendizaje: 'learn', Bienestar: 'care', 'Organización': 'org' };

export const habitArea = (habit) => HABIT_AREA[habit.detail] ?? 'org';
export const taskArea = (task) => (task.category === 'Aprendizaje' ? 'learn' : 'org');

export const sum = (items, field) => items.reduce((total, item) => total + item[field], 0);
export const average = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

export function toMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Estado de un evento del día 0 respecto de la hora fija de la demo. */
export function eventStatus(event, clock) {
  const now = toMinutes(clock.time);
  if (toMinutes(event.end) <= now) return 'past';
  if (toMinutes(event.time) <= now) return 'now';
  return 'next';
}

/** Progreso de hoy por área: cuenta solo acciones que existen en la demo. */
export function areaProgress(data, ui) {
  const orgTasks = data.tasks.filter((task) => taskArea(task) === 'org');
  const learnTasks = data.tasks.filter((task) => taskArea(task) === 'learn');
  const habitsOf = (key) => data.habits.filter((habit) => habitArea(habit) === key);
  const checkedShopping = data.shopping.filter((item) => item.checked).length;
  const toWatch = data.movies.filter((movie) => !movie.watched).length;
  const health = healthDeltas(data);
  const aurora = data.projects.find((project) => project.id === 'aurora');
  const finance = financeSummary(data);

  const org = [
    { label: `Tareas de trabajo: ${orgTasks.filter((t) => t.done).length} de ${orgTasks.length}`, done: null, count: orgTasks.filter((t) => t.done).length, of: orgTasks.length },
    ...habitsOf('org').map((habit) => ({ label: habit.label, done: habit.done })),
  ];
  const care = [
    ...habitsOf('care').map((habit) => ({ label: habit.label, done: habit.done })),
    { label: 'Sesión de gimnasio', done: data.gym.completed },
  ];
  const learn = [
    ...habitsOf('learn').map((habit) => ({ label: habit.label, done: habit.done })),
    ...learnTasks.map((task) => ({ label: task.label, done: task.done })),
    { label: 'Práctica de inglés', done: Boolean(ui.englishPracticed) },
  ];
  const tally = (items) => items.reduce((acc, item) => ({
    done: acc.done + (item.count ?? (item.done ? 1 : 0)),
    total: acc.total + (item.of ?? 1),
  }), { done: 0, total: 0 });

  return [
    { key: 'org', tab: 'tareas', ...tally(org), items: org, stat: `${aurora.progress}%`, statLabel: `${aurora.name} · entrega ${aurora.deadline.toLowerCase()}` },
    { key: 'care', tab: 'salud', ...tally(care), items: care, stat: `${formatDecimal(data.health.sleepHours)} h de sueño`, statLabel: `${signed(health.sleep, 1)} h sobre tu promedio de 7 días` },
    { key: 'learn', tab: 'mazos', ...tally(learn), items: learn, stat: `${data.english.streak} días`, statLabel: `de racha en inglés · ${data.decks.length} mazos` },
    { key: 'life', tab: 'compras', done: checkedShopping, total: data.shopping.length,
      items: [{ label: `Compras marcadas: ${checkedShopping} de ${data.shopping.length}`, done: null }, { label: `Películas por ver: ${toWatch}`, done: null }],
      stat: formatMoney(finance.available), statLabel: 'disponibles del presupuesto del mes' },
  ].map((area) => ({ ...area, name: AREAS[area.key].name }));
}

export function healthDeltas(data) {
  const { health } = data;
  return {
    sleep: health.sleepHours - average(health.sleepTrend),
    steps: health.steps - average(health.stepsTrend),
    activity: health.activeMinutes - average(health.activityTrend),
  };
}

export function financeSummary(data) {
  const { finances, demoClock } = data;
  const budget = sum(finances.categories, 'budget');
  const spent = sum(finances.categories, 'spent');
  const pace = demoClock.dayOfMonth / demoClock.daysInMonth;
  const daysLeft = demoClock.daysInMonth - demoClock.dayOfMonth;
  const categories = finances.categories.map((category) => {
    const used = category.spent / category.budget;
    const left = category.budget - category.spent;
    return { ...category, used, left, perDay: daysLeft > 0 ? left / daysLeft : left, overPace: used > pace + 0.08 };
  });
  return { budget, spent, available: budget - spent, income: finances.monthlyIncome, pace, daysLeft, categories };
}

export function dayNutrition(day) {
  const calories = sum(day.meals, 'calories');
  const protein = sum(day.meals, 'protein');
  const carbs = sum(day.meals, 'carbs');
  const fats = sum(day.meals, 'fats');
  const energy = protein * 4 + carbs * 4 + fats * 9;
  const share = (kcal) => (energy ? Math.round((kcal / energy) * 100) : 0);
  return { calories, protein, carbs, fats, shares: { protein: share(protein * 4), carbs: share(carbs * 4), fats: share(fats * 9) } };
}

export function parseExercise(exercise) {
  const [sets, reps] = exercise.sets.split('×').map((part) => part.trim());
  const kg = Number.parseFloat(exercise.weight) || 0;
  const repsNumber = /s$/.test(reps) ? 0 : Number.parseInt(reps, 10) || 0;
  return { sets: Number.parseInt(sets, 10) || 0, reps, kg, repsNumber };
}

export function gymSummary(data, doneSets) {
  let done = 0;
  let total = 0;
  let lifted = 0;
  for (const exercise of data.gym.exercises) {
    const parsed = parseExercise(exercise);
    total += parsed.sets;
    for (let n = 1; n <= parsed.sets; n += 1) {
      if (doneSets[`${exercise.id}-${n}`]) {
        done += 1;
        lifted += parsed.kg * parsed.repsNumber;
      }
    }
  }
  return { done, total, lifted, sessions: data.gym.sessionsThisWeek + (data.gym.completed ? 1 : 0), goal: data.gym.goal };
}

export function formatDecimal(value, digits = 1) {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value);
}

export function formatMoney(value) {
  return `$ ${formatNumber(Math.round(value))}`;
}

export function signed(value, digits = 0) {
  const text = digits ? formatDecimal(Math.abs(value), digits) : formatNumber(Math.abs(Math.round(value)));
  return `${value < 0 ? '−' : '+'}${text}`;
}
