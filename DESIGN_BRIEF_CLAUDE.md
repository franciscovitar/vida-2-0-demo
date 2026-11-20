# Vida 2.0 — Brief para Claude Design

## Objetivo

Refinar visualmente una **demo pública, comercial y premium** de Vida 2.0 para visitantes y recruiters. Debe sentirse como una app de organización personal que una persona ajena al proyecto querría usar, no como un tablero técnico hecho a medida para Francisco. El objetivo inmediato es que alguien entienda la propuesta en menos de 10 segundos, tenga ganas de explorar y descubra una demostración de diseño e implementación full-stack (sin simular que aquí existe un backend).

**Idea central:** «Todo lo que importa. En un mismo lugar».

**Límites innegociables**:

- Trabajar solo en el repositorio público `franciscovitar/vida-2-0-demo` (su raíz). La aplicación personal de Vida 2.0 y sus datos no se tocan, no se importan ni se leen.
- Solo datos sintéticos. No usar datos reales de salud, dinero, calendarios, hábitos o usuarios; no integrar servicios externos ni pedir credenciales.
- Esta demo es HTML/CSS/JavaScript estático con estado **en memoria**. Los controles funcionan, pero nada persiste. Debe quedar claro en el UI y README.
- Sin afirmar que tiene conectores, análisis clínico, recomendaciones, repetición espaciada real, IA generativa o pagos operativos.
- No usar fotografías identificables, logos ni capturas de productos de terceros sin permiso. Evitar copiar interfaces protegidas: tomar principios de UX, crear identidad propia.
- No desplegar a producción ni modificar el Vercel personal. Revisar en una Preview independiente antes de autorizar publicación.

## La pregunta que guía cada pantalla

«Si nunca escuché hablar de Vida 2.0, ¿puedo descubrir qué problema me resuelve sin una explicación del autor?»

La demo actual tiene 11 vistas, agrupadas por motivaciones humanas:

| Entrada | Pantallas | Primera historia para contar |
| --- | --- | --- |
| **Organizarme** | Mi día, Proyectos, Agenda, hábitos integrados en Mi día | «Sé qué es importante hoy y qué viene después» |
| **Cuidarme** | Salud, Gimnasio, Nutrición | «Puedo reconocer mis rutinas y entender mis tendencias» |
| **Aprender** | Mazos, Inglés | «Tengo ejercicios concretos de pocos minutos» |
| **Disfrutar y decidir** | Finanzas, Compras, Películas | «Tengo ordenadas mis decisiones cotidianas» |

La app original tiene además espacios relacionados con herramientas emergentes, tecnologías y noticias; **World y Profesional quedan fuera** de esta demo. Una pequeña mención honesta en Mi día puede comunicar curiosidad y aprendizaje continuo sin intentar mostrar un agregador de actualidad.

## Referencias de producto — investigar conceptos, no clonar

| Referencia | Patrón valioso | Aplicación deseada a Vida 2.0 |
| --- | --- | --- |
| [Todoist — Today](https://www.todoist.com/help/todoist/get-started/plan-your-day-with-the-today-view-UVUXaiSs) | La prioridad diaria antes de todo lo demás | Una portada con foco, tareas, hábitos y próximo compromiso |
| [Apple Health](https://support.apple.com/guide/iphone/intro-to-health-data-iphbb8259c61/ios) | Resumen visual, contexto y tendencias | Salud como vista de tendencias ficticias, no números clínicos sueltos |
| [Hevy](https://www.hevyapp.com/features/) | Rutinas concretas y progreso | Gimnasio con ejercicios entendibles y objetivo semanal visible |
| [MyFitnessPal](https://support.myfitnesspal.com/hc/en-us) | Diario de comidas y resumen de nutrientes | Nutrición con comidas por momento del día y macros legibles |
| [Anki](https://docs.ankiweb.net/getting-started.html) | Mazos y tarjetas de recuperación activa | Pregunta, revelar respuesta y avanzar; sin prometer algoritmo Anki |
| [Duolingo](https://blog.duolingo.com/) | Microlecciones y feedback inmediato | Una práctica de inglés breve, divertida y comprensible |
| [YNAB](https://support.ynab.com/en_us/getting-started-categories-in-ynab-rkWG3rp6x) | Categorías con importes claros | Presupuesto explicable, sin jergas financieras |
| [AnyList](https://www.anylist.com/) | Lista de compras rápida, por categorías | Check de productos en un toque |
| [Letterboxd](https://support.letterboxd.com/hc/en-us/articles/15178651705231-What-is-Letterboxd) | Biblioteca personal y estado de visionado | Películas por ver / vistas sin un catálogo online |

## Solicitud de diseño

1. **Primero, auditar** el layout implementado en `index.html`, `styles.css`, `app.js` y `modules.js` con la demo en ejecución. Documentar fallos de jerarquía, densidad, contraste, navegación y responsive.
2. Proponer **dos direcciones visuales** en artboards desktop (1440 px) y mobile (390 px) y una hoja de sistema. Recomendación inicial: «calma editorial + claridad de producto» frente a «app premium de hábitos»; sin efectos neón ni exceso de widgets.
3. Dar protagonismo a **Mi día**: título humano, 3–4 señales claras, una acción útil y tres puertas a explorar. El resto se descubre por interés, no como lista de 11 features en el hero.
4. Mostrar los módulos como un sistema familiar: tarjetas, controles, estados, iconografía, botones y componentes coherentes. Mejorar específicamente gráficos, calendario, mazos, nutrición y carteles de películas sin degradar a móvil.
5. Evitar sobrecarga: jerarquía fuerte, espacio en blanco, tipografía legible, color con significado, microinteracciones discretas; soporte `prefers-reduced-motion`, foco de teclado, tamaño de toque y contrastes AA.
6. Aplicar el criterio de un recruiter: en 20–40 segundos debería entender qué hizo Francisco, ver una experiencia navegable y encontrar el enlace al código. No esconder la aclaración «demo pública, datos sintéticos».
7. Dejar recomendaciones de copy y capturas exactas a usar luego en su portfolio editorial. **No** sugerir imágenes que puedan revelar su perfil personal.

## Entregables de Claude Design

- Artboards desktop y mobile de la dirección elegida, hoja de tokens/componentes, estados de interacción y un mini recorrido de 3 pantallas para recruiter.
- Checklist de diferencias entre diseño y código existente, ordenado por impacto.
- Si se aprueba implementación: cambios restringidos al repositorio público de la demo, tests actualizados, reporte de QA (desktop, tablet, mobile, teclado, consola, CSP), commit en feature branch y Preview separada. **Sin merge ni publicación a producción por defecto.**

## Lo que la demo actual ya permite hacer

- Marcar tareas, hábitos, sesión de gimnasio y compras; reiniciar todo.
- Filtrar proyectos y películas; cambiar días y eventos en agenda; comparar métricas sintéticas de bienestar.
- Alternar días de nutrición y detalles de comidas, elegir mazo, dar vuelta tarjetas y avanzar; contestar preguntas de inglés y recibir feedback; ver categorías de presupuesto.

**Esto no es un producto SaaS lanzado.** La meta es enseñar criterio de producto, UX, UI y una base aislada, comprensible y honesta que después pueda evolucionar.
