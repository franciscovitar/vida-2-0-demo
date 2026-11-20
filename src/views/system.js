/**
 * "Cómo funciona Vida 2.0": arquitectura del sistema original (verificada en su repositorio y en
 * la documentación del Personal AI System) frente a lo que ejecuta esta demo. Plantillas puras.
 */
import { esc, icon, pageHead } from './ui.js';

const ORIGINAL = 'https://github.com/franciscovitar/vida-2.0';
const DEMO = 'https://github.com/franciscovitar/vida-2-0-demo';

function flow(steps, label) {
  return `<ol class="flow" aria-label="${esc(label)}">${steps.map((s, i) => `<li class="flow-step ${s.tone ? `is-${s.tone}` : ''}"><span class="flow-index mono">${String(i + 1).padStart(2, '0')}</span><strong>${s.title}</strong><span>${s.text}</span>${s.tags ? `<span class="flow-tags">${s.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</span>` : ''}</li>`).join('')}</ol>`;
}

const CAPTURE_REAL = [
  { title: 'Lo contás como te sale', text: 'Texto o audio en un proyecto de ChatGPT con instrucciones propias de cada dominio.', tags: ['ChatGPT Projects'] },
  { title: 'Se interpreta', text: 'El Personal AI System separa intenciones, detecta datos faltantes y delega en Skills de dominio.', tags: ['PAS', 'Gym Intelligence', 'Nutrition Intelligence'] },
  { title: 'Se valida', text: 'Política por operación: qué se aplica directo, qué pide aclaración y qué necesita aprobación.', tags: ['Policy', 'Idempotencia'] },
  { title: 'Se guarda en su fuente', text: 'Cada dato vive en su autoridad canónica, por conector autorizado.', tags: ['Notion', 'Google Sheets', 'Google Calendar', 'Drive'], tone: 'source' },
  { title: 'Vida lo muestra', text: 'La web lee esas fuentes y compone vistas derivadas. No es una base paralela.', tags: ['Next.js', 'Vistas derivadas'], tone: 'vida' },
];

const CAPTURE_DEMO = [
  { title: 'Lo escribís en «Registrar»', text: 'Texto libre o formulario dentro de esta página.' },
  { title: 'Intérprete local por reglas', text: 'Reconoce patrones acotados y muestra lo que no entendió. No hay IA ni red.' },
  { title: 'Validación + vista previa', text: 'Revisás y corregís antes de confirmar. Se puede deshacer.' },
  { title: 'Estado en memoria', text: 'Nada sale del navegador. Recargar o «Reiniciar demo» vuelve al inicio.', tone: 'source' },
  { title: 'Las vistas se recalculan', text: 'Gimnasio, Nutrición, Finanzas y Hoy reflejan el cambio al instante.', tone: 'vida' },
];

const HEALTH = [
  { title: 'Huawei Band', text: 'Mide sueño, pasos, actividad y frecuencia cardíaca.' },
  { title: 'Huawei Health → Apple Health', text: 'La app del fabricante sincroniza con Apple Health.' },
  { title: 'Health Auto Export', text: 'Exporta JSON estructurado por día.' },
  { title: 'Drive (archivo crudo)', text: 'La evidencia original queda guardada; nunca se expone a la web.', tone: 'source' },
  { title: 'Health Sync (Apps Script)', text: 'Reconcilia, deduplica fechas lógicas y escribe métricas normalizadas.' },
  { title: 'Google Sheets → Vida', text: 'Vida lee solo lo normalizado y calcula scores explicables con su cobertura.', tone: 'vida' },
];

const SOURCES = [
  ['Notion', 'Áreas, proyectos, tareas, Bandeja, rutina y plan de dieta'],
  ['Google Sheets', 'Gimnasio, nutrición, hábitos, salud, sueño, productividad'],
  ['Google Calendar', 'Agenda y bloques de tiempo'],
  ['Google Drive', 'Evidencia pesada u original (exportaciones de salud)'],
  ['Vida Web', 'Vistas derivadas, interpretación y revisión'],
];

