# Vida 2.0 Demo — Showcase roadmap

Documento vivo. Refleja evidencia verificada en el código del sistema original y el estado real de la demo.
Última actualización: 2026-11-20 · rama `feat/full-showcase-capture`.

## 0. Fuentes de evidencia

| Fuente | Estado observado | Uso en esta tarea |
| --- | --- | --- |
| `franciscovitar/vida-2-0-demo` | `main` = `7a78161` (refinamiento violeta del usuario). Rama de trabajo creada desde ahí. | Único repositorio modificado. |
| `franciscovitar/vida-2.0` | Clon de solo lectura en carpeta temporal, `main` = `194c3ea` (2026-11). 1.254 archivos, 227 tests. La carpeta local con ese nombre **no** es un clon del repositorio (solo contiene herramientas auxiliares), por eso se clonó aparte. | Lectura de código y `docs/`. Sin commits, sin push. |
| `franciscovitar/personal-ai-system` (privado) | Accesible por API de GitHub. | Lectura puntual de `AI/projects/vida-2/health-intelligence/README.md` para el flujo Huawei. Nada copiado salvo descripciones de arquitectura. |

Nada de lo siguiente se copió a la demo: datos personales, IDs de Sheets/Notion, variables de entorno, payloads de salud, nombres de terceros.

## 1. Cómo funciona el original (resumen verificable)

**Stack:** Next.js 16 (App Router), React 19, TypeScript 6, SCSS/CSS Modules, NextAuth 5 beta, Neon Postgres, Notion API, Google APIs, `ts-fsrs`. Tests con `node:test` + `tsx`.

**Decisión central (ADR 0006, `docs/adr/0006-conversational-capture.md`):**

> Chat para operar. Fuentes canónicas para guardar. Vida Web para ver, entender y decidir.

- La captura cotidiana ocurre en canales conversacionales (ChatGPT primero; Telegram/WhatsApp planificados).
- Personal AI System (PAS) segmenta el mensaje, detecta intenciones, pide datos faltantes y elige la autoridad canónica; las Skills de dominio (Gym Intelligence, Nutrition Intelligence) estructuran y escriben en sus stores.
- Se prefiere un conector directo a la fuente canónica; el runtime de Vida solo interviene cuando agrega garantías (validación, idempotencia, auditoría, rollback).
- Autoridades: **Notion** (áreas, proyectos, tareas, Bandeja, plan de dieta, rutina), **Google Sheets** (gimnasio, nutrición, hábitos, salud, sueño, métricas), **Google Calendar** (agenda), **Drive** (evidencia pesada). Vida Web compone vistas derivadas y no es base paralela.

**Salud (PAS `health-intelligence/README.md` + `docs/health-rhythm-v1.md`):**
`Huawei Band → Huawei Health → Apple Health → Health Auto Export (JSON) → Drive (archivo crudo) → Health Sync (Apps Script: reconciliación, dedupe) → Google Sheets normalizado → Vida (solo lectura)`.
La integración directa con HUAWEI Health Kit está rechazada por defecto hasta que una auditoría demuestre pérdida de valor. Scores explicables `health-scores-v1.2.0` con contribuyentes, confianza y fuerza de evidencia; *missing nunca es cero*; sin diagnóstico.

**Ingeniería transversal verificada en código/docs:**
- Feature flags que solo aceptan el valor exacto `true` (`WRITE_ACTIONS_ENABLED`, `OPENCLAW_API_ENABLED`, `WEB_CATALOG_ENABLED`, `AUTOMATIONS_*`, `FINANCE_WRITES_ENABLED`, `HOUSEHOLD_REPLENISHMENT_ENABLED`, …).
- Fail-closed: si una fuente real falla, no se inyectan mocks (Agenda vacía con aviso).
- Safe Writes: policy engine, confirmaciones, idempotencia, auditoría, escrituras reversibles con saga, leases y cifrado AES-GCM (ADR 0002/0005).
- API OpenClaw: HMAC server-to-server, solo lectura + propuestas `pending` (ADR 0003/0004).
- Automatizaciones: store cifrado AES-256-GCM, kill switches, idempotencia, estados `queued → running → succeeded|failed|skipped|cancelled`.
- Selector de Sheets DEV/PROD sin fallback implícito a producción.

## 2. Inventario funcional del original

Estados: **Impl.** = implementado y en rutas activas · **Flag** = implementado detrás de feature flag apagada por defecto · **Draft** = rama/documento sin desplegar · **Docs** = solo documentado.

