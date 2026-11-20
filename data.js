/**
 * Persona, proyectos y eventos completamente inventados para un showcase público.
 * Ningún dato se importa desde los mocks personales ni desde las integraciones de Vida 2.0.
 */
export const initialData = Object.freeze({
  persona: 'Alex',
  dateLabel: 'MARTES, 17 DE NOVIEMBRE DE 2026',
  focus: 'Preparar la presentación de un producto digital',
  /** Escenario fijo de la demo: no se usa el reloj del dispositivo. */
  demoClock: { time: '10:12', dayOfMonth: 17, daysInMonth: 30 },
  habits: [
    { id: 'lectura', label: 'Leer 20 minutos', detail: 'Aprendizaje', done: true, color: 'violet' },
    { id: 'movimiento', label: 'Salir a caminar', detail: 'Bienestar', done: true, color: 'green' },
    { id: 'planificacion', label: 'Planificar el día', detail: 'Organización', done: false, color: 'amber' },
    { id: 'desconexion', label: 'Descanso sin pantallas', detail: 'Bienestar', done: false, color: 'blue' },
  ],
  tasks: [
    { id: 'flujo', label: 'Revisar el flujo de navegación', project: 'Producto Aurora', category: 'Diseño', priority: 'Alta', done: false },
    { id: 'presentacion', label: 'Preparar las diapositivas de la demo', project: 'Producto Aurora', category: 'Producto', priority: 'Alta', done: false },
    { id: 'documentar', label: 'Documentar los componentes nuevos', project: 'Sitio Boreal', category: 'Desarrollo', priority: 'Media', done: true },
    { id: 'practicar', label: 'Practicar conceptos de TypeScript', project: 'Ruta de aprendizaje', category: 'Aprendizaje', priority: 'Media', done: false },
  ],
  projects: [
    { id: 'aurora', name: 'Producto Aurora', category: 'Trabajo', status: 'En curso', progress: 72, color: 'violet', description: 'Una experiencia digital para organizar entregas de un equipo pequeño.', next: 'Preparar la demostración', deadline: '20 NOV', completed: 18, total: 25 },
    { id: 'boreal', name: 'Sitio Boreal', category: 'Personal', status: 'En curso', progress: 45, color: 'blue', description: 'Un sitio editorial para explorar nuevas ideas de interacción.', next: 'Revisar la versión para celular', deadline: '28 NOV', completed: 9, total: 20 },
    { id: 'aprendizaje', name: 'Ruta de aprendizaje', category: 'Formación', status: 'En pausa', progress: 60, color: 'amber', description: 'Un plan de estudio progresivo para reforzar fundamentos técnicos.', next: 'Retomar el módulo de TypeScript', deadline: 'SIN FECHA', completed: 12, total: 20 },
  ],
  agenda: [
    { day: 0, id: 'plan', time: '08:30', end: '09:00', title: 'Planificación del día', category: 'Personal', color: 'green', description: 'Revisar prioridades y elegir el foco principal.' },
    { day: 0, id: 'deep', time: '09:30', end: '11:30', title: 'Bloque de trabajo enfocado', category: 'Trabajo', color: 'violet', description: 'Avanzar en las pantallas de Producto Aurora.' },
    { day: 0, id: 'review', time: '14:00', end: '14:45', title: 'Revisión de producto', category: 'Equipo', color: 'blue', description: 'Compartir avances y resolver preguntas del equipo.' },
    { day: 0, id: 'walk', time: '18:00', end: '18:40', title: 'Pausa activa', category: 'Bienestar', color: 'green', description: 'Caminar y desconectar después del trabajo.' },
    { day: 1, id: 'daily', time: '09:00', end: '09:20', title: 'Plan de prioridades', category: 'Personal', color: 'green', description: 'Preparar el miércoles.' },
    { day: 1, id: 'prototype', time: '10:30', end: '12:00', title: 'Prototipar nueva pantalla', category: 'Trabajo', color: 'violet', description: 'Explorar una alternativa de navegación.' },
    { day: 1, id: 'course', time: '16:00', end: '17:30', title: 'Curso de TypeScript', category: 'Formación', color: 'amber', description: 'Practicar tipos y composición.' },
    { day: 2, id: 'build', time: '09:00', end: '11:00', title: 'Desarrollo del sitio Boreal', category: 'Personal', color: 'blue', description: 'Mejorar el diseño adaptable.' },
    { day: 2, id: 'demo', time: '15:00', end: '15:45', title: 'Ensayo de presentación', category: 'Trabajo', color: 'violet', description: 'Practicar la demostración del producto.' },
  ],
  health: {
    sleepHours: 7.6,
    steps: 8240,
    restingPulse: 64,
    activeMinutes: 42,
    sleepTrend: [6.8, 7.1, 7.3, 6.9, 7.8, 7.5, 7.6],
    stepsTrend: [6800, 7900, 7200, 9300, 8300, 6400, 8240],
    activityTrend: [24, 38, 46, 31, 52, 20, 42],
    trendLabels: ['Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Lun', 'Hoy'],
  },
  gym: {
    completed: false,
    sessionsThisWeek: 2,
    goal: 3,
    exercises: [
      { id: 'press', name: 'Press de pecho', muscle: 'Pecho', sets: '3 × 10', weight: '35 kg' },
      { id: 'row', name: 'Remo sentado', muscle: 'Espalda', sets: '3 × 12', weight: '30 kg' },
      { id: 'squat', name: 'Sentadilla goblet', muscle: 'Piernas', sets: '3 × 10', weight: '16 kg' },
      { id: 'plank', name: 'Plancha', muscle: 'Core', sets: '3 × 30 s', weight: 'Peso corporal' },
    ],
    volume: [42, 52, 49, 56, 61, 64],
  },
  nutrition: {
    targetCalories: 2200,
    days: [
      { label: 'Martes 17', meals: [
        { id: 'breakfast', time: '08:15', title: 'Tostadas, fruta y yogur', type: 'Desayuno', calories: 460, protein: 21, carbs: 62, fats: 14 },
        { id: 'lunch', time: '13:20', title: 'Bowl de arroz y verduras', type: 'Almuerzo', calories: 680, protein: 35, carbs: 83, fats: 20 },
        { id: 'snack', time: '17:10', title: 'Frutos secos y una manzana', type: 'Merienda', calories: 280, protein: 9, carbs: 31, fats: 14 },
        { id: 'dinner', time: '21:00', title: 'Pasta con salsa de tomate', type: 'Cena', calories: 590, protein: 28, carbs: 76, fats: 18 },
      ] },
      { label: 'Miércoles 18', meals: [
        { id: 'w-breakfast', time: '08:00', title: 'Avena, banana y semillas', type: 'Desayuno', calories: 480, protein: 19, carbs: 70, fats: 14 },
        { id: 'w-lunch', time: '13:00', title: 'Wrap de pollo y vegetales', type: 'Almuerzo', calories: 630, protein: 38, carbs: 60, fats: 22 },
      ] },
    ],
  },
  decks: [
    { id: 'web', title: 'Desarrollo web', topic: 'Tecnología', color: 'violet', cards: [
      { front: '¿Qué es el DOM?', back: 'Es la representación estructurada del documento que permite a JavaScript leer y modificar la página.' },
      { front: '¿Qué significa una función pura?', back: 'Produce el mismo resultado con las mismas entradas y no genera efectos secundarios observables.' },
      { front: '¿Para qué sirve un test de integración?', back: 'Para comprobar que varios componentes colaboran correctamente en un escenario concreto.' },
    ] },
    { id: 'english', title: 'Inglés cotidiano', topic: 'Idiomas', color: 'blue', cards: [
      { front: 'What does “figure out” mean?', back: 'Significa resolver o comprender algo después de pensarlo.' },
      { front: 'How do you say “lo antes posible”?', back: 'As soon as possible.' },
      { front: 'What is the past tense of “seek”?', back: 'Sought.' },
    ] },
    { id: 'finance', title: 'Finanzas personales', topic: 'Vida diaria', color: 'amber', cards: [
      { front: '¿Qué es un gasto fijo?', back: 'Un gasto recurrente cuya frecuencia o importe suele ser previsible.' },
      { front: '¿Qué significa diversificar?', back: 'Distribuir recursos entre distintas opciones para no depender de una sola.' },
      { front: '¿Para qué sirve un presupuesto?', back: 'Para planificar cómo se distribuyen los ingresos entre necesidades, objetivos y gastos.' },
    ] },
  ],
  english: {
    streak: 8,
    unit: 'Present perfect y expresiones de tiempo',
    questions: [
      { prompt: 'She has lived in London ___ 2022.', choices: ['for', 'since', 'during'], correct: 'since', note: '“Since” marca el punto en el tiempo desde el que sucede algo.' },
      { prompt: 'I am looking forward ___ you.', choices: ['to meeting', 'meet', 'to meet'], correct: 'to meeting', note: 'Después de “look forward to” usamos un sustantivo o la forma -ing.' },
      { prompt: 'We have worked together ___ three months.', choices: ['since', 'for', 'from'], correct: 'for', note: '“For” expresa una duración.' },
    ],
  },
  finances: {
    currency: 'ARS',
    monthlyIncome: 1500000,
    categories: [
      { id: 'home', name: 'Hogar', budget: 500000, spent: 385000, color: 'violet' },
      { id: 'food', name: 'Alimentación', budget: 330000, spent: 214000, color: 'green' },
      { id: 'transport', name: 'Transporte', budget: 180000, spent: 92000, color: 'blue' },
      { id: 'leisure', name: 'Tiempo libre', budget: 170000, spent: 127000, color: 'amber' },
      { id: 'other', name: 'Otros', budget: 170000, spent: 68000, color: 'violet' },
    ],
    months: [780, 810, 760, 930, 845, 886],
    monthLabels: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'],
  },
  shopping: [
    { id: 'apples', name: 'Manzanas', category: 'Verdulería', amount: '1 kg', checked: false },
    { id: 'spinach', name: 'Espinaca', category: 'Verdulería', amount: '1 atado', checked: false },
    { id: 'bread', name: 'Pan integral', category: 'Panadería', amount: '1 paquete', checked: true },
    { id: 'eggs', name: 'Huevos', category: 'Almacén', amount: '12 unidades', checked: false },
    { id: 'yogurt', name: 'Yogur natural', category: 'Lácteos', amount: '2 unidades', checked: false },
    { id: 'rice', name: 'Arroz', category: 'Almacén', amount: '1 paquete', checked: true },
  ],
  movies: [
    { id: 'atlas', title: 'El mapa de las estrellas', genre: 'Ciencia ficción', year: 2024, color: 'violet', watched: false, rating: null, symbol: '✧' },
    { id: 'horizon', title: 'Horizonte azul', genre: 'Drama', year: 2022, color: 'blue', watched: true, rating: 4, symbol: '◌' },
    { id: 'seasons', title: 'Las cuatro estaciones', genre: 'Aventura', year: 2025, color: 'green', watched: false, rating: null, symbol: '❋' },
    { id: 'lastlight', title: 'La última luz', genre: 'Suspenso', year: 2023, color: 'amber', watched: true, rating: 5, symbol: '☼' },
  ],
});
