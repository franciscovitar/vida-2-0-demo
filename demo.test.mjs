import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { initialData } from './data.js';

const root = new URL('./', import.meta.url);

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
await import('./app.js');

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
  assert.deepEqual(groups.flat().sort(), ['agenda', 'compras', 'finanzas', 'gimnasio', 'ingles', 'mazos', 'nutricion', 'peliculas', 'proyectos', 'salud', 'tareas']);
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
  assert.doesNotMatch(ui.panel.innerHTML, /aria-pressed="true"/);
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
