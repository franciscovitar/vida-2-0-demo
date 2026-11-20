import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { initialData } from './data.js';

const root = new URL('./', import.meta.url);

test('el selector de módulos conserva su nombre accesible cuando el texto visual se oculta en móvil', async () => {
  const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  assert.match(html, /<select\s+id="mobile-nav"\s+aria-label="Ir a un módulo"/);
});

function mockDom() {
  const listeners = new Map();
  const panel = { innerHTML: '' };
  const breadcrumb = { textContent: '' };
  const announcement = { textContent: '' };
  const mobile = { value: 'hoy' };
  const nav = ['hoy', 'proyectos', 'agenda', 'salud', 'gimnasio', 'nutricion', 'mazos', 'ingles', 'finanzas', 'compras', 'peliculas'].map((tab) => {
    const classes = new Set();
    const attrs = new Map();
    return {
      dataset: { tab },
      classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } },
      setAttribute(k, v) { attrs.set(k, v); },
      removeAttribute(k) { attrs.delete(k); },
      classes,
      attrs,
    };
  });

  globalThis.document = {
    querySelector(query) {
      if (query === '#panel') return panel;
      if (query === '#announcement') return announcement;
      if (query === '#breadcrumb-current') return breadcrumb;
      if (query === '#mobile-nav') return mobile;
      return null;
    },
    querySelectorAll(query) { return query === '.main-nav .nav-item' ? nav : []; },
    addEventListener(name, fn) { listeners.set(name, fn); },
  };
  globalThis.window = { addEventListener(name, fn) { listeners.set(name, fn); } };
  globalThis.location = { hash: '' };
  globalThis.history = { replaceState(_state, _title, hash) { location.hash = hash; } };
  globalThis.HTMLInputElement = class FakeInput {};

  return {
    panel, breadcrumb, announcement, nav, mobile,
    click(dataset, className = '') {
      listeners.get('click')({ target: { closest: () => ({ dataset, classList: { contains: (c) => c === className } }) } });
    },
    change(id, field, checked) {
      const input = new HTMLInputElement();
      input.dataset = { [field]: id };
      input.checked = checked;
      listeners.get('change')({ target: input });
    },
    mobileSelect(tab) {
      listeners.get('change')({ target: { id: 'mobile-nav', value: tab } });
    },
  };
}

const ui = mockDom();
const app = await import('./app.js');

test('las vistas base y la navegación funcionan sin login', () => {
  assert.match(ui.panel.innerHTML, /Buen día, Alex\./);
  assert.equal(ui.nav[0].attrs.get('aria-current'), 'page');

  ui.click({ tab: 'proyectos' });
  assert.match(ui.panel.innerHTML, /Proyectos que avanzan/);
  assert.match(ui.panel.innerHTML, /Producto Aurora/);
  assert.equal(ui.breadcrumb.textContent, 'Proyectos');

  ui.click({ tab: 'agenda' });
  assert.match(ui.panel.innerHTML, /Espacio para lo importante/);
  assert.match(ui.panel.innerHTML, /Bloque de trabajo enfocado/);
  assert.equal(ui.nav[2].attrs.get('aria-current'), 'page');
});

test('los once módulos están disponibles, incluidos en la navegación móvil', () => {
  const expected = new Map([
    ['salud', 'Tu bienestar, de un vistazo'],
    ['gimnasio', 'Progresá a tu ritmo'],
    ['nutricion', 'Comer con más claridad'],
    ['mazos', 'Aprender, recordar, crecer'],
    ['ingles', 'Cinco minutos para mejorar'],
    ['finanzas', 'Tu dinero, más claro'],
    ['compras', 'Compras sin olvidos'],
    ['peliculas', 'Tus historias favoritas'],
  ]);
  assert.equal(ui.nav.length, 11);
  for (const [tab, title] of expected) {
    ui.mobileSelect(tab);
    assert.match(ui.panel.innerHTML, new RegExp(title));
    assert.equal(ui.mobile.value, tab);
    assert.equal(ui.nav.find((entry) => entry.dataset.tab === tab).attrs.get('aria-current'), 'page');
  }
});

test('salud muestra métricas ficticias y permite cambiar las tendencias', () => {
  ui.click({ tab: 'salud' });
  assert.match(ui.panel.innerHTML, /8\.240/);
  assert.match(ui.panel.innerHTML, /Valores inventados/);
  ui.click({ healthMetric: 'steps' });
  assert.match(ui.panel.innerHTML, /Actividad diaria ilustrativa/);
  ui.click({ healthMetric: 'activity' });
  assert.match(ui.panel.innerHTML, /Movimiento semanal ilustrativo/);
});

test('gimnasio alterna la sesión completa y pendiente', () => {
  ui.click({ tab: 'gimnasio' });
  assert.match(ui.panel.innerHTML, /2\/3/);
  ui.click({ gymToggle: '' });
  assert.match(ui.panel.innerHTML, /3\/3/);
  assert.match(ui.panel.innerHTML, /Marcar como pendiente/);
  ui.click({ gymToggle: '' });
  assert.match(ui.panel.innerHTML, /2\/3/);
});