const COMPARE = [
  ['Captura', 'ChatGPT + Skills del Personal AI System; Telegram y WhatsApp planificados', 'Formulario e intérprete local por reglas'],
  ['Almacenamiento', 'Fuente canónica por dominio (Notion, Sheets, Calendar, Drive)', 'Memoria de la pestaña'],
  ['Salud', 'Huawei Band → … → Health Sync → Sheets', 'Series sintéticas de 7 días'],
  ['Escrituras', 'Detrás de flags; política, idempotencia, auditoría y rollback', 'Inmediatas, con deshacer local'],
  ['IA', 'Interpreta lenguaje y explica evidencia estructurada', 'No hay IA'],
  ['Acceso', 'Autenticado (NextAuth)', 'Público, sin cuentas'],
];

const CAPABILITIES = [
  ['impl', 'Comparaciones de fuerza con e1RM (Epley, 1–15 reps, ±2 % estable)', 'demo'],
  ['impl', 'Cardio semanal en MET-min con nivel de confianza', 'demo'],
  ['impl', 'Nutrición con cobertura: desconocido nunca es cero', 'demo'],
  ['impl', 'Scores de salud explicables con contribuyentes y confianza', 'adapted'],
  ['impl', 'Motor de estudio con FSRS e intentos offline idempotentes', 'adapted'],
  ['impl', 'Reposición del hogar por cadencia (mediana robusta, confianza)', 'demo'],
  ['impl', 'Safe-to-Spend, simulador de compra y resiliencia de ingresos', 'demo'],
  ['impl', 'Importadores de Mercado Pago y Naranja X con conciliación', null],
  ['impl', 'Lecturas publicadas con procedencia y feedback explícito', 'adapted'],
  ['flag', 'Escrituras seguras: política, confirmación, rollback cifrado', null],
  ['flag', 'API OpenClaw HMAC: solo lectura + propuestas pendientes', null],
  ['flag', 'Automatizaciones con kill switches y store cifrado', 'adapted'],
  ['draft', 'Rhythm Stability (calculadora pura, no conectada a la UI)', null],
];

const IN_DEMO = { demo: ['También en la demo', 'a-org'], adapted: ['Adaptado en la demo', 'a-life'] };

const STATUS = { impl: 'Implementado', flag: 'Detrás de feature flag', draft: 'En desarrollo' };

