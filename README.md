# Vida 2.0 — Demo pública independiente

Demo estática e independiente para visitantes del portfolio de Francisco Vitar. Este repositorio contiene **solo el showcase público**, separado del código y los datos de la aplicación original.

**No es la aplicación personal en producción.** Es una experiencia de producto navegable y aislada, inspirada en Vida 2.0, con una persona y datos completamente ficticios. Su objetivo es que cualquier visitante entienda el concepto en pocos segundos. Es un *showcase interactivo de interfaz*, no una prueba de las integraciones privadas en vivo.

## Propuesta de producto

**«Todo lo que importa. En un mismo lugar.»** Una app para conectar organización, bienestar, aprendizaje y vida cotidiana con una primera vista sencilla. No se promociona como un sistema técnico destinado solo al creador.

| Área | Vistas de la demo | Lo que puede probar el visitante |
| --- | --- | --- |
| Organización | Mi día, Proyectos, Agenda | Completar tareas y hábitos; filtrar proyectos; cambiar días y ver eventos |
| Bienestar | Salud, Gimnasio, Nutrición | Comparar indicadores ficticios; completar una sesión; cambiar diario de comidas |
| Aprendizaje | Mazos de estudio, Inglés | Elegir un mazo, revelar tarjetas; contestar preguntas con feedback |
| Vida cotidiana | Finanzas, Compras, Películas | Explorar presupuestos ficticios; marcar productos; filtrar y marcar películas |

La demo **no implementa** la categoría World ni el área Profesional. En la home se menciona que la aplicación original incluye seguimiento de herramientas, tecnologías y actualidad, sin mostrar noticias o sincronizaciones en vivo. Los mazos son un ejemplo de repaso manual, no una integración con Anki ni un planificador de repetición espaciada.

Las acciones se pierden al recargar o presionar **Reiniciar demo**. Las gráficas, importes en ARS, métricas de salud, calorías, ejercicios, puntuaciones y supuestas rachas son ilustrativos. El contenido de nutrición, gimnasio, salud y finanzas no es asesoramiento profesional. Los nombres de películas y sus carteles gráficos son inventados.

El enfoque visual para la siguiente iteración con Claude Design está en [DESIGN_BRIEF_CLAUDE.md](./DESIGN_BRIEF_CLAUDE.md).

## Límite de seguridad

- Este directorio **no importa módulos del resto del repositorio**.
- No tiene dependencias instalables de `npm`, backend, autenticación, variables de entorno, APIs ni almacenamiento persistente (`npm test` usa el ejecutor de Node).
- Todas las acciones funcionan con estado en memoria; refrescar vuelve a los datos iniciales.
- Ninguna URL de Google Sheets, Notion o Google Calendar forma parte de la demo.
- Una política CSP explícita fija `connect-src 'none'` para impedir conexiones desde el navegador cuando se sirve mediante la configuración de Vercel incluida.
- Los datos originales de `lib/mock-data` **no se usan**: incluso esos mocks se refieren a ámbitos personales reales.

## Ejecutar en local

Desde este directorio:

```bash
python -m http.server 4173
```

Abrir `http://localhost:4173`. No abrir `index.html` mediante `file://`, porque utiliza módulos ES.

Pruebas (Node.js 22 o superior, sin instalar dependencias):

```bash
npm test
```

## Publicación en Vercel

Crear un **proyecto Vercel nuevo** a partir de `franciscovitar/vida-2-0-demo`, con **Root Directory = `./`** y sin variables de entorno. No reutilizar el proyecto Vercel de Vida 2.0 personal, sus credenciales, su alias de QA ni su dominio de producción. Verificar build, cabeceras y acceso público en navegador anónimo.

También puede hospedarse en cualquier hosting estático que permita agregar las cabeceras de seguridad definidas en `vercel.json`.

## QA requerida antes de compartirla

1. Validar la navegación y las acciones de estado en los once paneles, incluyendo reinicio y selector de módulo en mobile.
2. Abrir sin iniciar sesión en desktop y mobile; no debe existir scroll horizontal.
3. Comprobar que no haya solicitudes de red más allá de `index.html`, `styles.css`, `app.js`, `modules.js`, `data.js` y recursos de la plataforma.
4. Verificar el encabezado CSP en la respuesta desplegada.
5. Confirmar que no aparezcan datos personales ni referencias a sistemas externos.
6. Enlazar el código original de Vida 2.0 **separadamente**, sin afirmar que esta demo prueba las integraciones privadas.

Esta demo **no se activa desde la aplicación real** y no sincroniza ningún contenido con ella. Modificar este repositorio no modifica Vida 2.0 personal.