| Dominio | Capacidad (evidencia) | Estado | Fuente canónica | En demo hoy | Decisión para la demo |
| --- | --- | --- | --- | --- | --- |
| Hoy / planificación | Composición Notion + Sheets + Calendar; "En qué quedé"; plan diario (`lib/daily-planning`) | Impl. / Draft (fase F) | Notion, Calendar | Hoy simplificado | Mantener; agregar continuidad ("en qué quedé") en etapa 4 |
| Tareas y proyectos | Lectura Notion; creación vía Safe Writes | Impl. (lectura) / Flag (escritura) | Notion | Sí, sin crear | **Captura de tarea** (etapa 3–4) |
| Hábitos | Escritura controlada del día en Sheets | Impl. | Sheets | Sí | Mantener |
| Agenda | Lectura Calendar; *holds* como propuestas | Impl. / Flag | Calendar | Sí | Mantener; explicar propuestas |
| Áreas / Norte | Vistas derivadas por área | Impl. | Notion | Parcial (4 áreas) | Mantener la idea de áreas |
| Logros | Lectura privada Notion | Draft | Notion | No | Excluir (personal) |
| Journaling | Excluido de lector/búsqueda | Impl. (privado) | Notion | No | Excluir (privado) |
| Salud | Sueño, corazón, actividad; scores explicables; Rhythm Stability (calculadora pura, no cableada a UI) | Impl. / Draft | Sheets (vía Health Sync) | Básico | Etapa 4: scores con contribuyentes y cobertura; explicar pipeline Huawei |
| Gimnasio | Sesiones/series/cardio desde Sheets; comparaciones e1RM (Epley, 1–15 reps, ±2 % estable); MET-min cardio con confianza; benchmark fijo versionado; Rutina V4 visual | Impl. | Sheets + Notion (rutina) | Básico | **Etapa 3: registro de series, e1RM, comparación, historial, volumen** |
| Nutrición | Hoy / Tendencias 7-28-90D / Nutrientes / Plan; cobertura completa vs parcial ("desconocido nunca es cero"); objetivos como rango | Impl. | Sheets (Nutrition Intelligence) + Notion | Básico | **Etapa 3: catálogo ficticio, porciones, cobertura, rango, tendencias** |
| Estudio | Motor FSRS (`ts-fsrs`), ítems tipados, intentos offline en IndexedDB con outbox idempotente | Impl. | Postgres/PAS | Mazos manuales | Etapa 4: calificación Again/Hard/Good/Easy con intervalo determinista simplificado (no FSRS real) |
| Inglés | Panel read-only del English Speaking Lab (proyección sanitizada) | Impl. | PAS | Quiz | Etapa 4: competencias + historial ficticio |
| Finanzas | Movimientos, análisis, importadores Mercado Pago / Naranja X, conciliación, Safe-to-Spend, escenarios de compra, resiliencia | Impl. / Flag (escrituras) | Postgres cifrado / Sheets | Presupuesto | Etapa 4: **registrar gasto**, movimientos, Safe-to-Spend y simulador de compra |
| Compras / hogar | Lista personal; **motor de reposición** con cadencia robusta (mediana ponderada, MAD), confianza HIGH/MEDIUM/LOW, estados NOT_DUE/WATCH/ADD_TO_LIST/OVERDUE, correcciones del usuario; offline | Impl. / Flag | Sheets | Lista simple | Etapa 4: reposición predictiva con historial ficticio |
| Media | Películas/series, temporadas, notas, *rewatch*, notas externas (MDBList), ruta cinéfila, afinidades | Impl. | Sheets | 4 películas | Etapa 4: series + en progreso + historial; **excluir** afinidad personal y notas externas reales |
| World / Inteligencia / Professional | Superficies editoriales publicadas por PAS con procedencia; feedback explícito; radar tecnológico | Impl. | PAS + Postgres | No | Etapa 5: "Centro de información" con piezas de ejemplo **marcadas como ficticias** + explicación de procedencia |
| Automatizaciones | Runtime n8n con HMAC, idempotencia, cifrado | Flag | Redis cifrado | No | Etapa 5: historial de ejecuciones simulado y explicado |
| OpenClaw / captura | API HMAC, propuestas `pending`; captura conversacional Bandeja | Flag | Notion | No | **Etapa 3: captura "Contalo como lo dirías" con parser local explícito** |
| Búsqueda / Registro Web | Catálogo editorial Notion, búsqueda autorizada | Flag | Notion | Selector "Ir a" | Mantener simple |

