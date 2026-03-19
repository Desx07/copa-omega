// =============================================================================
// XCICLOPEDIA — Base de conocimiento completa de Beyblade X
// Fuente: Reviews y fundamentos de Bladers Santa Fe (Marzo 2026)
// =============================================================================

const STORAGE_BASE = "https://dceypgpgxusebiaofwpb.supabase.co/storage/v1/object/public/media/encyclopedia";

export interface BladeEntry {
  name: string;
  weight: string;
  type: "attack" | "defense" | "stamina" | "balance";
  description: string;
  details?: string; // expanded description with usage tips
  bestCombos: string[];
  tier: "S" | "A" | "B" | "C";
  imageUrl?: string;
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
    details:
      "WizardRod es la pieza mas completa que existe. Funciona en cualquier estilo: podes armarlo agresivo con Rush, defensivo con Ball, o semiagresivo con Unite. Su stamina altisima lo hace ideal para jugadores que quieren ganar por desgaste sin sacrificar opciones ofensivas. Es el blade que mas se adapta a cualquier situacion.",
    bestCombos: ["9-60 Ball", "3-60 Ball", "7-60 Hexa"],
    tier: "S",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "PhoenixWing",
    weight: "32.9g",
    type: "attack",
    description:
      "Primer tanque de gen X. Peso alto, versatil en todas las alturas. Gran smash, upper y downforce. Excelente counter.",
    details:
      "PhoenixWing combina peso con formas de impacto en todos los angulos: smash frontal, upper desde abajo y downforce desde arriba. Es uno de los mejores blades para counter porque absorbe el golpe y lo devuelve con creces. Ideal para jugadores que quieren un blade agresivo pero que no se descontrole.",
    bestCombos: ["9-60 High Needle", "7-60 Ball", "5-60 Taper"],
    tier: "S",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "CobaltDrake",
    weight: "38.1g",
    type: "defense",
    description:
      "El blade mas pesado del juego. Paredes que reflejan ataques con gran potencial de counter. Raro y codiciado.",
    details:
      "CobaltDrake es el rey del peso: sus 38.1g lo hacen practicamente inamovible. Sus paredes reflejan los ataques rivales con mucha fuerza, lo que lo convierte en un counter natural. Funciona mejor con puntas estables como Ball o Hexa, donde su masa hace el trabajo. Pieza premium que todo coleccionista quiere tener.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "S",
    imageUrl: STORAGE_BASE + "/guia_p03.png",
  },
  {
    name: "SharkEdge",
    weight: "",
    type: "attack",
    description:
      "Bajo y estable, excelente para ataque consistente. Opuesto a WhaleWave en estilo. Tambien conocido como SharkScale.",
    details:
      "SharkEdge es el atacante mas confiable del juego. Su perfil bajo le da estabilidad natural y sus filos concentran el impacto en puntos precisos. Es el blade ideal para quien quiere ganar por KO de forma consistente, sin depender de la suerte. Con puntas Rush o Flat a baja altura, es una maquina de Xtreme Finish.",
    bestCombos: ["4-55 Low Rush", "3-60 Rush", "1-60 Flat"],
    tier: "S",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "CobaltDragoon",
    weight: "37.8g",
    type: "defense",
    description:
      "Primer blade left-spin. Muy pesado con gran potencial de counter. Mejor con Elevate para ecualizacion.",
    details:
      "CobaltDragoon gira en sentido contrario al resto, lo que le da una ventaja unica: ecualiza la energia del rival y la drena. Combinado con Elevate, se convierte en una trampa para blades agresivos que pierden toda su velocidad al chocar. Es el blade que cambia la meta del juego por su mecanica unica.",
    bestCombos: ["4-60 Elevate", "9-60 Elevate", "5-60 Point"],
    tier: "S",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },

  // --- A TIER ---
  {
    name: "DranSword",
    weight: "35.4g",
    type: "attack",
    description:
      "El blade representativo de gen X. Muy versatil con buena stamina y recoil controlado. Ideal para principiantes y veteranos.",
    details:
      "DranSword es el blade con el que muchos empiezan, y con razon. Tiene un balance natural entre ataque y stamina que lo hace funcionar con casi cualquier combo. Su recoil moderado significa que no se descontrola al pegar, lo que lo hace perfecto para aprender y seguir siendo competitivo a alto nivel.",
    bestCombos: ["3-60 Rush", "5-60 Flat", "9-60 Ball"],
    tier: "A",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "HellsScythe",
    weight: "32.9g",
    type: "balance",
    description:
      "Liviano pero con gran stamina. Flexible entre agresion y defensa segun el lanzamiento.",
    details:
      "HellsScythe te deja elegir el estilo en el momento del lanzamiento: fuerte y central se comporta como defensivo, inclinado se vuelve agresivo. Su forma de guadana desgasta al rival con cada contacto. Ideal para jugadores que les gusta adaptar la estrategia en tiempo real.",
    bestCombos: ["9-60 Unite", "5-60 Point", "7-60 Ball"],
    tier: "A",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "WhaleWave",
    weight: "",
    type: "attack",
    description:
      "Potencia pura con riesgo. Pesado y caotico. Gran upper, smash y downforce.",
    details:
      "WhaleWave es el blade de alto riesgo y alta recompensa. Cuando conecta, pocos blades sobreviven al impacto. Su forma de ola genera upper, smash y downforce todo al mismo tiempo. Requiere practica para controlar su movimiento impredecible, pero en manos de un blader experimentado, es devastador.",
    bestCombos: ["5-60 Ball", "9-60 Taper", "7-60 Unite"],
    tier: "A",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "TyrannoBeat",
    weight: "36.8g",
    type: "attack",
    description:
      "Naturalmente agresivo y pesado. Gran smash desde cualquier angulo. Mejor en alturas 60/70.",
    details:
      "TyrannoBeat golpea con fuerza bruta. Sus 36.8g lo ponen entre los mas pesados, y su forma genera smash potente sin importar el angulo de contacto. Funciona mejor en alturas medias (60/70) donde puede impactar la zona media del rival. Un blade directo para jugadores que prefieren la fuerza pura.",
    bestCombos: ["1-60 Flat", "3-60 Rush", "5-70 Flat"],
    tier: "A",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
  {
    name: "SamuraiSaber",
    weight: "",
    type: "defense",
    description:
      "Excelente counter contra Dragoon y left-spin. Muy versatil defensivamente.",
    details:
      "SamuraiSaber fue disenado para enfrentar a CobaltDragoon y otros blades left-spin. Su forma de sable desvla los golpes con precision y devuelve el impacto. Es uno de los mejores blades defensivos del formato actual, especialmente valioso en torneos donde left-spin es comun.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "A",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
  {
    name: "SilverWolf",
    weight: "",
    type: "defense",
    description:
      "Buenas cualidades defensivas con potencial ofensivo latente. Blade CX con centro de gravedad alto.",
    details:
      "SilverWolf es un blade CX que sorprende por su versatilidad. Su centro de gravedad alto le permite generar upper attack cuando se inclina, combinando defensa con capacidad ofensiva. Funciona bien con puntas de balance como Point o Unite, donde puede alternar entre estilos segun la situacion.",
    bestCombos: ["9-60 Ball", "5-60 Point", "7-60 Unite"],
    tier: "A",
    imageUrl: STORAGE_BASE + "/guia_p10.png",
  },
  {
    name: "GolemRock",
    weight: "",
    type: "defense",
    description:
      "Compacto y pesado para su tamano. Estilo tanque puro con gran resistencia.",
    details:
      "GolemRock concentra mucho peso en poco espacio, lo que lo hace extremadamente estable y dificil de mover. Su estilo es tanque puro: se planta en el centro y absorbe todo. Ideal para jugadores que prefieren la solidez antes que la velocidad. Con Ball o Hexa, es un muro.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "A",
    imageUrl: STORAGE_BASE + "/guia_p10.png",
  },

  // --- B TIER ---
  {
    name: "DranDagger",
    weight: "34.9g",
    type: "balance",
    description:
      "Compacto semi-agresivo que desgasta al oponente. Buen peso para su tamano.",
    details:
      "DranDagger tiene una forma compacta que concentra el impacto en pocos puntos de contacto. Su peso de 34.9g le da buena inercia para desgastar al rival. Funciona bien con lanzamientos fuertes y puntas semiagresivas como Point. Es un blade solido para quienes buscan un estilo intermedio entre ataque y resistencia.",
    bestCombos: ["5-60 Point", "3-60 Rush", "9-60 Unite"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p04.png",
  },
  {
    name: "KnightShield",
    weight: "32.3g",
    type: "defense",
    description:
      "Forma de escudo que se beneficia del wobbling natural. Buen potencial de desgaste.",
    details:
      "KnightShield tiene una mecanica unica: cuando empieza a woblar (inclinarse), su forma de escudo genera mas friccion contra el rival, drenandole energia. No es el mas pesado, pero su diseno compensa con inteligencia mecanica. Funciona mejor con puntas estables que le permitan woblar controladamente.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p03.png",
  },
  {
    name: "LeonClaw",
    weight: "31.6g",
    type: "attack",
    description:
      "Liviano con garras texturadas que desestabilizan desde abajo. Especialista en upper attack.",
    details:
      "LeonClaw brilla cuando ataca desde una posicion baja. Sus garras texturadas enganchan al rival y lo levantan, generando upper attack natural. Con ratchets bajos como 4-55 o 1-60, maximiza su potencial. Ideal para jugadores que disfrutan un estilo tecnico de ataque desde abajo.",
    bestCombos: ["1-60 Rush", "3-60 Flat", "4-55 Rush"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p03.png",
  },
  {
    name: "ViperTail",
    weight: "",
    type: "balance",
    description:
      "Blade sutil de desgaste. Drena energia con contacto continuo. Efectivo con paciencia.",
    details:
      "ViperTail no busca el golpe espectacular: su fuerte es el contacto constante que le quita energia al rival sin gastar la propia. Es un blade para jugadores pacientes que prefieren ganar por Spin Finish. Combinado con puntas de balance como Point o Unite, mantiene contacto sin perder estabilidad.",
    bestCombos: ["5-60 Point", "9-60 Unite", "3-60 Taper"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
  {
    name: "WeissTiger",
    weight: "",
    type: "balance",
    description:
      "Equilibrio natural sin debilidades marcadas. Buen blade para adaptarse a cualquier rival.",
    details:
      "WeissTiger es la definicion de equilibrio: no tiene un area donde domine, pero tampoco tiene puntos debiles claros. Eso lo hace un blade muy adaptable que funciona bien contra casi todo. Ideal para jugadores que quieren un blade confiable que no los deje mal en ninguna situacion.",
    bestCombos: ["5-60 Unite", "9-60 Ball", "3-60 Taper"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
  {
    name: "KnightLance",
    weight: "",
    type: "attack",
    description:
      "Tipo lanza con impacto concentrado. Alto recoil que requiere control del lanzamiento.",
    details:
      "KnightLance concentra toda su fuerza en un punto de contacto, como una lanza real. Cuando conecta bien, el impacto es enorme. Su alto recoil es un arma de doble filo: podes usarlo a tu favor con lanzamientos controlados. Ideal para jugadores que buscan el KO decisivo.",
    bestCombos: ["3-60 Rush", "1-60 Flat", "5-60 Rush"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p03.png",
  },
  {
    name: "KnightMail",
    weight: "",
    type: "defense",
    description:
      "Blade CX con centro de gravedad elevado. Buen upper y smash desde arriba cuando tiene movimiento.",
    details:
      "KnightMail aprovecha su centro de gravedad alto para generar downforce y upper attack cuando se mueve. No es un blade estatico: necesita movimiento para sacar su potencial. Con puntas semiagresivas como Point o Taper, combina defensa con capacidad ofensiva sorpresiva.",
    bestCombos: ["5-60 Point", "9-60 Ball", "7-60 Taper"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p10.png",
  },
  {
    name: "PhoenixFeather",
    weight: "32.9g",
    type: "attack",
    description:
      "Liviano y rapido. Excelente como defensor evasivo que esquiva los golpes directos.",
    details:
      "PhoenixFeather compensa su peso ligero con velocidad y evasion. En vez de absorber golpes, los esquiva. Funciona mejor con puntas estables como Ball o Unite, donde puede mantenerse en movimiento sin perder stamina. Ideal para un estilo de juego que evita el contacto directo.",
    bestCombos: ["9-60 Ball", "7-60 Unite", "5-60 Taper"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p03.png",
  },
  {
    name: "HellsChain",
    weight: "",
    type: "defense",
    description:
      "Desgaste de cadena con bajo recoil. Versatil entre defensa y semi-agresivo.",
    details:
      "HellsChain tiene una forma que genera friccion constante contra el rival, como una cadena que lo frena. Su bajo recoil significa que casi no retrocede al pegar, lo que lo hace muy eficiente en desgaste. Funciona tanto defensivo con Ball como semiagresivo con Point.",
    bestCombos: ["9-60 Ball", "5-60 Point", "7-60 Unite"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
  {
    name: "UnicornSting",
    weight: "",
    type: "defense",
    description:
      "Blade elegante de counter con buena capacidad de desviar ataques. Solido en su rol.",
    details:
      "UnicornSting tiene una forma aerodinamica que desvla golpes con elegancia. Su especialidad es el counter: recibe el ataque y lo redirige. Funciona mejor contra blades agresivos que se descontrolan al no conectar limpio. Un blade que premia la paciencia y el buen posicionamiento.",
    bestCombos: ["9-60 Ball", "5-60 Unite", "7-60 Taper"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
  {
    name: "LeonCrest",
    weight: "",
    type: "defense",
    description:
      "Forma de plato ideal para counter defense. Especialista en desviar impactos.",
    details:
      "LeonCrest usa su forma de plato para redirigir la energia del rival. No es el mas pesado, pero su diseno compensa: los ataques resbalan sobre su superficie. Funciona mejor plantado en el centro con puntas estables. Ideal para jugadores que quieren frustrar a los atacantes.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p04.png",
  },
  {
    name: "PhoenixRudder",
    weight: "",
    type: "defense",
    description:
      "Compacto con buen potencial de counter vs left-spin usando Elevate.",
    details:
      "PhoenixRudder tiene una forma compacta que lo hace dificil de golpear limpiamente. Su mejor uso es contra left-spin con Elevate, donde ecualiza la energia del rival. Un blade especializado que brilla en matchups especificos.",
    bestCombos: ["9-60 Elevate", "5-60 Ball", "7-60 Point"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p03.png",
  },
  {
    name: "TriceraPress",
    weight: "",
    type: "attack",
    description:
      "Blade BX con buenas embestidas cuando tiene el setup correcto. Sorprende con su potencia.",
    details:
      "TriceraPress es uno de esos blades que no llama la atencion hasta que lo ves en accion. Sus tres puntos de contacto generan embestidas potentes y consistentes. Con Rush o Flat a baja altura, puede competir con blades de tier mas alto. Ideal para jugadores que buscan un atacante accesible y efectivo.",
    bestCombos: ["3-60 Rush", "1-60 Flat", "5-60 Rush"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p03.png",
  },
  {
    name: "SamuraiCalibur",
    weight: "",
    type: "attack",
    description:
      "Blade de ataque con estilo propio. Tiene su nicho y es divertido de usar.",
    details:
      "SamuraiCalibur tiene una forma de espada que genera impactos concentrados. Aunque hay atacantes mas populares, tiene un estilo unico que lo hace impredecible para el rival. Funciona mejor con puntas agresivas en ratchets medios. Un blade para quienes disfrutan sorprender con combos poco convencionales.",
    bestCombos: ["3-60 Rush", "1-60 Flat", "5-60 Flat"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
  {
    name: "DranBuster",
    weight: "",
    type: "attack",
    description:
      "Arma de precision extrema. La espada concentra toda la potencia en un punto de impacto.",
    details:
      "DranBuster es como un rifle de francotirador: cuando conecta, el dano es enorme. Su espada concentra todo el peso en un solo punto de contacto, generando impactos que pueden sacar al rival del stadium de un golpe. Requiere precision y practica para dominar, pero recompensa a los jugadores tecnicos.",
    bestCombos: ["1-60 Flat", "3-60 Rush", "5-60 Flat"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p04.png",
  },
  {
    name: "ShinobiShadow",
    weight: "28.4g",
    type: "balance",
    description:
      "El blade mas liviano del juego. Estilo ninja: rebota contra las paredes y esquiva usando su velocidad.",
    details:
      "ShinobiShadow pesa solo 28.4g, lo que lo hace el mas liviano del juego. Pero eso no es una debilidad: su velocidad le permite esquivar y rebotar contra las paredes del stadium de formas impredecibles. Ideal para jugadores que disfrutan la evasion y el caos controlado. Con puntas de balance, se vuelve una pesadilla para los atacantes.",
    bestCombos: ["5-60 Point", "9-60 Unite", "3-60 Taper"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p04.png",
  },
  {
    name: "DranBrave",
    weight: "",
    type: "attack",
    description:
      "Diseno de pendiente para levantar rivales. Un blade experimental con potencial de upper attack.",
    details:
      "DranBrave tiene una forma de pendiente inclinada que busca meterse debajo del rival y levantarlo. Es un blade experimental: cuando funciona, los resultados son espectaculares. Requiere ratchets especificos y lanzamientos bien calibrados. Ideal para jugadores aventureros que quieren probar mecanicas diferentes.",
    bestCombos: ["3-60 Rush", "1-60 Flat", "5-60 Flat"],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p04.png",
  },

  // --- C TIER ---
  {
    name: "CrimsonGaruda",
    weight: "",
    type: "balance",
    description:
      "Inspirado en Dranzer. Blade versatil que puede adaptarse a varios estilos de juego.",
    details:
      "CrimsonGaruda rinde homenaje al legendario Dranzer. Es un blade de balance que funciona mejor con puntas de equilibrio que le den movimiento y control. No es el mas fuerte en ninguna categoria, pero su versatilidad lo hace util como comodin. Ideal para jugadores nostalgicos que quieren un blade adaptable.",
    bestCombos: ["5-60 Unite", "9-60 Ball", "3-60 Taper"],
    tier: "C",
    imageUrl: STORAGE_BASE + "/guia_p04.png",
  },
  {
    name: "PteraSwing",
    weight: "",
    type: "attack",
    description:
      "Blade BX con forma de ala. Genera buenos patrones de movimiento cuando tiene velocidad.",
    details:
      "PteraSwing tiene un diseno inspirado en un pterodactilo que genera patrones de movimiento amplios. Funciona mejor con puntas agresivas donde puede cubrir mucho terreno en el stadium. Un blade accesible para quienes recien empiezan con combos de ataque.",
    bestCombos: ["3-60 Rush", "5-60 Flat", "1-60 Rush"],
    tier: "C",
    imageUrl: STORAGE_BASE + "/guia_p03.png",
  },
  {
    name: "ShelterDrake",
    weight: "",
    type: "defense",
    description:
      "Blade BX defensivo con buena cobertura. Protege bien desde el centro del stadium.",
    details:
      "ShelterDrake tiene una forma protectora que cubre muchos angulos. Funciona mejor plantado en el centro con puntas estables. Aunque no es el defensivo mas fuerte, su accesibilidad y consistencia lo hacen un buen blade para aprender el estilo defensivo.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "C",
    imageUrl: STORAGE_BASE + "/guia_p05.png",
  },
  {
    name: "HaevensRing",
    weight: "",
    type: "stamina",
    description:
      "Blade BX de stamina con forma circular. Su forma redonda minimiza la friccion en los contactos.",
    details:
      "HaevensRing tiene la forma mas redonda de los blades BX, lo que reduce la friccion cuando recibe golpes. Funciona mejor en combos de stamina pura con Ball u Orb. Un blade para quienes quieren enfocarse en girar mas tiempo que el rival.",
    bestCombos: ["9-60 Ball", "9-60 Orb", "7-60 Ball"],
    tier: "C",
    imageUrl: STORAGE_BASE + "/guia_p05.png",
  },
  {
    name: "AeroPegasus",
    weight: "",
    type: "attack",
    description:
      "Inspirado en Pegasus. Blade rapido con buen potencial de Xtreme Dash.",
    details:
      "AeroPegasus lleva el legado de Pegasus a la generacion X. Su diseno aerodinamico le da velocidad natural y buen potencial para activar el Xtreme Dash. Ideal para jugadores que quieren un blade iconico con estilo de ataque rapido.",
    bestCombos: ["3-60 Rush", "5-60 Flat", "1-60 Rush"],
    tier: "C",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "WyvernHover",
    weight: "",
    type: "balance",
    description:
      "Blade UX de balance con forma flotante. Buen movimiento lateral en el stadium.",
    details:
      "WyvernHover tiene un perfil que genera movimiento lateral interesante en el stadium. Con puntas de balance puede alternar entre agresion y defensa segun la situacion. Un blade versatil para quienes buscan opciones diferentes a los clasicos.",
    bestCombos: ["5-60 Unite", "9-60 Ball", "3-60 Point"],
    tier: "C",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "ScorpioSpear",
    weight: "",
    type: "attack",
    description:
      "Blade UX con forma de aguijon. Concentra el impacto en puntos de contacto precisos.",
    details:
      "ScorpioSpear tiene puntos de contacto afilados que generan impactos concentrados. Su forma de escorpion le da un estilo unico de ataque que puede sorprender al rival. Funciona mejor con puntas agresivas y ratchets medios.",
    bestCombos: ["3-60 Rush", "5-60 Flat", "1-60 Flat"],
    tier: "C",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
  {
    name: "ValorBison",
    weight: "",
    type: "defense",
    description:
      "Blade UX defensivo y robusto. Aguanta bien los impactos frontales.",
    details:
      "ValorBison tiene una forma robusta inspirada en un bisonte que absorbe impactos frontales con facilidad. No es el mas versatil, pero en su rol de tanque defensivo cumple bien. Ideal para jugadores que quieren plantar su bey en el centro y aguantar.",
    bestCombos: ["9-60 Ball", "7-60 Hexa", "5-60 Unite"],
    tier: "C",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
];

// =============================================================================
// RATCHETS
// =============================================================================

export const RATCHETS: RatchetEntry[] = [
  {
    number: "0",
    description:
      "Pieza particular: periferia mas suave pero fondo mas expuesto. Situacional, funciona en setups muy especificos.",
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
      "Mas propenso a burst. Funciona bien en juego casual y combos ultra-agresivos donde el riesgo vale la pena.",
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
      "Super alto, super liviano, tipo O. Situacional pero interesante en combos experimentales.",
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
      "Super bajo, tipo O. Interesante para defensa especializada y combos de perfil bajo.",
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
      "El ratchet mas pesado (10.7g). Capa metalica. Potencial alto en combos que aprovechan su masa.",
    bestHeight: "85",
    tier: "B",
  },
  {
    number: "6",
    description:
      "Depende mucho de la sinergia con el blade especifico. Funciona bien cuando encuentra su pareja ideal.",
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
      "Flat mas bajo, mas potente pero menos predecible. Ideal para jugadores que dominan el lanzamiento.",
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
      "Forma de estrella, alta traccion. Genera golpes muy potentes cuando conecta.",
    tier: "B",
  },
  {
    name: "Cyclone",
    category: "attack",
    weight: "2.1g",
    description:
      "Bit de ataque compacto. Buena traccion con control.",
    tier: "A",
  },
  {
    name: "Accel",
    category: "attack",
    weight: "2.6g",
    description:
      "Xtreme Dash explosivo. Riesgo alto pero la recompensa vale la pena cuando conecta.",
    tier: "B",
  },
  {
    name: "Rubber Accel",
    category: "attack",
    weight: "3.2g",
    description:
      "Mayor impacto con traccion de goma. Mejora con el desgaste natural del material.",
    tier: "C",
  },
  {
    name: "Level",
    category: "attack",
    weight: "2.7g",
    description:
      "Tres niveles de agresion segun la inclinacion. Versatil para diferentes estilos.",
    tier: "A",
  },
  {
    name: "Quake",
    category: "attack",
    weight: "2.2g",
    description:
      "Movimiento caotico e impredecible. Divertido y sorpresivo en partidas casuales.",
    tier: "C",
  },
  {
    name: "Turbo",
    category: "attack",
    weight: "12.7g",
    description:
      "Bit fusionado con peso alto. Nostalgico y unico en su mecanica.",
    tier: "C",
  },
  {
    name: "Jolt",
    category: "attack",
    weight: "2.6g",
    description:
      "El flat mas compacto. Mejor patron de flor. Ideal para ataque a distancia.",
    tier: "A",
  },

  // --- STAMINA ---
  {
    name: "Orb",
    category: "stamina",
    weight: "2.0g",
    description:
      "Mejor stamina pura. Mas compacto, menor friccion.",
    tier: "S",
  },
  {
    name: "Low Orb",
    category: "stamina",
    weight: "1.9g",
    description:
      "Orb mas bajo, mas estable. Ideal para combos de stamina con perfil bajo.",
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
      "Ball con disco anti-KO. Interesante en combos defensivos especificos.",
    tier: "C",
  },
  {
    name: "Gear Ball",
    category: "stamina",
    weight: "2.1g",
    description:
      "El bit redondo mas agresivo. Combina stamina con algo de traccion ofensiva.",
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
      "Ball con barrera protectora. Util en matchups especificos.",
    tier: "B",
  },
  {
    name: "Wedge",
    category: "stamina",
    weight: "1.8g",
    description:
      "Compacto y preciso, gran control. Bueno para counter.",
    tier: "A",
  },
  {
    name: "Wall Wedge",
    category: "stamina",
    weight: "2.4g",
    description:
      "Wedge con barrera. Efectivo en ciertos matchups defensivos.",
    tier: "B",
  },

  // --- DEFENSE ---
  {
    name: "Needle",
    category: "defense",
    weight: "2.0g",
    description:
      "Genera defensa de escudo al inclinarse. Solido para combos estacionarios.",
    tier: "B",
  },
  {
    name: "Metal Needle",
    category: "defense",
    weight: "2.8g",
    description:
      "Menos friccion que Needle regular. Se desliza mas, bueno para stamina defensiva.",
    tier: "C",
  },
  {
    name: "Dot",
    category: "defense",
    weight: "2.0g",
    description:
      "Needle con puntos para traccion adicional.",
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
      "2mm mas bajo. Defensa consistente y competitiva.",
    tier: "A",
  },
  {
    name: "Gear Needle",
    category: "defense",
    weight: "2.0g",
    description:
      "Defensa erguida con traccion adicional. Consume stamina mas rapido pero mantiene posicion.",
    tier: "C",
  },
  {
    name: "Spike",
    category: "defense",
    weight: "2.0g",
    description:
      "Punta fina ideal para testear balance de combos. Herramienta de laboratorio util.",
    tier: "C",
  },
  {
    name: "Bound Spike",
    category: "defense",
    weight: "2.0g",
    description:
      "Mecanismo de resorte que genera movimiento impredecible. Divertido y unico.",
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
      "Igual que Taper pero 1mm mas alto. Mayor rango de movimiento.",
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
      "Taper hexagonal. Movimientos sorpresivos. Divertido y competitivo.",
    tier: "A",
  },
  {
    name: "Trans Kick",
    category: "balance",
    weight: "2.3g",
    description:
      "Kick que cambia de altura. Impredecible y entretenido.",
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
      "Point que cambia de altura. Agrega un factor sorpresa al juego.",
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
      "Variante agresiva de Point. Alta velocidad, sacrifica stamina por movimiento.",
    tier: "B",
  },
  {
    name: "Merge",
    category: "balance",
    weight: "3.4g",
    description:
      "Base de goma, concepto innovador. Alto pero con traccion unica que lo diferencia.",
    tier: "C",
  },
  {
    name: "Operate",
    category: "balance",
    weight: "14g",
    description:
      "Bit fusionado con dos modos. Mecanica unica e interesante para explorar.",
    tier: "C",
  },
];

// =============================================================================
// GUIA PARA PRINCIPIANTES
// =============================================================================

export const BEGINNER_GUIDE = {
  sections: [
    {
      title: "Que es Beyblade X?",
      content:
        "Beyblade X es la nueva generacion del juego con el sistema Xtreme Dash: cuando tu bey toca el riel del stadium, sale disparado con una aceleracion brutal. Cada bey tiene tres piezas: el Blade (la parte de metal que pega y define el estilo), el Ratchet (la pieza que conecta todo y define la altura) y el Bit (la punta que toca el suelo y define el movimiento). Se puede ganar de tres formas: Xtreme Finish (sacar al rival por el riel, lo mas emocionante), Burst Finish (desarmar al rival) o Spin Finish (girar mas tiempo que el otro). El objetivo es armar el combo que mejor se adapte a tu estilo y dominarlo.",
    },
    {
      title: "El Balance Perfecto",
      content:
        "Este es el truco mas importante que vas a aprender: rota el Ratchet 180 grados y proba cual posicion le da mejor giro a tu bey. Cada pieza tiene variaciones microscopicas de peso por el proceso de fabricacion, y esas diferencias afectan como gira. Encontrar la alineacion correcta puede cambiar completamente el rendimiento de tu combo: menos wobble, mas estabilidad, mas tiempo de giro. Es gratis, no necesitas comprar nada, solo probar las dos posiciones y quedarte con la mejor. Hacelo con cada combo nuevo que armes.",
    },
    {
      title: "Tipos de combos",
      content:
        "Hay cuatro estilos principales. Agresivos: usan puntas planas (Rush, Flat) que buscan el KO rapido por Xtreme Finish, se mueven mucho y golpean fuerte. Estacionarios: usan puntas redondas o afiladas (Ball, Orb, Needle) que se quedan en el centro y ganan por resistencia, dejando que el rival gaste energia contra ellos. Semiagresivos: usan puntas de balance (Point, Unite, Taper) que se adaptan segun la inclinacion, empiezan estables y se vuelven agresivos cuando se inclinan. Counter: esperan el golpe del rival para devolverlo con mas fuerza, funcionan mejor con blades pesados y puntas estables.",
    },
    {
      title: "Como armar tu combo",
      content:
        "Paso 1: Elegi tu Blade segun el estilo que te gusta (ataque, defensa, stamina o balance). Paso 2: Elegi un Bit que complemente tu estrategia. Para ataque usa Rush o Flat, para defensa Hexa o Ball, para stamina Orb o Ball. Paso 3: Elegi un Ratchet que balancee el combo. El 9 es el mas seguro para empezar, el 7 es el mas estable. Paso 4: Hace el truco del Balance Perfecto rotando el Ratchet. Paso 5: Probalo en el stadium y ajusta segun como se comporte. No tengas miedo de experimentar con combinaciones raras.",
    },
    {
      title: "Los Ratchets",
      content:
        "El Ratchet tiene dos numeros: el primero son las divisiones (cuantos dientes tiene) y el segundo es la altura en milimetros. Mas bajo (55mm) significa mas estable pero con riesgo de rozar el suelo. Mas alto (70mm, 85mm) da acceso a otras partes del blade rival pero pierde estabilidad. Los esenciales: el 9 es el mas versatil y seguro, cero interferencia con cualquier blade. El 7 es el mas estable, baja el centro de gravedad. El 1 es el mejor contrapeso para corregir balance. Empeza con el 9-60 y desde ahi experimenta.",
    },
    {
      title: "Los Bits",
      content:
        "La punta define TODO el movimiento de tu bey. Puntas planas (Rush, Flat) son agresivas: se mueven rapido y activan el Xtreme Dash con facilidad. Puntas redondas (Ball, Orb) son de resistencia: se quedan centradas y giran mucho tiempo. Puntas afiladas (Needle, Hexa) son para defensa estacionaria: se plantan y absorben golpes. Puntas de equilibrio (Point, Unite, Taper) mezclan todo: empiezan estables y se vuelven agresivas al inclinarse. Elegi segun tu estilo: si te gusta la accion, anda con Rush. Si preferis la estrategia, proba Ball o Hexa.",
    },
    {
      title: "Lanzamiento",
      content:
        "Lanzar no es fuerza bruta, es tecnica. Pensa en un latigazo: rapido, fluido y preciso. Un buen lanzamiento le transfiere mas energia al bey que uno fuerte pero torpe. La inclinacion del lanzamiento cambia el comportamiento de la punta: mas vertical para puntas estables, mas inclinado para activar agresion. Practica diferentes angulos y fuerzas hasta encontrar lo que funciona con tu combo. La posicion donde soltas en el stadium tambien importa: al centro para defensa, al borde para ataque.",
    },
    {
      title: "Mentalidad Blader",
      content:
        "La consistencia gana mas torneos que una racha perfecta. Controla lo que podes controlar: tu combo, tu lanzamiento, tu actitud. Cada derrota es informacion: que paso, que podes cambiar, que aprendiste. El competitivo es mucho mas divertido cuando respetas al rival y disfrutas el proceso. No te frustres si perdes, adaptate. Los mejores bladers no son los que nunca pierden, son los que aprenden mas rapido de cada batalla.",
    },
  ],
};

// =============================================================================
// IMAGENES DE REFERENCIA DE LA GUIA
// =============================================================================

export const GUIDE_IMAGES = {
  blades_bx_1: STORAGE_BASE + "/guia_p03.png",
  blades_bx_2: STORAGE_BASE + "/guia_p04.png",
  blades_bx_3: STORAGE_BASE + "/guia_p05.png",
  blades_ux_1: STORAGE_BASE + "/guia_p07.png",
  blades_ux_2: STORAGE_BASE + "/guia_p08.png",
  blades_cx_1: STORAGE_BASE + "/guia_p10.png",
  blades_cx_2: STORAGE_BASE + "/guia_p11.png",
  assist_blades: STORAGE_BASE + "/guia_p13.png",
  ratchets_1: STORAGE_BASE + "/guia_p20.png",
  ratchets_2: STORAGE_BASE + "/guia_p21.png",
  ratchets_3: STORAGE_BASE + "/guia_p22.png",
  bits_attack: STORAGE_BASE + "/guia_p24.png",
  bits_stamina: STORAGE_BASE + "/guia_p25.png",
  bits_defense: STORAGE_BASE + "/guia_p26.png",
  bits_balance: STORAGE_BASE + "/guia_p27.png",
};
