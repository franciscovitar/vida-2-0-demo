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
  assert.match(ui.panel.innerHTML, /Un día con intención/);
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
  assert.match(ui.panel.innerHTML, /P 21 g/);
  ui.click({ nutritionDay: '1' });
  assert.match(ui.panel.innerHTML, /1\.110/);
  assert.doesNotMatch(ui.panel.innerHTML, /P 21 g/);
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
  assert.equal(ui.breadcrumb.textContent, 'Mi día');
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