## 3. Criterios de producto

1. Simple al entrar, profundo al explorar: Hoy breve; pestañas internas por módulo para Progreso/Historial/Tendencias.
2. Cada módulo demuestra un cálculo o una relación real (no tarjetas decorativas).
3. Toda acción actualiza las vistas derivadas y puede deshacerse; "Reiniciar demo" vuelve al estado inicial.
4. Honestidad: datos ficticios señalados; el intérprete conversacional se presenta como **parser local por reglas**, nunca como IA.
5. Sin red, sin cuentas, sin almacenamiento: estado en memoria (contrato de privacidad vigente).

## 4. Decisión arquitectónica (etapa 2)

**Opción elegida: C — evolucionar la app actual hacia un núcleo de estado con acciones puras, sin dependencias de runtime.**

- La demo es un sitio estático con CSP estricta (`script-src 'self'`, `style-src 'self'`, `connect-src 'none'`), 0 dependencias y carga instantánea; React+TS agregaría build, bundle y una migración completa de 12 vistas y 26 tests sin aportar capacidades visibles en esta etapa.
- El crecimiento real (formularios, deshacer, dominios con cálculos) se resuelve con: `src/store.js` (reducer puro + historial de deshacer), `src/domain/*` (cálculos puros testeables, espejo del patrón `*-core.ts` del original), `src/views/*` (plantillas sin DOM) y `app.js` como único adaptador al navegador.
- Revisable: si la demo supera ~20 vistas con estado local complejo, migrar a TypeScript (primero JSDoc + `tsc --checkJs`, luego TSX) es el siguiente paso natural.

**Persistencia:** se mantiene en memoria. Alternativa evaluada: `sessionStorage` para sobrevivir a recargas; requiere cambiar el contrato público ("nada se guarda") y la prueba que lo garantiza → queda como propuesta para aprobación.

## 5. Etapas

| Etapa | Contenido | Estado |
| --- | --- | --- |
| 1 | Sincronización Git, investigación, este documento | ✅ |
| 2 | Store con deshacer, dominios puros, datos sintéticos con historia | ✅ (ver §6) |
| 3 | Flujo vertical: Gimnasio + Nutrición + captura global (formulario y conversacional) | ✅ (ver §6) |
| 4 | Ampliación: Finanzas (gasto, Safe-to-Spend), Compras (reposición), Estudio (calificación), Salud (scores), Media (series) | Pendiente |
| 5 | "Cómo funciona Vida 2.0": arquitectura real vs demo | ✅ primera versión |
| 6 | QA integral y Preview | ✅ para esta etapa |

## 6. Registro de avance

### Checkpoint 1 — 2026-11-20 · captura + flujo vertical + arquitectura explicada

**Arquitectura**
- `src/domain/gym.js`, `nutrition.js`, `capture.js`, `actions.js`: lógica pura, sin DOM ni red.
- `src/views/*`: plantillas puras (gym, nutrition, capture, system, ui). `esc()` escapa todo texto ingresado.
- `src/data/synthetic.js`: 12 sesiones de gimnasio con progresión, catálogo de 16 alimentos, 12 días de nutrición.
- `app.js`: único adaptador al navegador. Historial de 40 pasos para «Deshacer», toast con acción, `<dialog>` nativo con retorno de foco.

**Funciona**
- Gimnasio: marcar series planificadas, agregar series con carga real, editar, eliminar, deshacer. e1RM por serie, comparación contra la sesión comparable anterior (±2 % estable), récords, volumen y series por grupo muscular. Pestañas Progreso (curva e1RM) e Historial.
- Nutrición: agregar alimentos del catálogo por porción o gramos, quitar, deshacer. Energía contra rango 2.000–2.300 kcal, macros + fibra con cobertura «conocidos/parcial». Tendencias de 14 días que promedian solo días completos. Catálogo.
- Registrar (global): «Contalo como lo dirías» con intérprete local por reglas (series, alimentos, gastos, tareas), vista previa editable, datos faltantes que bloquean la confirmación y fragmentos no interpretados visibles. Formulario alternativo.
- Finanzas: un gasto actualiza disponible, categoría, ritmo, el mes en curso y la lista de movimientos.
- Cómo funciona: flujo real vs. demo, fuentes canónicas, pipeline Huawei → Health Sync, capacidades por estado, detalles de ingeniería y enlaces a ambos repositorios.

**Pruebas:** 42 (`npm test`): 16 originales (3 aserciones de texto actualizadas en la etapa anterior, una aserción de `aria-pressed` precisada ahora), 10 de la etapa «Claridad», 6 de flujos de esta etapa y 10 de dominio.