test('nutrición calcula los resúmenes y permite alternar día y detalle', () => {
  ui.click({ tab: 'nutricion' });
  assert.match(ui.panel.innerHTML, /2\.010/);
  ui.click({ meal: 'breakfast' });
  assert.match(ui.panel.innerHTML, /<dt>Proteínas<\/dt><dd class="mono">21 g<\/dd>/);
  ui.click({ nutritionDay: '1' });
  assert.match(ui.panel.innerHTML, /1\.110/);
  assert.doesNotMatch(ui.panel.innerHTML, /<dd class="mono">21 g<\/dd>/);
  assert.match(ui.panel.innerHTML, /no ofrece asesoramiento nutricional/);
});

test('mazos permite elegir tema, revelar y avanzar una tarjeta', () => {
  ui.click({ tab: 'mazos' });
  assert.match(ui.panel.innerHTML, /¿Qué es el DOM\?/);
  ui.click({ flip: '' });
  assert.match(ui.panel.innerHTML, /representación estructurada del documento/);
  ui.click({ nextCard: '' });
  assert.match(ui.panel.innerHTML, /función pura/);
  ui.click({ deck: 'english' });
  assert.match(ui.panel.innerHTML, /figure out/);
  assert.match(ui.panel.innerHTML, /sin algoritmo de repetición/);
});

test('inglés entrega feedback correcto e incorrecto y avanza de pregunta', () => {
  ui.click({ tab: 'ingles' });
  assert.match(ui.panel.innerHTML, /She has lived/);
  ui.click({ englishAnswer: 'for' });
  assert.match(ui.panel.innerHTML, /Casi. Seguí practicando/);
  ui.click({ nextEnglish: '' });
  assert.match(ui.panel.innerHTML, /looking forward/);
  ui.click({ englishAnswer: 'to meeting' });
  assert.match(ui.panel.innerHTML, /¡Muy bien!/);
});

test('finanzas muestra presupuestos ficticios y permite ver categorías', () => {
  ui.click({ tab: 'finanzas' });
  assert.match(ui.panel.innerHTML, /1\.500\.000/);
  ui.click({ financeCategory: 'food' });
  assert.match(ui.panel.innerHTML, /RESTANTE EN LA CATEGORÍA/);
  assert.match(ui.panel.innerHTML, /116\.000/);
  assert.match(ui.panel.innerHTML, /No hay conexión con bancos/);
});

test('lista de compras registra los checks localmente', () => {
  ui.click({ tab: 'compras' });
  assert.match(ui.panel.innerHTML, /2 de 6 productos marcados/);
  ui.change('apples', 'shoppingCheck', true);
  assert.match(ui.panel.innerHTML, /3 de 6 productos marcados/);
  ui.change('bread', 'shoppingCheck', false);
  assert.match(ui.panel.innerHTML, /2 de 6 productos marcados/);
});

test('películas permite filtrar y cambiar los estados', () => {
  ui.click({ tab: 'peliculas' });
  assert.match(ui.panel.innerHTML, /4 títulos · 2 vistos/);
  ui.click({ moviesFilter: 'Por ver' });
  assert.match(ui.panel.innerHTML, /El mapa de las estrellas/);
  assert.doesNotMatch(ui.panel.innerHTML, /Horizonte azul/);
  ui.click({ movieToggle: 'atlas' });
  assert.doesNotMatch(ui.panel.innerHTML, /El mapa de las estrellas/);
  ui.click({ moviesFilter: 'Vistas' });
  assert.match(ui.panel.innerHTML, /El mapa de las estrellas/);
  assert.match(ui.panel.innerHTML, /4 títulos · 3 vistos/);
});

test('reiniciar vuelve los ocho nuevos módulos a su estado inicial', () => {
  ui.click({ tab: 'gimnasio' });
  ui.click({ gymToggle: '' });
  ui.click({ tab: 'compras' });
  ui.change('apples', 'shoppingCheck', true);
  ui.click({ tab: 'peliculas' });
  ui.click({ movieToggle: 'seasons' });
  ui.click({ action: 'reset' });
  assert.equal(ui.mobile.value, 'hoy');
  assert.match(ui.panel.innerHTML, /2\/4/);
  ui.click({ tab: 'gimnasio' });
  assert.match(ui.panel.innerHTML, /2\/3/);
  ui.click({ tab: 'compras' });
  assert.match(ui.panel.innerHTML, /2 de 6 productos marcados/);
  ui.click({ tab: 'peliculas' });
  assert.match(ui.panel.innerHTML, /4 títulos · 2 vistos/);
  assert.equal(ui.mobile.value, 'peliculas');
});

test('el filtro de proyectos y el detalle elegido cambian la vista', () => {
  ui.click({ tab: 'proyectos' });
  ui.click({ filter: 'Formación' });
  assert.match(ui.panel.innerHTML, /Ruta de aprendizaje/);
  assert.doesNotMatch(ui.panel.innerHTML, /Prototipar nueva pantalla/);
  assert.doesNotMatch(ui.panel.innerHTML, /Sitio Boreal/);
  ui.click({ filter: 'Todos' });
  ui.click({ project: 'boreal' });
  assert.match(ui.panel.innerHTML, /Revisar la versión para celular/);
});

test('agenda cambia días y muestra el detalle del evento seleccionado', () => {
  ui.click({ tab: 'agenda' });
  ui.click({ day: '1' });
  assert.match(ui.panel.innerHTML, /Curso de TypeScript/);
  assert.doesNotMatch(ui.panel.innerHTML, /Pausa activa/);
  ui.click({ event: 'course' });
  assert.match(ui.panel.innerHTML, /Practicar tipos y composición/);
});

