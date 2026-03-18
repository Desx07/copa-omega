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