export function systemView(ui) {
  const showDemo = ui.systemMode === 'demo';
  return `${pageHead('Arquitectura', 'Cómo funciona Vida 2.0', 'Chat para operar. Fuentes canónicas para guardar. Vida para ver, entender y decidir.')}
    <section class="card system-hero">
      <div><p class="eyebrow a-org">La idea central</p><p class="system-quote">Registrar algo no debería exigir abrir un formulario. En el sistema real, lo contás en una conversación; cada dato termina en su fuente de verdad y Vida lo convierte en contexto, comparaciones y decisiones.</p></div>
      <div class="seg-control" role="group" aria-label="Ver flujo">${[['real', 'Sistema real'], ['demo', 'Esta demo']].map(([id, label]) => `<button type="button" data-system-mode="${id}" aria-pressed="${(ui.systemMode ?? 'real') === id}">${label}</button>`).join('')}</div>
    </section>
    <section aria-labelledby="flow-title" class="system-block">
      <h2 id="flow-title">${showDemo ? 'Qué pasa cuando registrás algo en esta demo' : 'Qué pasa cuando registro algo en el sistema real'}</h2>
      ${flow(showDemo ? CAPTURE_DEMO : CAPTURE_REAL, 'Flujo de captura')}
      ${showDemo ? '<p class="muted small">La demo reproduce la experiencia (contarlo, revisar, confirmar, ver el impacto), no la infraestructura.</p>' : '<p class="muted small">Si un conector directo y confiable alcanza, se prefiere escribir directo en la fuente. El runtime de Vida solo interviene cuando aporta garantías: validación, idempotencia, auditoría o rollback.</p>'}
      <button type="button" class="btn btn-dark" data-open-capture>${icon('check', 16)} Probar «Registrar»</button>
    </section>
    <div class="split even">
      <section class="card" aria-labelledby="sources-title"><h2 id="sources-title">Dónde vive cada dato</h2><dl class="source-list">${SOURCES.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></section>
      <section class="card" aria-labelledby="compare-title"><h2 id="compare-title">Sistema real vs. demo</h2><div class="table-wrap"><table class="data-table compare"><thead><tr><th scope="col"></th><th scope="col">Vida 2.0</th><th scope="col">Demo</th></tr></thead><tbody>${COMPARE.map(([a, b, c]) => `<tr><th scope="row">${a}</th><td>${b}</td><td>${c}</td></tr>`).join('')}</tbody></table></div></section>
    </div>
    <section aria-labelledby="health-title" class="system-block">
      <h2 id="health-title">Salud: de la pulsera a una lectura explicable</h2>
      ${flow(HEALTH, 'Flujo de datos de salud')}
      <p class="muted small">La integración directa con HUAWEI Health Kit está descartada por defecto hasta que una auditoría demuestre que el puente pierde métricas valiosas. Los scores muestran contribuyentes y confianza; un dato faltante nunca se convierte en cero ni en diagnóstico.</p>
    </section>
    <section class="card" aria-labelledby="cap-title">
      <div class="card-head"><h2 id="cap-title">Capacidades del sistema original</h2><span class="muted small">verificadas en el código</span></div>
      <ul class="cap-list">${CAPABILITIES.map(([s, text, inDemo]) => `<li><span class="status-pill is-${s}">${STATUS[s]}</span><span>${text}</span>${inDemo ? `<span class="tag ${IN_DEMO[inDemo][1]}">${IN_DEMO[inDemo][0]}</span>` : ''}</li>`).join('')}</ul>
    </section>
    <details class="card engineering">
      <summary><span><strong>Detalles de ingeniería</strong><span class="muted small"> · para lectores técnicos</span></span>${icon('chevron', 16)}</summary>
      <div class="eng-grid">
        <div><h3>Stack</h3><p>Next.js 16 (App Router), React 19, TypeScript, SCSS Modules, NextAuth, Neon Postgres, APIs de Notion y Google, <code>ts-fsrs</code>. Pruebas con <code>node:test</code> + <code>tsx</code>.</p></div>
        <div><h3>Fallar cerrado</h3><p>Si una fuente real configurada falla, la vista muestra un estado explícito; no se inyectan datos simulados como fallback.</p></div>
        <div><h3>Feature flags estrictas</h3><p>Escrituras, API de agentes y automatizaciones solo se activan con el valor exacto <code>true</code>; ausentes, quedan apagadas.</p></div>
        <div><h3>Escrituras reversibles</h3><p>Motor de políticas, confirmaciones, idempotencia y auditoría; saga con leases y rollback acotado al recurso propio, con cifrado AES-GCM.</p></div>
        <div><h3>API para agentes</h3><p>Firma HMAC servidor a servidor. Solo lee contexto autorizado y crea propuestas pendientes; nunca aprueba ni ejecuta escrituras finales.</p></div>
        <div><h3>Entornos separados</h3><p>Selector DEV/PROD de Sheets resuelto en servidor, sin fallback implícito a producción; preflight de Preview que rechaza configuraciones inseguras.</p></div>
        <div><h3>Esta demo</h3><p>JavaScript modular sin dependencias, reducer con deshacer, dominios puros testeados, CSP estricta (<code>connect-src 'none'</code>, sin estilos en línea) y fuentes autoalojadas.</p></div>
      </div>
    </details>
    <section class="card links-card"><div><h2>Ver el código</h2><p class="muted">El repositorio original es público; los datos y credenciales nunca forman parte del código.</p></div><div class="links-row"><a class="btn btn-outline" href="${ORIGINAL}" target="_blank" rel="noopener noreferrer">${icon('code', 16)} Vida 2.0 (original)</a><a class="btn btn-outline" href="${DEMO}" target="_blank" rel="noopener noreferrer">${icon('code', 16)} Esta demo</a></div></section>`;
}