test('tareas y hábitos cambian solo en memoria; reiniciar recupera el estado original', () => {
  ui.click({ tab: 'hoy' });
  assert.match(ui.panel.innerHTML, /2\/4/);
  ui.change('planificacion', 'habitCheck', true);
  assert.match(ui.panel.innerHTML, /3\/4/);
  ui.change('flujo', 'taskCheck', true);
  assert.match(ui.panel.innerHTML, /2 pendientes/);
  ui.click({ action: 'reset' });
  assert.match(ui.panel.innerHTML, /2\/4/);
  assert.match(ui.panel.innerHTML, /3 pendientes/);
  assert.equal(ui.breadcrumb.textContent, 'Hoy');
  assert.equal(initialData.habits[2].done, false);
});

test('el showcase no importa la aplicación personal ni configura conexiones de red', async () => {
  const [js, modules, html, config] = await Promise.all(['app.js', 'modules.js', 'index.html', 'vercel.json'].map(async (name) => readFile(new URL(name, root), 'utf8')));
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|navigator\.sendBeacon/);
  assert.doesNotMatch(modules, /\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|navigator\.sendBeacon|\bwindow\b|\bdocument\b/);
  assert.doesNotMatch(js, /from\s+['"]@\//);
  assert.doesNotMatch(html, /googleapis|notion\.so|oauth|auth\/signin/i);
  assert.equal(JSON.parse(config).headers[0].headers.find((item) => item.key === 'Content-Security-Policy').value.includes("connect-src 'none'"), true);
  assert.match(html, /Datos ficticios/);
  assert.match(html, /Los datos, métricas y acciones son simulados/);
  assert.doesNotMatch(html, /World|Profesional|LinkedIn Feed/i);
});

test('las fixtures son consistentes, únicas y no están asociadas a las cuentas personales', () => {
  assert.equal(initialData.habits.length, 4);
  assert.equal(initialData.projects.length, 3);
  const ids = [...initialData.habits, ...initialData.tasks, ...initialData.projects, ...initialData.agenda, ...initialData.gym.exercises, ...initialData.decks, ...initialData.shopping, ...initialData.movies].map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(initialData.agenda.every((item) => Number.isInteger(item.day) && item.day >= 0 && item.day <= 2));
  assert.ok(initialData.projects.every((item) => item.progress >= 0 && item.progress <= 100));
  assert.doesNotMatch(JSON.stringify(initialData), /francisco|vitar|genova|gmail|UTN|personal.ai.system|vida.2\.0/i);
  assert.equal(initialData.decks.length, 3);
  assert.equal(initialData.shopping.length, 6);
  assert.equal(initialData.movies.length, 4);
});

/* ───────── Rediseño «Claridad»: nuevas interacciones y cálculos ───────── */

const logic = await import('./logic.js');

test('la navegación por áreas agrupa los 11 módulos y muestra los segmentos del área', () => {
  ui.click({ action: 'reset' });
  const groups = Object.values(logic.AREAS).map((area) => area.tabs);
  assert.deepEqual(groups.flat().sort(), ['agenda', 'compras', 'finanzas', 'gimnasio', 'informacion', 'ingles', 'mazos', 'nutricion', 'peliculas', 'plan', 'proyectos', 'salud', 'tareas']);
  ui.click({ tab: 'gimnasio' });
  assert.match(ui.panel.innerHTML, /class="subnav a-care" aria-label="Cuidarme"/);
  assert.match(ui.panel.innerHTML, /data-tab="gimnasio" aria-current="page"/);
  assert.match(ui.panel.innerHTML, /data-tab="nutricion"/);
  ui.click({ tab: 'hoy' });
  assert.doesNotMatch(ui.panel.innerHTML, /class="subnav/);
});

test('tareas y hábitos filtra por proyecto y conserva los hábitos', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'tareas' });
  assert.match(ui.panel.innerHTML, /3 tareas abiertas y 2 hábitos por completar/);
  ui.click({ taskFilter: 'Sitio Boreal' });
  assert.match(ui.panel.innerHTML, /Documentar los componentes nuevos/);
  assert.doesNotMatch(ui.panel.innerHTML, /Revisar el flujo de navegación/);
  assert.match(ui.panel.innerHTML, /data-habit-check="planificacion"/);
  ui.change('desconexion', 'habitCheck', true);
  assert.match(ui.panel.innerHTML, /1 hábito por completar/);
});

test('«Tu día en cuatro áreas» suma cada acción a su área', () => {
  ui.click({ action: 'reset' });
  assert.match(ui.panel.innerHTML, /Organizar: 1 de 4 hoy/);
  assert.match(ui.panel.innerHTML, /Cuidarme: 1 de 3 hoy/);
  assert.match(ui.panel.innerHTML, /Aprender: 1 de 3 hoy/);
  assert.match(ui.panel.innerHTML, /Vivir: 2 de 6 hoy/);
  ui.change('desconexion', 'habitCheck', true);
  ui.change('practicar', 'taskCheck', true);
  ui.change('flujo', 'taskCheck', true);
  assert.match(ui.panel.innerHTML, /Cuidarme: 2 de 3 hoy/);
  assert.match(ui.panel.innerHTML, /Aprender: 2 de 3 hoy/);
  assert.match(ui.panel.innerHTML, /Organizar: 2 de 4 hoy/);
  ui.click({ tab: 'ingles' });
  ui.click({ englishAnswer: 'since' });
  ui.click({ tab: 'gimnasio' });
  ui.click({ gymToggle: '' });
  ui.click({ tab: 'compras' });
  ui.change('eggs', 'shoppingCheck', true);
  ui.click({ tab: 'hoy' });
  assert.match(ui.panel.innerHTML, /Aprender: 3 de 3 hoy/);
  assert.match(ui.panel.innerHTML, /Cuidarme: 3 de 3 hoy/);
  assert.match(ui.panel.innerHTML, /Vivir: 3 de 6 hoy/);
});

