// =============================================================================
// XCICLOPEDIA — Base de conocimiento completa de Beyblade X
// Fuente: Reviews y fundamentos de Bladers Santa Fe (Marzo 2026)
// =============================================================================

export interface BladeEntry {
  name: string;
  weight: string;
  type: "attack" | "defense" | "stamina" | "balance";
  description: string;
  bestCombos: string[];
  tier: "S" | "A" | "B" | "C";
}

export interface RatchetEntry {
  number: string;
  description: string;
  bestHeight: string;
  tier: "S" | "A" | "B" | "C";
}

export interface BitEntry {
  name: string;
  category: "attack" | "defense" | "stamina" | "balance";
  weight: string;
  description: string;
  tier: "S" | "A" | "B" | "C";
}

// =============================================================================
// BLADES
// =============================================================================

export const BLADES: BladeEntry[] = [
  // --- S TIER ---
  {
    name: "WizardRod",
    weight: "35.2g",
    type: "balance",
    description:
      "El blade mas versatil de la generacion X. Gran defensa, stamina y capacidad ofensiva. Segunda mejor stamina del juego.",
    bestCombos: ["9-60 Ball", "3-60 Ball", "7-60 Hexa"],
    tier: "S",
  },
  {
    name: "PhoenixWing",
    weight: "32.9g",
    type: "attack",
    description:
      "Primer tanque de gen X. Peso alto, versatil en todas las alturas. Gran smash, upper y downforce. Excelente counter.",
    bestCombos: ["9-60 High Needle", "7-60 Ball", "5-60 Taper"],
    tier: "S",
  },
  {
    name: "CobaltDrake",
    weight: "38.1g",
    type: "defense",
    description:
      "El blade mas pesado del juego. Paredes que reflejan ataques con gran potencial de counter. Raro y caro.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "S",
  },
  {
    name: "SharkEdge",
    weight: "",
    type: "attack",
    description:
      "Bajo y estable, excelente para ataque consistente. Opuesto a WhaleWave en estilo. Tambien conocido como SharkScale.",
    bestCombos: ["4-55 Low Rush", "3-60 Rush", "1-60 Flat"],
    tier: "S",
  },
  {
    name: "CobaltDragoon",
    weight: "37.8g",
    type: "defense",
    description:
      "Primer blade left-spin. Muy pesado con gran potencial de counter. Mejor con Elevate para ecualizacion.",
    bestCombos: ["4-60 Elevate", "9-60 Elevate", "5-60 Point"],
    tier: "S",
  },

  // --- A TIER ---
  {
    name: "DranSword",
    weight: "35.4g",
    type: "attack",
    description:
      "El blade representativo de gen X. Muy versatil con buena stamina y recoil medio. Ideal para principiantes.",
    bestCombos: ["3-60 Rush", "5-60 Flat", "9-60 Ball"],
    tier: "A",
  },
  {
    name: "HellsScythe",
    weight: "32.9g",
    type: "balance",
    description:
      "Liviano pero gran stamina. Flexible entre agresion y defensa segun el lanzamiento.",
    bestCombos: ["9-60 Unite", "5-60 Point", "7-60 Ball"],
    tier: "A",
  },
  {
    name: "WhaleWave",
    weight: "",
    type: "attack",
    description:
      "Potencia brutal pero riesgoso. Pesado y caotico. Gran upper, smash y downforce.",
    bestCombos: ["5-60 Ball", "9-60 Taper", "7-60 Unite"],
    tier: "A",
  },
  {
    name: "TyrannoBeat",
    weight: "36.8g",
    type: "attack",
    description:
      "Naturalmente agresivo y pesado. Gran smash desde cualquier angulo. Mejor en alturas 60/70.",
    bestCombos: ["1-60 Flat", "3-60 Rush", "5-70 Flat"],
    tier: "A",
  },
  {
    name: "SamuraiSaber",
    weight: "",
    type: "defense",
    description:
      "Excelente counter contra Dragoon y left-spin. Muy versatil defensivamente.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "A",
  },
  {
    name: "SilverWolf",
    weight: "",
    type: "defense",
    description:
      "Buenas cualidades defensivas con potencial ofensivo latente. Blade CX con centro de gravedad alto.",
    bestCombos: ["9-60 Ball", "5-60 Point", "7-60 Unite"],
    tier: "A",
  },
  {
    name: "GolemRock",
    weight: "",
    type: "defense",
    description:
      "Compacto y pesado para su tamano. Estilo tanque puro.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "A",
  },

  // --- B TIER ---
  {
    name: "DranDagger",
    weight: "34.9g",
    type: "balance",
    description:
      "Compacto semi-agresivo que desgasta al oponente. Necesita lanzamientos fuertes.",
    bestCombos: ["5-60 Point", "3-60 Rush", "9-60 Unite"],
    tier: "B",
  },
  {
    name: "KnightShield",
    weight: "32.3g",
    type: "defense",
    description:
      "Forma de escudo, se beneficia del wobbling. Peso bajo lo hace fragil. Buen desgaste.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "B",
  },
  {
    name: "LeonClaw",
    weight: "31.6g",
    type: "attack",
    description:
      "Liviano con garras texturadas. Desestabiliza desde abajo. Necesita ratchets bajos.",
    bestCombos: ["1-60 Rush", "3-60 Flat", "4-55 Rush"],
    tier: "B",
  },
  {
    name: "ViperTail",
    weight: "",
    type: "balance",
    description:
      "Blade sutil de desgaste. Drena energia con contacto continuo. Efectivo sin ser vistoso.",
    bestCombos: ["5-60 Point", "9-60 Unite", "3-60 Taper"],
    tier: "B",
  },
  {
    name: "WeissTiger",
    weight: "",
    type: "balance",
    description:
      "Definicion de equilibrio. Sin debilidad mayor pero sin fortaleza dominante.",
    bestCombos: ["5-60 Unite", "9-60 Ball", "3-60 Taper"],
    tier: "B",
  },
  {
    name: "KnightLance",
    weight: "",
    type: "attack",
    description:
      "Tipo lanza agresiva. Alto recoil, arma de doble filo literal.",
    bestCombos: ["3-60 Rush", "1-60 Flat", "5-60 Rush"],
    tier: "B",
  },
  {
    name: "KnightMail",
    weight: "",
    type: "defense",
    description:
      "Blade CX con centro de gravedad elevado. Buen upper y smash desde arriba. Necesita movimiento.",
    bestCombos: ["5-60 Point", "9-60 Ball", "7-60 Taper"],
    tier: "B",
  },
  {
    name: "PhoenixFeather",
    weight: "32.9g",
    type: "attack",
    description:
      "Liviano y rapido. Excelente defensor evasivo. Debil en contacto continuo.",
    bestCombos: ["9-60 Ball", "7-60 Unite", "5-60 Taper"],
    tier: "B",
  },
  {
    name: "HellsChain",
    weight: "",
    type: "defense",
    description:
      "Desgaste de cadena con bajo recoil. Versatil entre defensa y semi-agresivo.",
    bestCombos: ["9-60 Ball", "5-60 Point", "7-60 Unite"],
    tier: "B",
  },
  {
    name: "UnicornSting",
    weight: "",
    type: "defense",
    description:
      "Blade elegante de counter. Fue bueno al principio pero superado por los nuevos.",
    bestCombos: ["9-60 Ball", "5-60 Unite", "7-60 Taper"],
    tier: "B",
  },
  {
    name: "LeonCrest",
    weight: "",
    type: "defense",
    description:
      "Forma de plato para counter defense. Liviano, facil de empujar.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "B",
  },
  {
    name: "PhoenixRudder",
    weight: "",
    type: "defense",
    description:
      "Compacto, propenso a burst. Counter vs left-spin con Elevate.",
    bestCombos: ["9-60 Elevate", "5-60 Ball", "7-60 Point"],
    tier: "B",
  },
  {
    name: "TriceraPress",
    weight: "",
    type: "attack",
    description:
      "Blade BX subestimado. Buenas embestidas con el setup correcto.",
    bestCombos: ["3-60 Rush", "1-60 Flat", "5-60 Rush"],
    tier: "B",
  },
  {
    name: "SamuraiCalibur",
    weight: "",
    type: "attack",
    description:
      "Opacado por SharkScale y Blast. Nicho pero divertido.",
    bestCombos: ["3-60 Rush", "1-60 Flat", "5-60 Flat"],
    tier: "B",
  },
  {
    name: "DranBuster",
    weight: "",
    type: "attack",
    description:
      "Arma de precision extrema. Potencia enorme pero riesgo enorme. La espada concentra el peso.",
    bestCombos: ["1-60 Flat", "3-60 Rush", "5-60 Flat"],
    tier: "B",
  },
  {
    name: "ShinobiShadow",
    weight: "28.4g",
    type: "balance",
    description:
      "El blade mas liviano. Estilo evasion ninja. Rebota en las paredes del stadium.",
    bestCombos: ["5-60 Point", "9-60 Unite", "3-60 Taper"],
    tier: "B",
  },
  {
    name: "DranBrave",
    weight: "",
    type: "attack",
    description:
      "Diseno pendiente para levantar rivales. Experimental.",
    bestCombos: ["3-60 Rush", "1-60 Flat", "5-60 Flat"],
    tier: "B",
  },

  // --- C TIER ---
  {
    name: "CrimsonGaruda",
    weight: "",
    type: "balance",
    description:
      "Mediocre, intenta todo sin sobresalir en nada. Homenaje a Dranzer decepcionante.",
    bestCombos: ["5-60 Unite", "9-60 Ball", "3-60 Taper"],
    tier: "C",
  },
];

