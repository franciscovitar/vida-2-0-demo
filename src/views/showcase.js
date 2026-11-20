/** Presentación pública y recorrido opcional para lectores de portfolio. */
import { icon } from '../../icons.js';

const TOUR_STEPS = [
  {
    heading: '1. Captura: registrá algo como lo dirías',
    body: 'Abrí «Registrar», elegí el ejemplo del supermercado e interpretalo. Vas a revisar los datos antes de confirmar; esta demo usa reglas locales, no una IA conectada.',
    action: `<button type="button" class="btn btn-outline" data-open-capture="">${icon('plus', 16)} Probar registro</button>`,
  },
  {
    heading: '2. Resultado: explorá qué cambió',
    body: 'El gasto que acabás de registrar aparece en Finanzas y modifica el disponible y las categorías. Si preferiste no registrarlo, también podés explorar los cálculos de ejemplo.',
    action: `<button type="button" class="btn btn-outline" data-finance-tab="movements">${icon('finanzas', 16)} Ver movimientos</button>`,
  },
  {
    heading: '3. Ingeniería: compará la demo con el sistema real',
    body: 'Conocé cómo ChatGPT, las Skills y las fuentes canónicas se conectan en Vida 2.0. La demo es pública y aislada: nunca consulta cuentas ni datos personales.',
    action: `<button type="button" class="btn btn-outline" data-system-mode="demo">${icon('code', 16)} Comparar implementaciones</button>`,
  },
];

export function recruiterIntro() {
  return `<section class="portfolio-intro" aria-label="Presentación del proyecto para portfolio">
    <div class="portfolio-intro-copy">
      <p class="kicker">Caso de estudio · Francisco Vitar · diseño y desarrollo</p>
      <strong class="portfolio-intro-title">De datos dispersos a una vida más organizada.</strong>
      <p>Diseñé Vida 2.0 para conectar organización, salud, aprendizaje y finanzas. Explorá una demo independiente con datos ficticios y descubrí cómo funciona el sistema real.</p>
      <div class="portfolio-actions">
        <button type="button" class="btn btn-dark" data-tour="start">${icon('arrow', 16)} Recorrido guiado · 90 s</button>
        <button type="button" class="btn btn-outline" data-tab="sistema">Ver arquitectura</button>
      </div>
    </div>
    <dl class="portfolio-facts"><div><dt>15</dt><dd>vistas navegables</dd></div><div><dt>4</dt><dd>áreas conectadas</dd></div><div><dt>100 %</dt><dd>datos ficticios</dd></div></dl>
  </section>`;
}

export function recruiterGuide(ui) {
  if (!ui.tourOpen) return '';
  const step = TOUR_STEPS[ui.tourStep] ?? TOUR_STEPS[0];
  return `<section class="recruiter-guide" aria-label="Recorrido de 90 segundos" tabindex="-1">
    <div class="recruiter-guide-head"><span class="kicker">Recorrido guiado · ${ui.tourStep + 1} de ${TOUR_STEPS.length} · 90 s aprox.</span>
      <button type="button" class="icon-btn" data-tour="close" aria-label="Cerrar recorrido">${icon('close', 16)}</button></div>
    <h2>${step.heading}</h2><p>${step.body}</p>
    <div class="recruiter-guide-actions">${step.action}
      <span class="spacer"></span>
      ${ui.tourStep > 0 ? '<button type="button" class="btn btn-ghost" data-tour="prev">Anterior</button>' : ''}
      <button type="button" class="btn btn-dark" data-tour="next">${ui.tourStep === TOUR_STEPS.length - 1 ? 'Finalizar recorrido' : 'Siguiente paso'} ${icon('arrow', 16)}</button>
    </div>
  </section>`;
}