test('el recorrido avanza, se adelanta al marcar una tarea y se puede cerrar', () => {
  ui.click({ action: 'reset' });
  assert.match(ui.panel.innerHTML, /Recorrido · 1 de 3/);
  ui.change('flujo', 'taskCheck', true);
  assert.match(ui.panel.innerHTML, /Recorrido · 2 de 3/);
  ui.click({ tour: 'next' });
  assert.match(ui.panel.innerHTML, /Recorrido · 3 de 3/);
  ui.click({ tour: 'next' });
  assert.doesNotMatch(ui.panel.innerHTML, /Recorrido ·/);
  ui.click({ action: 'reset' });
  ui.click({ tour: 'close' });
  assert.doesNotMatch(ui.panel.innerHTML, /Recorrido ·/);
});

test('gimnasio registra series y calcula los kilos levantados', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'gimnasio' });
  ui.click({ gymSet: 'press-1' });
  ui.click({ gymSet: 'press-2' });
  ui.click({ gymSet: 'plank-1' });
  assert.match(ui.panel.innerHTML, /data-gym-set="press-1" aria-pressed="true"/);
  ui.click({ gymSet: 'press-2' });
  ui.click({ gymToggle: '' });
  assert.match(ui.panel.innerHTML, /Meta semanal cumplida/);
  assert.match(ui.panel.innerHTML, /2 de 12 series · 350 kg levantados/);
  ui.click({ action: 'reset' });
  ui.click({ tab: 'gimnasio' });
  assert.doesNotMatch(ui.panel.innerHTML, /data-gym-set="[a-z]+-\d" aria-pressed="true"/);
});

test('finanzas muestra disponible, ritmo del mes y alterna disponible/gastado', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'finanzas' });
  assert.match(ui.panel.innerHTML, /\$ 464\.000<span> disponibles/);
  assert.match(ui.panel.innerHTML, /Ritmo del mes \(57%\)/);
  assert.match(ui.panel.innerHTML, /Usaste 77% con el 57% del mes transcurrido\. Quedan 13 días: \$ 8\.846 por día/);
  assert.match(ui.panel.innerHTML, /\$ 116\.000 libres/);
  ui.click({ financeMode: 'spent' });
  assert.match(ui.panel.innerHTML, /\$ 214\.000 gastados/);
  ui.click({ financeCategory: 'transport' });
  assert.match(ui.panel.innerHTML, /Vas dentro del plan/);
});

test('mazos cuenta «La sabía» y «Repetir», y reinicia los contadores al cambiar de mazo', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'mazos' });
  ui.click({ nextCard: '' });
  ui.click({ cardAgain: '' });
  assert.match(ui.panel.innerHTML, /Sabidas <strong class="mono t-learn">1<\/strong> · Para repetir <strong class="mono t-care">1<\/strong>/);
  assert.match(ui.panel.innerHTML, /¿Para qué sirve un test de integración\?/);
  ui.click({ deck: 'finance' });
  assert.match(ui.panel.innerHTML, /Sabidas <strong class="mono t-learn">0<\/strong>/);
  assert.match(ui.panel.innerHTML, /¿Qué es un gasto fijo\?/);
});

test('películas muestra conteos en los filtros y conserva la calificación original', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'peliculas' });
  assert.match(ui.panel.innerHTML, /Por ver <span class="mono">2<\/span>/);
  ui.click({ movieToggle: 'horizon' });
  ui.click({ movieToggle: 'horizon' });
  assert.match(ui.panel.innerHTML, /Drama · 4\/5/);
  assert.match(ui.panel.innerHTML, /Vistas <span class="mono">2<\/span>/);
});

test('los cálculos derivan solo de los datos ficticios', () => {
  const deltas = logic.healthDeltas(initialData);
  assert.equal(deltas.sleep.toFixed(2), '0.31');
  assert.equal(Math.round(deltas.steps), 506);
  assert.equal(Math.round(deltas.activity), 6);
  const finance = logic.financeSummary(initialData);
  assert.equal(finance.available, 464000);
  assert.equal(finance.daysLeft, 13);
  assert.deepEqual(finance.categories.filter((c) => c.overPace).map((c) => c.id), ['home', 'food', 'leisure']);
  const day = logic.dayNutrition(initialData.nutrition.days[0]);
  assert.deepEqual([day.calories, day.protein, day.carbs, day.fats], [2010, 93, 252, 66]);
  assert.equal(day.shares.protein + day.shares.carbs + day.shares.fats, 100);
  assert.deepEqual(logic.parseExercise(initialData.gym.exercises[3]), { sets: 3, reps: '30 s', kg: 0, repsNumber: 0 });
  const clock = initialData.demoClock;
  assert.deepEqual(initialData.agenda.filter((e) => e.day === 0).map((e) => logic.eventStatus(e, clock)), ['past', 'now', 'next', 'next']);
  assert.equal(initialData.health.trendLabels.length, initialData.health.sleepTrend.length);
  assert.equal(initialData.finances.monthLabels.length, initialData.finances.months.length);
});