// =============================================================================
// RATCHETS
// =============================================================================

export const RATCHETS: RatchetEntry[] = [
  {
    number: "0",
    description:
      "Pieza paradojica: periferia mas suave pero fondo mas expuesto. NO recomendado.",
    bestHeight: "60",
    tier: "C",
  },
  {
    number: "1",
    description:
      "Excelente contrapeso. 1-70 es el mas pesado. Esencial para correccion de balance.",
    bestHeight: "70",
    tier: "A",
  },
  {
    number: "2",
    description:
      "Mas propenso a burst. Solo para juego casual ultra-agresivo.",
    bestHeight: "60",
    tier: "C",
  },
  {
    number: "3",
    description:
      "Confiable, sin debilidad mayor. Bueno para defensa y stamina. Versatil.",
    bestHeight: "60",
    tier: "B",
  },
  {
    number: "3-85",
    description:
      "Super alto, super liviano, tipo O. Muy situacional.",
    bestHeight: "85",
    tier: "C",
  },
  {
    number: "4",
    description:
      "Punto medio entre 2 y 3. Buen balance con muchos blades.",
    bestHeight: "60",
    tier: "B",
  },
  {
    number: "4-55",
    description:
      "Super bajo, tipo O. Interesante para defensa especializada.",
    bestHeight: "55",
    tier: "C",
  },
  {
    number: "5",
    description:
      "Gran peso y estabilidad. Popular por mucho tiempo. Versatil.",
    bestHeight: "60",
    tier: "A",
  },
  {
    number: "M-85",
    description:
      "El ratchet mas pesado (10.7g). Capa metalica. Alto riesgo/recompensa.",
    bestHeight: "85",
    tier: "B",
  },
  {
    number: "6",
    description:
      "Poco versatil, depende de la sinergia con el blade.",
    bestHeight: "60",
    tier: "B",
  },
  {
    number: "7",
    description:
      "Excelente estabilizador. Pesado, baja el centro de gravedad. Pieza esencial.",
    bestHeight: "60",
    tier: "S",
  },
  {
    number: "7-55",
    description:
      "Tipo O, liviano pero el mas suave a esta altura. Gran sinergia con ClockMirage.",
    bestHeight: "55",
    tier: "B",
  },
  {
    number: "9",
    description:
      "El mas versatil y estable. Cero interferencia. 'La vieja confiable.'",
    bestHeight: "60",
    tier: "S",
  },
];