### Checkpoint 2 — 2026-11-20 · etapa 4: profundidad por módulo

Investigado en el original antes de implementar: `lib/finance/safe-to-spend.ts` y docs de Fase 5, `lib/household-replenishment/engine.ts`, `lib/health/scores.ts`, `docs/gym-v2-source.md` (MET-min), `lib/study-engine/scheduler.ts` (FSRS), `lib/media/*`, `lib/world/feedback.ts`, `lib/professional/*`, `lib/automations/*`.

| Módulo | Qué se agregó | Fidelidad al original |
| --- | --- | --- |
| Finanzas | Capacidad (Safe-to-Spend con desglose), simulador de compra, movimientos con vista económica (transferencias excluidas), resiliencia (participación del ingreso laboral y volatilidad con 3+ meses). Un gasto registrado reduce la liquidez. | Misma fórmula `safe-to-spend-v1.0.0`; el simulador no recomienda. |
| Compras | Pestaña Reposición: cadencia por producto, confianza, estados, atípicos descartados, correcciones («todavía tengo», «queda poco», «se acabó»), «lo compré hoy», agregar a la lista. Tachar un sugerido registra la compra (y destildarlo la revierte). | Port del motor real (mediana ponderada, MAD, umbrales y factores de corrección). |
| Salud | Resumen con Disposición, scores de Sueño/Actividad/Estabilidad cardio con contribuyentes, peso, confianza y cobertura; contexto vivo de Gimnasio, Cardio y Nutrición; Cobertura de 28 días; Tendencias. | Estructura, pesos, bandas y regla de cobertura ≥ 50 % del original; curvas simplificadas y versionadas (`demo-health-scores-v1`). |
| Gimnasio | Pestaña Cardio: MET-min semanal contra 2.980 del plan, cumplimiento directo (pasos/bici/fútbol), MET y confianza por evidencia (W > RPE > rol), equivalencias restantes y registro de sesiones. | Mismo objetivo derivado y proxies del documento del original. |
| Estudio | Calificación Otra vez/Difícil/Bien/Fácil con vista previa del intervalo, respuestas escritas evaluadas de forma determinista, estadísticas por mazo y próximos repasos. | Rotulado como simplificación; el original usa FSRS (`ts-fsrs`). |
| Películas | Series con temporadas, progreso por episodio, calificación por temporada, filtros y resumen (episodios, horas, promedio, géneros). | Afinidades personales y notas externas excluidas. |
| Centro de información (nuevo) | Lecturas explicativas de ejemplo con procedencia y los 6 valores canónicos de feedback; radar tecnológico (Adoptado / Evaluar ahora / Observar / En pausa); 5 automatizaciones del original con kill switch y ejecuciones simuladas. | Piezas atemporales marcadas como ejemplo, sin titulares de actualidad. |
| Registrar | El intérprete reconoce cardio («45 minutos de bici con esfuerzo 6») y compras del hogar («compré leche y café por 9.800» → 2 compras + 1 gasto). | — |

**Pruebas:** 56 (`npm test`).

**Pendiente (siguiente etapa)**
- Inglés: competencias (speaking/listening) e historial, como el English Speaking Lab.
- Organizar: objetivos, logros y revisión semanal; continuidad «En qué quedé».
- Nutrición: micronutrientes con cobertura y ventanas 7D/28D/90D.
- Gimnasio: benchmark de fuerza versionado y rutina alternativa (V4) como propuesta visual.
- Finanzas: importación de un extracto de ejemplo (preflight + conciliación) para mostrar el pipeline de importadores.
- Evaluar TypeScript con `checkJs` y una prueba end-to-end en navegador real dentro de `npm test`.

**Pendiente original de la etapa 4 (resuelto en el checkpoint 2)**
- Finanzas: Safe-to-Spend y simulador de compra (fórmula `safe-to-spend-v1.0.0`).
- Compras: reposición predictiva por cadencia, con confianza y correcciones.
- Estudio: calificación Again/Hard/Good/Easy con intervalos deterministas, rotulados como simplificación de FSRS.
- Salud: scores explicables con contribuyentes, confianza y cobertura; historial más largo.
- Gimnasio: cardio en MET-min con nivel de confianza.
- Media: series, «en progreso», historial.
- Centro de información (World/Intelligence) con piezas marcadas como ejemplo y procedencia.
- Evaluar TypeScript con `checkJs`.