test('la interfaz respeta la CSP: sin estilos en línea, fuentes propias y sin servicios externos', async () => {
  const [html, modules, css, icons] = await Promise.all(['index.html', 'modules.js', 'styles.css', 'icons.js'].map((name) => readFile(new URL(name, root), 'utf8')));
  for (const source of [html, modules, icons]) assert.doesNotMatch(source, /\sstyle="/);
  assert.doesNotMatch(css, /@import|https?:\/\//);
  assert.match(css, /url\('\.\/fonts\/geist\.woff2'\)/);
  await readFile(new URL('fonts/geist.woff2', root));
  await readFile(new URL('fonts/OFL-LICENSE.txt', root));
  const logicSource = await readFile(new URL('logic.js', root), 'utf8');
  assert.doesNotMatch(logicSource, /\bfetch\s*\(|localStorage|\bdocument\b|\bwindow\b/);
});

/* ───────── Etapa 3: captura, flujo vertical y arquitectura explicada ───────── */

test('gimnasio: agregar una serie desde la tarjeta actualiza la sesión, la comparación y se puede deshacer', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'gimnasio' });
  assert.match(ui.panel.innerHTML, /Series hoy<\/dt><dd class="mono">0<small>\/12/);
  app.__test.submit('set', { kg: '37.5', reps: '10' }, { exercise: 'press' });
  assert.match(ui.panel.innerHTML, /Series hoy<\/dt><dd class="mono">1<small>\/12/);
  assert.match(ui.panel.innerHTML, /375<small> kg/);
  assert.match(ui.panel.innerHTML, /Mejor · \+9,9 % e1RM vs 16 nov/);
  assert.match(ui.panel.innerHTML, /Récord personal \(e1RM\)/);
  assert.match(ui.announcement.textContent, /Serie agregada/);
  app.__test.undo();
  assert.match(ui.panel.innerHTML, /Series hoy<\/dt><dd class="mono">0<small>\/12/);
  app.__test.submit('set', { kg: '35.1', reps: '10' }, { exercise: 'press' });
  assert.match(ui.panel.innerHTML, /Usá incrementos de 0,25 kg/);
  assert.equal(app.__test.data.gym.today.length, 0);
});

test('gimnasio: progreso e historial derivan del historial sintético y de lo registrado hoy', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'gimnasio' });
  ui.click({ gymSet: 'press-1' });
  ui.click({ gymTab: 'progreso' });
  assert.match(ui.panel.innerHTML, /Fuerza estimada · Press de pecho/);
  assert.match(ui.panel.innerHTML, /13 sesiones/);
  ui.click({ gymExercise: 'row' });
  assert.match(ui.panel.innerHTML, /Fuerza estimada · Remo sentado/);
  ui.click({ gymTab: 'historial' });
  assert.match(ui.panel.innerHTML, /Hoy · en curso/);
  assert.match(ui.panel.innerHTML, /16 nov/);
});

test('nutrición: agregar y quitar un alimento recalcula energía, macros y cobertura', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'nutricion' });
  assert.match(ui.panel.innerHTML, /Dentro del rango 2\.000–2\.300 kcal/);
  assert.match(ui.panel.innerHTML, /Fibra <small class="cov is-partial"/);
  app.__test.submit('food', { foodId: 'almonds', amount: '2', portionId: 'handful', moment: 'Merienda' });
  assert.match(ui.panel.innerHTML, /2\.357<\/strong><small>kcal/);
  assert.match(ui.panel.innerHTML, /57 kcal sobre el máximo del rango/);
  assert.match(ui.panel.innerHTML, /Almendras <small class="muted">2 puñados · 60 g/);
  const id = app.__test.data.nutrition.days[0].meals.at(-1).id;
  ui.click({ foodRemove: id });
  assert.match(ui.panel.innerHTML, /2\.010<\/strong>/);
  app.__test.submit('food', { foodId: 'almonds', amount: '0', portionId: 'handful', moment: 'Merienda' });
  assert.match(ui.panel.innerHTML, /La cantidad debe ser mayor que 0/);
  ui.click({ nutritionTab: 'tendencias' });
  assert.match(ui.panel.innerHTML, /Días dentro del rango/);
  ui.click({ nutritionTab: 'catalogo' });
  assert.match(ui.panel.innerHTML, /Empanada de carne/);
  assert.match(ui.panel.innerHTML, /sin dato/);
});

test('captura conversacional: interpretar, revisar, confirmar y ver el impacto en varios módulos', () => {
  ui.click({ action: 'reset' });
  ui.click({ openCapture: '' });
  app.__test.submit('parse', { text: 'Hice press de pecho, 3 series de 10 con 35 kilos. Gasté 12.500 en el supermercado. Comí 2 huevos y un café' });
  const result = app.__test.ui.capture.result;
  assert.deepEqual(result.intents.map((i) => i.kind), ['gym.set', 'finance.expense', 'food.entry']);
  assert.equal(result.unparsed.length, 1);
  app.__test.submit('confirm', {});
  assert.match(app.__test.ui.capture.lastApplied, /3 series de Press de pecho · gasto de \$ 12\.500 en Alimentación · Huevo en desayuno/);
  assert.equal(app.__test.data.gym.today.length, 3);
  ui.click({ tab: 'finanzas' });
  assert.match(ui.panel.innerHTML, /\$ 451\.500<span> disponibles/);
  assert.match(ui.panel.innerHTML, /Supermercado/);
  ui.click({ tab: 'hoy' });
  assert.match(ui.panel.innerHTML, /Cuidarme: 1 de 3 hoy/);
  app.__test.undo();
  ui.click({ tab: 'finanzas' });
  assert.match(ui.panel.innerHTML, /\$ 464\.000<span> disponibles/);
  assert.equal(app.__test.data.gym.today.length, 0);
});