// =============================================================================
// BITS
// =============================================================================

export const BITS: BitEntry[] = [
  // --- ATTACK ---
  {
    name: "Rush",
    category: "attack",
    weight: "2.0g",
    description:
      "Mejor ataque controlado. Esencial para cualquier blader.",
    tier: "S",
  },
  {
    name: "Low Rush",
    category: "attack",
    weight: "1.9g",
    description:
      "Igual que Rush pero 1mm mas bajo. Esencial para 3v3.",
    tier: "S",
  },
  {
    name: "Flat",
    category: "attack",
    weight: "2.2g",
    description:
      "Punto medio de ataque. Buen balance entre velocidad y control.",
    tier: "A",
  },
  {
    name: "Low Flat",
    category: "attack",
    weight: "2.1g",
    description:
      "Flat mas bajo, mas fuerte pero mas erratico.",
    tier: "B",
  },
  {
    name: "Under Flat",
    category: "attack",
    weight: "2.1g",
    description:
      "2mm mas bajo. Gran potencial de upper attack.",
    tier: "B",
  },
  {
    name: "Gear Rush",
    category: "attack",
    weight: "2.1g",
    description:
      "Entre Rush y Flat. Mas potencia, menos control.",
    tier: "A",
  },
  {
    name: "Gear Flat",
    category: "attack",
    weight: "2.3g",
    description:
      "Flat mas rapido y agresivo. Buen Xtreme Dash.",
    tier: "A",
  },
  {
    name: "Vortex",
    category: "attack",
    weight: "2.1g",
    description:
      "Forma de estrella, alta traccion. Golpes muy potentes.",
    tier: "B",
  },
  {
    name: "Cyclone",
    category: "attack",
    weight: "2.1g",
    description:
      "Bit de ataque mas chico. Buena traccion con control.",
    tier: "A",
  },
  {
    name: "Accel",
    category: "attack",
    weight: "2.6g",
    description:
      "Xtreme Dash explosivo. Alto riesgo, alta recompensa.",
    tier: "B",
  },
  {
    name: "Rubber Accel",
    category: "attack",
    weight: "3.2g",
    description:
      "Mayor impacto pero peor control. Mejora con el desgaste.",
    tier: "C",
  },
  {
    name: "Level",
    category: "attack",
    weight: "2.7g",
    description:
      "Tres niveles de agresion. Versatil pero inconsistente.",
    tier: "A",
  },
  {
    name: "Quake",
    category: "attack",
    weight: "2.2g",
    description:
      "Peor stamina, caos puro. Divertido pero no competitivo.",
    tier: "C",
  },
  {
    name: "Turbo",
    category: "attack",
    weight: "12.7g",
    description:
      "Bit fusionado. Nostalgico pero riesgoso.",
    tier: "C",
  },
  {
    name: "Jolt",
    category: "attack",
    weight: "2.6g",
    description:
      "El flat mas chico. Mejor patron de flor. Ideal para ataque a distancia.",
    tier: "A",
  },

  // --- STAMINA ---
  {
    name: "Orb",
    category: "stamina",
    weight: "2.0g",
    description:
      "Mejor stamina pura. Mas chico, menor friccion.",
    tier: "S",
  },
  {
    name: "Low Orb",
    category: "stamina",
    weight: "1.9g",
    description:
      "Orb mas bajo, mas estable pero mas riesgoso.",
    tier: "A",
  },
  {
    name: "Ball",
    category: "stamina",
    weight: "2.0g",
    description:
      "Versatil stamina+defensa. Pieza esencial para todo blader.",
    tier: "S",
  },
  {
    name: "Free Ball",
    category: "stamina",
    weight: "1.9g",
    description:
      "Entre Ball y Orb. Giro libre para menos friccion.",
    tier: "A",
  },
  {
    name: "Disk Ball",
    category: "stamina",
    weight: "3.2g",
    description:
      "Ball con disco. Anti-KO pero riesgoso.",
    tier: "C",
  },
  {
    name: "Gear Ball",
    category: "stamina",
    weight: "2.1g",
    description:
      "El bit redondo mas agresivo. Mala stamina.",
    tier: "C",
  },
  {
    name: "Glide",
    category: "stamina",
    weight: "2.6g",
    description:
      "POM redondo con gancho. Versatil defensa-stamina.",
    tier: "B",
  },
  {
    name: "Wall Ball",
    category: "stamina",
    weight: "2.1g",
    description:
      "Ball con barrera. Situacional.",
    tier: "B",
  },
  {
    name: "Wedge",
    category: "stamina",
    weight: "1.8g",
    description:
      "Chico y filoso, gran control. Bueno para counter.",
    tier: "A",
  },
  {
    name: "Wall Wedge",
    category: "stamina",
    weight: "2.4g",
    description:
      "Wedge con barrera. Riesgoso pero efectivo en algunos casos.",
    tier: "B",
  },

  // --- DEFENSE ---
  {
    name: "Needle",
    category: "defense",
    weight: "2.0g",
    description:
      "Defensa de escudo al inclinarse. Vulnerable por los lados.",
    tier: "B",
  },
  {
    name: "Metal Needle",
    category: "defense",
    weight: "2.8g",
    description:
      "Menos friccion pero se desliza mas. Puede danar el stadium.",
    tier: "C",
  },
  {
    name: "Dot",
    category: "defense",
    weight: "2.0g",
    description:
      "Needle con puntos para traccion.",
    tier: "B",
  },
  {
    name: "High Needle",
    category: "defense",
    weight: "2.2g",
    description:
      "Angulo mas abierto, mejor estabilidad. Buena defensa consistente.",
    tier: "B",
  },
  {
    name: "Under Needle",
    category: "defense",
    weight: "1.8g",
    description:
      "2mm mas bajo. Mejor defensa consistente. Competitivo.",
    tier: "A",
  },
  {
    name: "Gear Needle",
    category: "defense",
    weight: "2.0g",
    description:
      "Defensa erguida pero pierde energia rapido.",
    tier: "C",
  },
  {
    name: "Spike",
    category: "defense",
    weight: "2.0g",
    description:
      "Fragil. Solo sirve para testear balance.",
    tier: "C",
  },
  {
    name: "Bound Spike",
    category: "defense",
    weight: "2.0g",
    description:
      "Mecanismo de resorte, caotico. Divertido pero no competitivo.",
    tier: "C",
  },

  // --- BALANCE ---
  {
    name: "Taper",
    category: "balance",
    weight: "2.2g",
    description:
      "Fusion Ball+Flat. Semi-agresivo con buena stamina.",
    tier: "A",
  },
  {
    name: "High Taper",
    category: "balance",
    weight: "2.3g",
    description:
      "Igual que Taper pero 1mm mas alto.",
    tier: "A",
  },
  {
    name: "Unite",
    category: "balance",
    weight: "2.1g",
    description:
      "Mejor bit de balance. Consistente, preciso, gran stamina.",
    tier: "S",
  },
  {
    name: "Kick",
    category: "balance",
    weight: "2.2g",
    description:
      "Taper hexagonal. Patadas erraticas. Divertido y competitivo.",
    tier: "A",
  },
  {
    name: "Trans Kick",
    category: "balance",
    weight: "2.3g",
    description:
      "Kick que cambia de altura. Caotico.",
    tier: "B",
  },
  {
    name: "Point",
    category: "balance",
    weight: "2.2g",
    description:
      "Centro estatico + agresivo al inclinarse. Gran counter.",
    tier: "S",
  },
  {
    name: "Gear Point",
    category: "balance",
    weight: "2.3g",
    description:
      "Point mas agresivo. Bueno para blades livianos.",
    tier: "A",
  },
  {
    name: "Trans Point",
    category: "balance",
    weight: "2.2g",
    description:
      "Point que cambia de altura. Riesgoso.",
    tier: "B",
  },
  {
    name: "Hexa",
    category: "balance",
    weight: "2.6g",
    description:
      "Sharp hexagonal ancho. MEJOR defensa estacionaria. Esencial.",
    tier: "S",
  },
  {
    name: "Elevate",
    category: "balance",
    weight: "3.3g",
    description:
      "Semi-agresivo con excelente ecualizacion. Clave para CobaltDragoon.",
    tier: "S",
  },
  {
    name: "Zap",
    category: "balance",
    weight: "2.6g",
    description:
      "Variante agresiva de Point. Alta velocidad, baja stamina.",
    tier: "B",
  },
  {
    name: "Merge",
    category: "balance",
    weight: "3.4g",
    description:
      "Base de goma, idea brillante pero demasiado alto.",
    tier: "C",
  },
  {
    name: "Operate",
    category: "balance",
    weight: "14g",
    description:
      "Bit fusionado, dos modos. Interesante pero fragil.",
    tier: "C",
  },
];

