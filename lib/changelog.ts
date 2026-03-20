export interface ChangelogEntry {
  version: string;
  name: string;
  date: string; // YYYY-MM-DD
  categories: {
    label: "Nuevo" | "Mejorado" | "Arreglado";
    icon: string; // lucide icon name
    color: string; // tailwind color class
    items: string[];
  }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  // NEWEST FIRST
  {
    version: "1.5",
    name: "Arena Mejorada",
    date: "2026-03-19",
    categories: [
      {
        label: "Nuevo",
        icon: "Sparkles",
        color: "text-omega-gold",
        items: [
          "Bladers online: ve quién está conectado en el dashboard con avatares",
          "Contador de batallas por fecha en el ranking (actividad diaria)",
          "Batallas agrupadas por fecha en tu historial personal",
          "67 Blades en la Xciclopedia (antes eran 31) con tiers actualizados al meta 2026",
          "MeteorDragoon, ScorpioSpear, ClockMirage y 30+ blades nuevos agregados",
        ],
      },
      {
        label: "Mejorado",
        icon: "TrendingUp",
        color: "text-omega-blue",
        items: [
          "Retos reorganizados en 3 secciones: Pendientes, Aceptados, Completados",
          "Buscador de retos por nombre de blader",
          "Ranking muestra todas las batallas recientes (antes solo 10)",
          "Timestamps relativos en ranking: 'hace 5m', 'hace 2h'",
          "Admin puede eliminar retos y editar resultados de partidas",
          "Admin no aparece como objetivo de retos",
          "Input de estrellas ya no muestra el 0 molesto",
        ],
      },
      {
        label: "Arreglado",
        icon: "Wrench",
        color: "text-omega-green",
        items: [
          "Ranking no se actualizaba (página cacheada en Vercel)",
          "No se pueden enviar retos duplicados al mismo blader",
          "Retos ya no expiran (las notificaciones push no llegaban)",
          "Resolver partidas ya no se traba (botón girando infinito)",
          "Hora argentina en contadores de fecha (antes usaba UTC)",
          "593 correcciones de acentos y ortografía en la Xciclopedia",
        ],
      },
    ],
  },
  {
    version: "1.4",
    name: "Xciclopedia Completa",
    date: "2026-03-19",
    categories: [
      {
        label: "Nuevo",
        icon: "Sparkles",
        color: "text-omega-gold",
        items: [
          "Xciclopedia rediseñada: búsqueda instantánea, filtros por tier (S/A/B/C) y cards expandibles",
          "Catálogo visual completo de todas las piezas (Blades BX/UX/CX, Ratchets, Bits)",
          "Guía para principiantes con 8 secciones detalladas basadas en la Xciclopedia oficial",
          "Bladers online: ve quién está conectado en el dashboard con avatares clickeables",
          "Cada Blade, Ratchet y Bit tiene descripción detallada con combos recomendados y por qué funcionan",
        ],
      },
      {
        label: "Mejorado",
        icon: "TrendingUp",
        color: "text-omega-blue",
        items: [
          "Tab sticky en la Xciclopedia (no se pierde al scrollear)",
          "Secciones por tier con corona dorada para S-Tier",
          "Bits organizados por categoría con navegación rápida (ATK/STA/DEF/BAL)",
          "Guía 'Empezá Acá' como primer tab para nuevos jugadores",
          "Imágenes de catálogo en collapsible (no bloquean el contenido)",
        ],
      },
    ],
  },
  {
    version: "1.3",
    name: "Conocimiento Omega",
    date: "2026-03-19",
    categories: [
      {
        label: "Nuevo",
        icon: "Sparkles",
        color: "text-omega-gold",
        items: [
          "Xciclopedia: guía completa de Beyblade X con fichas de 30+ Blades, 13 Ratchets y 48 Bits",
          "Cada pieza tiene tier (S/A/B/C), descripción y combos recomendados",
          "Guía para principiantes: física del giro, balance perfecto, armado de combos y más",
          "BeyBot potenciado: ahora sabe TODO sobre cada pieza del sistema X",
          "Sistema de actualizaciones: banner de novedades + página /updates con historial de versiones",
        ],
      },
      {
        label: "Mejorado",
        icon: "TrendingUp",
        color: "text-omega-blue",
        items: [
          "Predicciones separadas por Torneos y Retos, sin duplicados",
          "Puntos de torneo calculados desde resultados reales",
          "Títulos dinámicos ahora incluyen batallas de torneo",
          "Misiones completadas se colapsan, historial de batallas cerrado por defecto",
          "Scanner QR con estados de carga y mensajes de error claros",
          "Badge Verdugo Supremo cuenta todas las fases del torneo",
        ],
      },
      {
        label: "Arreglado",
        icon: "Wrench",
        color: "text-omega-green",
        items: [
          "Predicciones en retos ahora se resuelven al completar la partida",
          "XP y stock usan operaciones atómicas (sin pérdida de datos)",
          "12 badges nuevos que no se podían desbloquear (faltaban en la base de datos)",
          "Badge Coleccionista se activa al agregar un bey",
          "Reacciones del feed ya no tiran error la primera vez",
          "Byes en torneos suizos dan 3 puntos consistentemente",
          "Error boundaries para toda la app (pantalla amigable en vez de crash)",
        ],
      },
    ],
  },
  {
    version: "1.2",
    name: "Estabilidad Omega",
    date: "2026-03-17",
    categories: [
      {
        label: "Mejorado",
        icon: "TrendingUp",
        color: "text-omega-blue",
        items: [
          "Las predicciones ahora separan Torneos y Retos con secciones claras. Ya no aparecen torneos terminados ni partidas duplicadas",
          "Los puntos de torneo ahora se calculan desde los resultados reales de cada partida",
          "Los titulos dinamicos ahora consideran batallas de torneo, no solo las regulares",
          "El formulario de agregar bey ahora tiene titulo, layout vertical y placeholder de ejemplo",
          "El historial de batallas en el dashboard viene cerrado por defecto",
          "Las misiones completadas se colapsan a una sola linea verde",
          "El scanner QR ahora muestra estado de carga y mensajes de error claros",
          "La pagina de torneos carga mas rapido",
        ],
      },
      {
        label: "Arreglado",
        icon: "Wrench",
        color: "text-omega-green",
        items: [
          "Las predicciones en retos ahora se resuelven correctamente cuando termina la partida",
          "El badge Verdugo Supremo ahora cuenta victorias de todas las fases del torneo",
          "Los byes en torneos suizos ahora dan 3 puntos consistentemente",
          "Solo la final del torneo activa el cierre automatico, no la partida de 3er puesto",
          "Las reacciones en el feed ya no tiran error la primera vez",
          "La mision Comenta una batalla ahora lleva a Retos y cuenta correctamente",
        ],
      },
    ],
  },
  {
    version: "1.1",
    name: "Arsenal Competitivo",
    date: "2026-03-16",
    categories: [
      {
        label: "Nuevo",
        icon: "Sparkles",
        color: "text-omega-gold",
        items: [
          "Sistema de XP y niveles: gana experiencia por cada accion. Tu nivel sube pero nunca baja",
          "Misiones semanales: 4 misiones que rotan cada lunes. Completalas todas para demostrar actividad",
          "Modo Hype: cuando hay un torneo en vivo, el dashboard se transforma con banner pulsante",
          "Revancha instantanea: perdiste? Toca un boton para desafiar al mismo rival",
          "Temporadas: el admin puede iniciar temporadas que resetean el ranking",
          "Eventos especiales: desafios globales con cuenta regresiva en el dashboard",
          "Comentarios en retos: escribi trash talk en los desafios de otros bladers",
          "Notificaciones push: te avisan cuando te retan, aceptan tu reto, o ganas un torneo",
          "12 badges nuevos: Phoenix, Gladiador, Verdugo Supremo, Oraculo, Rey Social y mas (23 total)",
          "Registro de estrellas: historial completo de cada estrella ganada o perdida",
          "Auto-seeding: los torneos se arman segun tu rendimiento",
          "Check-in pre-torneo: confirma asistencia antes de que arranque",
          "Partida de 3er puesto en eliminacion directa",
          "Onboarding: checklist de 5 pasos para nuevos bladers",
        ],
      },
    ],
  },
  {
    version: "1.0",
    name: "El Inicio",
    date: "2026-03-14",
    categories: [
      {
        label: "Nuevo",
        icon: "Sparkles",
        color: "text-omega-gold",
        items: [
          "Sistema de estrellas: empezas con 25, aposta de 1 a 5 por batalla",
          "Torneos: eliminacion directa, round robin y suizo con brackets en vivo",
          "Inscripcion por QR: escanea el codigo del torneo para anotarte",
          "Retos 1v1: desafia a cualquier blader apostando estrellas, expiran en 48hs",
          "Feed social: mira resultados de batallas y reacciona",
          "Combos: comparti tu blade/ratchet/bit y vota las de otros",
          "Predicciones: predeci quien gana y competi por mejor porcentaje",
          "Encuestas: crea votaciones para la comunidad",
          "Chat global en tiempo real con BeyBot (IA de Beyblade X)",
          "Tienda: compra productos con efectivo o transferencia",
          "Galeria de fotos y videos por torneo",
          "Modo espectador: pantalla completa para proyectar en torneos",
          "Perfil personalizable: avatar, tagline, color, emoji de badge",
          "Ranking general con podio animado",
          "Titulos dinamicos segun tus ultimas 10 batallas",
          "11 badges desbloqueables",
          "Panel admin completo",
        ],
      },
    ],
  },
];

export function getLatestVersion(): string {
  return CHANGELOG[0].version;
}