test('captura: datos faltantes bloquean la confirmación y el formulario crea tareas', () => {
  ui.click({ action: 'reset' });
  ui.click({ openCapture: '' });
  app.__test.submit('parse', { text: 'hice sentadilla' });
  app.__test.submit('confirm', {});
  assert.deepEqual(Object.keys(app.__test.ui.capture.errors.i0).sort(), ['kg', 'reps']);
  assert.equal(app.__test.data.gym.today.length, 0);
  ui.click({ captureMode: 'form' });
  ui.click({ captureType: 'task' });
  app.__test.submit('quick', { title: '<b>Preparar</b> la retro', priority: 'Alta' });
  ui.click({ tab: 'tareas' });
  assert.match(ui.panel.innerHTML, /&lt;b&gt;Preparar&lt;\/b&gt; la retro/);
  assert.doesNotMatch(ui.panel.innerHTML, /<b>Preparar<\/b>/);
  ui.click({ action: 'reset' });
  ui.click({ tab: 'tareas' });
  assert.doesNotMatch(ui.panel.innerHTML, /Preparar<\/b>|la retro/);
});

test('«Cómo funciona» explica el sistema real y distingue lo que la demo simula', () => {
  ui.click({ tab: 'sistema' });
  assert.equal(ui.breadcrumb.textContent, 'Cómo funciona');
  assert.match(ui.panel.innerHTML, /Chat para operar\. Fuentes canónicas para guardar/);
  assert.match(ui.panel.innerHTML, /Huawei Band[\s\S]*Health Auto Export[\s\S]*Health Sync/);
  assert.match(ui.panel.innerHTML, /Notion[\s\S]*Google Sheets[\s\S]*Google Calendar/);
  ui.click({ systemMode: 'demo' });
  assert.match(ui.panel.innerHTML, /Intérprete local por reglas/);
  assert.match(ui.panel.innerHTML, /No hay IA ni red/);
});

/* ───────── Etapa 4: flujos con relaciones entre módulos ───────── */

test('finanzas: Safe-to-Spend reacciona a un gasto registrado y el simulador explica el escenario', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'finanzas' });
  ui.click({ financeTab: 'capacity' });
  assert.match(ui.panel.innerHTML, /\$ 222\.000<span> libres para gastar/);
  app.__test.submit('purchase', { amount: '400000' });
  assert.match(ui.panel.innerHTML, /usaría dinero ya comprometido/);
  assert.doesNotMatch(ui.panel.innerHTML, /te recomendamos|no compres/i);
  app.__test.submit('purchase', { amount: 'abc' });
  assert.match(ui.panel.innerHTML, /Ingresá un importe entero mayor que 0/);
  ui.click({ openCapture: 'expense' });
  app.__test.submit('quick', { amount: '12500', categoryId: 'food', description: 'Verdulería' });
  assert.match(ui.panel.innerHTML, /\$ 209\.500<span> libres para gastar/);
  ui.click({ financeTab: 'movements' });
  assert.match(ui.panel.innerHTML, /Transferencia entre cuentas propias/);
  ui.click({ movementFilter: 'expense' });
  assert.match(ui.panel.innerHTML, /Verdulería/);
  assert.doesNotMatch(ui.panel.innerHTML, /Sueldo/);
  ui.click({ financeTab: 'resilience' });
  assert.match(ui.panel.innerHTML, /Volatilidad mensual/);
});

test('compras: la reposición sugiere, la lista registra la compra y la estimación se recalcula', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'compras' });
  ui.click({ shoppingTab: 'restock' });
  assert.match(ui.panel.innerHTML, /Café molido[\s\S]*?Vencido/);
  ui.click({ restockAdd: 'coffee' });
  ui.click({ shoppingTab: 'list' });
  assert.match(ui.panel.innerHTML, /Café molido[\s\S]*?Sugerido por reposición/);
  const item = app.__test.data.shopping.find((i) => i.needId === 'coffee');
  ui.change(item.id, 'shoppingCheck', true);
  assert.equal(app.__test.data.household.extraPurchases.length, 1);
  ui.click({ shoppingTab: 'restock' });
  assert.doesNotMatch(ui.panel.innerHTML, /Café molido<\/strong>[\s\S]{0,200}Vencido/);
  ui.change(item.id, 'shoppingCheck', false);
  assert.equal(app.__test.data.household.extraPurchases.length, 0, 'destildar revierte la compra');
  ui.click({ restockCorrect: 'yerba:OUT' });
  assert.match(ui.panel.innerHTML, /Yerba[\s\S]*?Para agregar[\s\S]*?corregido: «se acabó»/);
});