// =============================================================================
// GUIA PARA PRINCIPIANTES
// =============================================================================

export const BEGINNER_GUIDE = {
  sections: [
    {
      title: "Por que gira un Bey",
      content:
        "Velocidad, inercia y peso generan momento angular. El lanzamiento tipo latigazo transfiere la mayor energia posible al bey. Mas velocidad de giro = mas estabilidad y potencia.",
    },
    {
      title: "El arte del balance",
      content:
        "La estabilidad depende del centro de gravedad y el eje de rotacion. Truco del Balance Perfecto: gira el ratchet 180 grados para cambiar la distribucion de peso y corregir wobble.",
    },
    {
      title: "Enemigos invisibles",
      content:
        "Friccion: goma = alta, metal/POM = baja. Traccion: cuanto mas agarre, mas movimiento pero menos stamina. Aerodinamica: formas delgadas son mejores que anchas.",
    },
    {
      title: "La ciencia de los choques",
      content:
        "Same spin = mas retroceso para ambos. Opposite spin = ecualizacion (drenan mutuamente). Formas de blade: picudos concentran impacto, paredes reflejan, pendientes levantan, redondos deflectan.",
    },
    {
      title: "Estrategia de lanzamiento",
      content:
        "Cuatro factores clave: posicion en el stadium, impulso del tiro, timing del lanzamiento y postura del cuerpo. Aprender a leer rapido el combo del rival es clave.",
    },
    {
      title: "Mentalidad competitiva",
      content:
        "Consistencia es mas importante que una racha perfecta. Controla lo que podes controlar: tu combo, tu lanzamiento, tu actitud. No culpes a la suerte.",
    },
    {
      title: "El sistema X",
      content:
        "Estructura: Blade + Ratchet + Bit. Xtreme Dash: cuando el bey toca la Xtreme Line sale disparado con aceleracion extra. Victorias: Over Finish (KO), Burst Finish (desarme), Spin Finish (mas giro).",
    },
    {
      title: "Como armar combos",
      content:
        "Tipos: Agresivos (blade attack + ratchet bajo + bit agresivo), Estacionarios (blade defense + ratchet alto + bit redondo), Semiagresivos (mezcla), Counter (reacciona al rival). Pasos: elegir blade, luego bit compatible, despues ratchet, y probar.",
    },
  ],
};