test('salud: resumen con scores explicables, contexto de otros módulos y cobertura', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'salud' });
  assert.match(ui.panel.innerHTML, /Disposición de hoy/);
  ui.click({ healthScore: 'sleep' });
  assert.match(ui.panel.innerHTML, /Continuidad<\/strong><span class="mono">sin dato/);
  assert.match(ui.panel.innerHTML, /Cardio semanal<\/span><strong class="mono">93 %/);
  ui.click({ healthTab: 'coverage' });
  assert.match(ui.panel.innerHTML, /FC en reposo<small class="mono">26\/28/);
  assert.match(ui.panel.innerHTML, /HRV<small class="mono">0\/28/);
});

test('gimnasio: registrar cardio actualiza MET-min en Gimnasio y en Salud', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'gimnasio' });
  ui.click({ gymTab: 'cardio' });
  assert.match(ui.panel.innerHTML, /2\.773<span> de 2\.980 MET-min/);
  app.__test.submit('cardio', { modality: 'football', minutes: '60', rpe: '', watts: '' });
  assert.match(ui.panel.innerHTML, /3\.193<span> de 2\.980 MET-min/);
  assert.match(ui.panel.innerHTML, /107 %/);
  app.__test.submit('cardio', { modality: 'bike', minutes: '2', rpe: '', watts: '' });
  assert.match(ui.panel.innerHTML, /Entre 5 y 300 minutos/);
  ui.click({ tab: 'salud' });
  assert.match(ui.panel.innerHTML, /Cardio semanal<\/span><strong class="mono">107 %/);
});

test('estudio: respuesta escrita, calificación y próximos repasos', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'mazos' });
  ui.click({ deck: 'english' });
  ui.click({ nextCard: '' });
  ui.click({ nextCard: '' });
  assert.match(ui.panel.innerHTML, /past tense of “seek”/);
  app.__test.submit('answer', { answer: 'Sought' }, { card: 'english:2' });
  assert.match(ui.panel.innerHTML, /¡Correcto!/);
  assert.match(ui.panel.innerHTML, /Respuesta/);
  ui.click({ cardRate: 'easy' });
  assert.match(ui.panel.innerHTML, /Próximos repasos de este mazo/);
  assert.match(ui.panel.innerHTML, /en 4 días/);
  assert.match(ui.panel.innerHTML, /0 nuevas · 0 en sesión · 3 programadas/);
});

test('películas y series: progreso por episodio, calificación por temporada y resumen', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'peliculas' });
  ui.click({ mediaTab: 'series' });
  assert.match(ui.panel.innerHTML, /13\/16 episodios/);
  ui.click({ episode: 'faro' });
  assert.match(ui.panel.innerHTML, /14\/16 episodios/);
  ui.click({ seasonRate: 'orbita:1:3' });
  assert.match(ui.panel.innerHTML, /data-season-rate="orbita:1:3" aria-pressed="true"/);
  ui.click({ seriesFilter: 'planned' });
  assert.match(ui.panel.innerHTML, /Cocina de barrio/);
  assert.doesNotMatch(ui.panel.innerHTML, /Faro norte/);
  ui.click({ mediaTab: 'summary' });
  assert.match(ui.panel.innerHTML, /Episodios vistos<\/dt><dd class="mono">24/);
});

test('centro de información: piezas de ejemplo con procedencia, feedback canónico y automatizaciones simuladas', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'informacion' });
  assert.match(ui.panel.innerHTML, /pieza de ejemplo/);
  assert.match(ui.panel.innerHTML, /no son noticias/);
  ui.click({ infoFront: 'tecnologia' });
  assert.match(ui.panel.innerHTML, /Idempotencia con un ejemplo/);
  assert.doesNotMatch(ui.panel.innerHTML, /Cómo leer una búsqueda full-stack/);
  ui.click({ infoOpen: 'p-idempotency' });
  assert.match(ui.panel.innerHTML, /Procedencia:/);
  assert.equal((ui.panel.innerHTML.match(/data-info-feedback="p-idempotency:/g) ?? []).length, 6);
  ui.click({ infoFeedback: 'p-idempotency:WANT_DEEPER' });
  assert.match(ui.panel.innerHTML, /data-info-feedback="p-idempotency:WANT_DEEPER" aria-pressed="true"/);
  ui.click({ infoTab: 'radar' });
  assert.match(ui.panel.innerHTML, /Evaluar ahora/);
  ui.click({ infoTab: 'automations' });
  ui.click({ automationToggle: 'daily-briefing' });
  ui.click({ automationRun: 'daily-briefing' });
  assert.match(ui.panel.innerHTML, /Pausada: el kill switch impidió la ejecución/);
  app.__test.undo();
  app.__test.undo();
  ui.click({ automationRun: 'daily-briefing' });
  assert.match(ui.panel.innerHTML, /Ejecución manual simulada/);
});

/* ───────── Etapa 5A: Plan y logros, Inglés ───────── */

test('plan: «En qué quedé» marca frentes desactualizados y registrar avance los pone al día', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'plan' });
  assert.match(ui.panel.innerHTML, /2 de 4 frentes necesitan atención/);
  assert.match(ui.panel.innerHTML, /Sitio Boreal[\s\S]*?Bloqueado y sin avances/);
  ui.click({ continuityEdit: 'c-ruta' });
  app.__test.submit('continuity', { nextAction: 'x', blocker: '' }, { item: 'c-ruta' });
  assert.match(ui.panel.innerHTML, /Describí el próximo paso/);
  app.__test.submit('continuity', { nextAction: 'Hacer el ejercicio de genéricos', blocker: '' }, { item: 'c-ruta' });
  assert.match(ui.panel.innerHTML, /1 de 4 frentes necesitan atención/);
  assert.match(ui.panel.innerHTML, /Hacer el ejercicio de genéricos/);
});

test('plan: hitos, revisión semanal compuesta desde los módulos y logros validados', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'plan' });
  ui.click({ planTab: 'goals' });
  assert.match(ui.panel.innerHTML, /Lanzar Producto Aurora[\s\S]*?2<small>\/4/);
  ui.change('g-aurora:m3', 'milestoneCheck', true);
  assert.match(ui.panel.innerHTML, /Lanzar Producto Aurora[\s\S]*?3<small>\/4/);
  ui.click({ planTab: 'review' });
  assert.match(ui.panel.innerHTML, /Sesiones de gimnasio<\/dt><dd class="mono">2\/3/);
  app.__test.submit('review', { wentWell: 'ok', adjust: '', focus: '' });
  assert.match(ui.panel.innerHTML, /Escribí al menos unas palabras/);
  app.__test.submit('review', { wentWell: 'Cerré la demo', adjust: 'Dormir antes', focus: 'Lanzamiento' });
  assert.match(ui.panel.innerHTML, /Semana 16–22 nov/);
  assert.match(ui.panel.innerHTML, /Tareas cerradas: 1\/4/);
  ui.click({ planTab: 'achievements' });
  app.__test.submit('achievement', { title: 'Demo lista', category: 'PROJECT', date: '2026-02-30' });
  assert.match(ui.panel.innerHTML, /Fecha inválida/);
  app.__test.submit('achievement', { title: 'Demo lista', category: 'PROJECT', date: '2026-11-17' });
  assert.match(ui.panel.innerHTML, /Demo lista[\s\S]*?Autoinformado/);
});

test('inglés: un error recurrente se convierte en tarjeta del mazo, sin duplicarse', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'ingles' });
  ui.click({ englishAnswer: 'for' });
  assert.match(ui.panel.innerHTML, /patrón recurrente de tu perfil: <strong>«since» vs «for»/);
  ui.click({ englishCard: 'w-since' });
  assert.match(ui.panel.innerHTML, /Ya está en el mazo/);
  assert.equal(app.__test.data.decks.find((d) => d.id === 'english').cards.length, 4);
  ui.click({ englishTab: 'profile' });
  assert.match(ui.panel.innerHTML, /B1 \(provisional\)/);
  assert.match(ui.panel.innerHTML, /Pronunciación[\s\S]*?Sin evidencia suficiente/);
  ui.click({ englishCard: 'w-third' });
  ui.click({ tab: 'mazos' });
  ui.click({ deck: 'english' });
  assert.match(ui.panel.innerHTML, /Idiomas · 5 tarjetas/);
  ui.click({ tab: 'ingles' });
  ui.click({ englishTab: 'sessions' });
  app.__test.submit('english-session', { type: 'conversation', minutes: '30', focus: 'Pitch del producto' });
  assert.match(ui.panel.innerHTML, /Pitch del producto/);
  assert.match(ui.panel.innerHTML, /Sesiones en noviembre<\/dt><dd class="mono">6/);
});

test('etapa 5B: ventanas de nutrientes, benchmark, rutina y cobertura explícita', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'nutricion' });
  ui.click({ nutritionTab: 'nutrientes' });
  assert.match(ui.panel.innerHTML, /Micronutrientes · promedios comparables/);
  assert.match(ui.panel.innerHTML, /Calcio[\s\S]*?Atención/);
  ui.click({ nutritionWindow: '7' });
  assert.match(ui.panel.innerHTML, /2\/7/);
  assert.doesNotMatch(ui.panel.innerHTML, /<span class="state-pill is-watch">Atención<\/span>/);
  ui.click({ tab: 'gimnasio' });
  ui.click({ gymTab: 'progreso' });
  assert.match(ui.panel.innerHTML, /Referencia de fuerza/);
  assert.match(ui.panel.innerHTML, /Intermedio/);
  assert.match(ui.panel.innerHTML, /Los umbrales se inventaron/);
  ui.click({ gymTab: 'rutina' });
  assert.match(ui.panel.innerHTML, /Alternativa visual «V4»/);
  assert.match(ui.panel.innerHTML, /no aplicada/);
});

test('etapa 5B: importar extracto de prueba detecta duplicados, se puede deshacer y repetir sin efecto', () => {
  ui.click({ action: 'reset' });
  ui.click({ tab: 'finanzas' });
  ui.click({ financeTab: 'import' });
  assert.match(ui.panel.innerHTML, /Confirmar 4 movimientos/);
  assert.match(ui.panel.innerHTML, /Movimiento negativo[\s\S]*?−\$ 1\.500[\s\S]*?Inválido/);
  ui.click({ financeImport: 'example' });
  assert.match(ui.panel.innerHTML, /Todo conciliado/);
  assert.equal(app.__test.data.finances.movements.length, 2);
  ui.click({ financeImport: 'example' });
  assert.equal(app.__test.data.finances.movements.length, 2);
  ui.click({ financeTab: 'movements' });
  assert.match(ui.panel.innerHTML, /Café y merienda/);
  ui.click({ action: 'undo' });
  assert.equal(app.__test.data.finances.movements.length, 0);
  ui.click({ financeTab: 'import' });
  assert.match(ui.panel.innerHTML, /Confirmar 4 movimientos/);
});
