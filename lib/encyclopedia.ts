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
  details?: string;
  bestHeight: string;
  tier: "S" | "A" | "B" | "C";
}

export interface BitEntry {
  name: string;
  category: "attack" | "defense" | "stamina" | "balance";
  weight: string;
  description: string;
  details?: string;
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
      "Uno de los ratchets mas amplios y pesados, con periferia completamente circular y lisa que amortigua golpes en toda la circunferencia por igual. El problema son tres salientes inferiores extremadamente expuestas que generan retroceso enorme al rozar con el suelo o los rieles. La version 0-80 (7.6g) es la menos arriesgada porque un plastico interno reduce la exposicion de las salientes, mientras que 0-60 y 0-70 quedan totalmente vulnerables. Ironicamente, el Ratchet 9 termina siendo mas suave, estable y seguro que el 0.",
    details:
      "Su amplia periferia cubre puntos debiles del Blade y su peso distribuido a los extremos mejora la resistencia y estabilidad general, brindando gran soporte defensivo. Pero todo ese beneficio se pierde por el enorme riesgo de las salientes inferiores: si rozan el suelo o los rieles, el bey rebota, pierde energia y estalla con facilidad. La 0-60 (6.8g) es la mas baja y esconde mejor las salientes pero roza mas facil con el suelo. La 0-70 (6.9g) es la peor: no tiene la proteccion de la 80 ni la cobertura de la 60. La 0-80 (7.6g) es de las versiones mas pesadas del sistema y aprieta fuerte, pero los choques con el suelo siguen siendo fatales. En comparacion, 7 ofrece mas peso y estabilidad, 9 mejor resistencia y suavidad, y 1 un balance superior.",
    bestHeight: "80",
    tier: "C",
  },
  {
    number: "1",
    description:
      "Ratchet de una sola division profunda con forma de gota de agua que concentra todo el peso en un solo punto, funcionando como un contrapeso excepcional. Cuando esta bien alineado con el Blade, mejora radicalmente la estabilidad, el control y la resistencia del combo, como cuando balancean las llantas de un auto. La version 1-70 (7.3g) es la mas pesada de las tres y claramente la mejor: agrega estabilidad y potencia sin los riesgos de las otras alturas. Su periferia es suave asi que no es facil de estallar, aunque si tiende a rebotar con fuerza en los huecos del stadium.",
    details:
      "Al tener todo el peso en un solo lado, puede servir tanto para corregir el balance natural del Blade como para hacerlo mas erratico y agresivo si el peso cae del lado incorrecto. Otro rasgo unico es su tendencia a rebotar con fuerza en los huecos del stadium, permitiendo que el bey regrese al combate con gran frecuencia. La 1-60 (6.0g) es la mas baja y dificil de que haga contacto con el rival, pero la mas propensa a rozar el suelo. La 1-70 (7.3g) es inusualmente mas pesada que la 80 y bastante mas que la 60, compensando riesgos con estabilidad y potencia. La 1-80 (6.8g) tiene mayor exposicion y retroceso, util para combos pesados erraticos y aplastantes. Solo cuando necesitas estar lo mas bajo posible la version 60 te conviene mas que la 70.",
    bestHeight: "70",
    tier: "A",
  },
  {
    number: "2",
    description:
      "El ratchet mas propenso a estallar de todo el sistema, con dos salientes gruesas, anchas y asimetricas que generan retroceso elevadisimo y se enganchan facilmente con el rival, el suelo y los rieles. Es un arma de doble filo literal: sus salientes multiplican la fuerza de los golpes pero tambien te destrozan a vos. Solo tiene sentido en combos super agresivos con blades pesados que compensen el retroceso. La version 2-70 (6.3g) equilibra mejor potencia y riesgo que las otras.",
    details:
      "En teoria, al girar a la derecha expone su lado suavizado y a la izquierda su filo agudo para atacar, pero en la practica ambos lados son igual de agresivos por su forma rectangular. La 2-60 (6.1g) es la mas baja y vulnerable a pegar con el riel, ofrece gran potencia para combos extremos. La 2-70 (6.3g) es la mas equilibrada: mantiene el poder de impacto, reduce el riesgo de rozar el suelo y no queda tan vulnerable como la 80. La 2-80 (6.7g) es la mas peligrosa, aumenta el contacto directo y el retroceso, requiere combos pesados y puntas agresivas para no autodestruirse. Es una pieza impredecible y divertida para juego casual, pero demasiado inconsistente para uso competitivo serio.",
    bestHeight: "70",
    tier: "C",
  },
  {
    number: "3",
    description:
      "Ratchet de tres divisiones anchas, suavizadas y con inclinacion hacia adentro que quedan faciles de esconder bajo el Blade. Por su suavidad y bajo retroceso es una pieza muy confiable en defensa y resistencia, dificil de estallar y que generalmente estabiliza bien blades de 3 o 6 segmentos. Al ser impar, la alineacion cambia totalmente segun el lado en que lo armes, asi que no solo importa el balance sino como complementa los puntos de contacto del Blade. La 3-60 (6.3g) es la version mas estable para defensa pura.",
    details:
      "Cuando hace contacto, su leve inclinacion puede aprovecharse para aplastar o desestabilizar rivales sin salir tan afectado de los impactos. Al ser de numero impar, de un lado podria obstruir puntos de contacto valiosos, quedar mas escondido, mas expuesto, o bien mejor alineado para potenciar impactos. La 3-60 (6.3g) es la baja y mas estable, ideal para defensa y resistencia. La 3-70 (6.4g) potencia la ofensiva al ser mas factible que haga contacto. La 3-80 (7.0g) es la mas pesada del grupo y dentro del rango de su altura brinda buen equilibrio entre impacto y aguante a estallar. No destaca particularmente en nada ni tiene desventajas relevantes: si le da buen equilibrio a tu combo, no te va a fallar.",
    bestHeight: "60",
    tier: "B",
  },
  {
    number: "3-85",
    description:
      "Ratchet super alto (8.5mm) y extremadamente liviano (4.9g) con ensamble tipo O que prescinde del mecanismo de presion interno, haciendolo mucho mas facil de estallar. Su forma suavizada tiene poco retroceso, pero la altura excesiva y el bajo peso elevan el centro de gravedad volviendolo sumamente inestable, facil de empujar, con menos tiempo de giro y menor impacto. Su unica ventaja real es que al ser tipo O aprieta por igual todos los Bits, permitiendo usar puntas de defensa y resistencia que normalmente estallarian facil.",
    details:
      "La eliminacion del mecanismo de presion redujo considerablemente el plastico y en consecuencia el peso, quedando casi la mitad que un ratchet normal. Su inestabilidad provoca que sea facil de noquear y disminuye el tiempo de giro. Combinado con blades muy pesados, estos pueden compensar su ligereza y aprovechar la inestabilidad para rebotes erraticos y ataques impredecibles capaces de producir impactos sorpresivos y aplastantes. Pero no ofrece una estrategia consistente: es una pieza experimental y curiosa que solo agrava las desventajas de ser muy alto. A menos que busques explicitamente un combo caotico alto, hay opciones mucho mejores.",
    bestHeight: "85",
    tier: "C",
  },
  {
    number: "4",
    description:
      "Cuatro divisiones cuadradas marcadas y expuestas que generan alto retroceso: pueden causar buen dano pero te dejan vulnerable a estallar, y si rozan el suelo perdes mucha energia y se frena en seco en los giros finales. En el ambito ofensivo funciona como segunda capa de impacto que potencia los golpes, especialmente con blades pesados y bits de tubo ancho que reduzcan el riesgo de burst. La 4-60 (6.2g) es la que mejor equilibra exposicion con riesgo de pegar con el suelo. Suele balancear bastante bien blades de segmentos pares.",
    details:
      "La version blanca de 4-60 de DranDagger suele trabarse y es mucho mas dificil de desarmar, haciendola mas viable y menos riesgosa a estallar. La 4-50 (5.9g) es la mas baja y estable pero extremadamente propensa a rozar con el suelo. La 4-60 (6.2g) equilibra exposicion con riesgo. La 4-70 (6.4g) mejora el poder de impacto y reduce el roce con el suelo. La 4-80 (7.0g) tiene exposicion total con retroceso extremo y alto riesgo de estallido, solo util si buscas maximizar el downforce. No es tan arriesgado como 2 pero tampoco tan seguro como 3, queda en un punto intermedio que vale la pena probar en tu combo especifico.",
    bestHeight: "60",
    tier: "B",
  },
  {
    number: "4-55",
    description:
      "Ratchet super bajo (5.5mm) y muy liviano (4.7g) con ensamble tipo O y un diseno completamente distinto al 4 normal: sus divisiones son mas anchas, se extienden por debajo del plastico con inclinacion, y entre cada una hay arcos que forman ganchos. El ensamble tipo O significa que aprieta por igual todos los Bits, lo que permite usar puntas de defensa y resistencia con mayor seguridad contra estallidos. Interesante en combos defensivos que busquen bajar el perfil del Blade reduciendo el riesgo a estallar.",
    details:
      "Baja el Blade apenas medio milimetro respecto a la 60, reduciendo levemente el centro de gravedad, pero al concentrar el peso del combo mas arriba no mejora realmente la estabilidad general frente a una 60. Sus ganchos quedan algo escondidos pero siguen generando retroceso considerable si son impactados o rozan con los rieles. No alcanzan el nivel de riesgo de 0 o 2, pero es un factor a tener en cuenta. La eliminacion del mecanismo de presion le quito casi 2g comparado con un 60 normal. Puede ser curiosa en combos defensivos de perfil bajo, pero parece casi experimental en su diseno.",
    bestHeight: "55",
    tier: "C",
  },
  {
    number: "5",
    description:
      "Cinco salientes amplias y uniformemente distribuidas que ofrecen soporte equilibrado a toda la periferia del Blade, con elevado peso que potencia estabilidad y fuerza de impacto. Sus extremos son mas cerrados que los de 4, reduciendo la posibilidad de engancharse con el rival y disminuyendo el retroceso. Las salientes son suaves por debajo, asi que no se frenan bruscamente al rozar el suelo. Blades de superficie redonda o de cinco segmentos le sacan maximo provecho. La 5-60 (6.5g) es la mas estable al no interponerse en los impactos.",
    details:
      "Durante mucho tiempo fue uno de los ratchets mas populares por su peso y estabilidad, aunque hoy piezas como 6 o 7 pueden adaptarse mejor a ciertas estrategias. Su gran tamano puede jugar en contra: al extenderse tanto, puede obstruir puntos de contacto importantes del Blade y quedar muy expuesto, especialmente en blades muy pequenos. El numero cinco no sinergiza bien con todos los blades, particularmente los de segmentacion muy marcada. La 5-70 (6.8g) es ligeramente mas propensa a influir en los impactos. La 5-80 (7.3g) puede complementar combos de downforce y junto a 9 es de los mas dificiles de estallar a esa altura. Logra un gran balance entre fuerza, peso, retroceso y estabilidad.",
    bestHeight: "60",
    tier: "A",
  },
  {
    number: "M-85",
    description:
      "El ratchet mas pesado del sistema (10.7g) gracias a una capa metalica interna, con diseno practicamente identico al 5 pero ensamble tipo O. Ese peso enorme aporta estabilidad notable para su altura, pero al alcanzar 8.5mm las salientes quedan aun mas expuestas que en 5-80, incrementando el retroceso. El ensamble tipo O lo hace vulnerable a estallar y limita su potencial defensivo. Ideal para combos pesados y aplastantes que busquen impactos poderosos desde arriba, especialmente con blades amplios y agresivos.",
    details:
      "El ensamble tipo O prescinde del mecanismo de presion interno, asi que deja de apretar con el Bit antes de soltarse, pero todos los Bits encajan con la misma firmeza. Funciona mejor con Bits tipo Low o Under que bajan el centro de gravedad y reducen la exposicion de las salientes. Al ser tan pesado, es mas propenso a desbalancear el bey si no esta bien alineado, por lo que requiere un balance perfecto para liberar su verdadero potencial. Es una pieza contradictoria: un paso adelante en peso y potencia, pero dos atras en estabilidad y seguridad. Requiere compensacion cuidadosa para aprovechar lo que en teoria buscaba ofrecer desde el principio: mayor estabilidad en combos altos.",
    bestHeight: "85",
    tier: "B",
  },
  {
    number: "6",
    description:
      "Seis divisiones: tres delgadas y tres mas anchas que sobresalen ligeramente, con diametro un poco mayor al promedio pero sorprendentemente ligero. Las salientes anchas cuando son nuevas pueden rozar con el suelo, pero al ser huecas se deforman con el uso y se vuelven menos peligrosas. Su forma amplia puede tapar puntos vulnerables del Blade (util) o tapar puntos fuertes (un estorbo), dependiendo del blade especifico. Su utilidad depende enormemente de la sinergia, principalmente blades de 6 segmentos le sacan mas provecho.",
    details:
      "Por dentro las salientes anchas generan una pared marcada, casi un gancho inferior que cuando es nueva causa problemas pero rapidamente se deforma y suaviza, dejandola de bajo retroceso similar a 3. El plastico hueco ayuda a amortiguar aun mas los impactos. La 6-60 (6.1g) es la mas baja y ligera, ofrece suavidad lateral. La 6-70 (6.4g) queda mas expuesta y actua como segunda capa de contacto. La 6-80 (6.8g) tiene plastico que cubre parcialmente las salientes, reduciendo el retroceso inferior. No es tan versatil como 1, 5, 7 y 9 que tienen efectos beneficos mas notorios, pero cuando encuentra su pareja ideal rinde bien.",
    bestHeight: "60",
    tier: "B",
  },
  {
    number: "7",
    description:
      "Siete amplias divisiones que forman una barrera solida, con una saliente ligeramente mas larga que concentra peso extra. Es una de las piezas mas anchas y pesadas del sistema, y un excelente estabilizador: su elevado peso distribuido hacia abajo baja el centro de gravedad, aumenta la traccion, reduce el riesgo de salir del stadium y mejora el control en beys agresivos. Tambien es ideal para blades ligeros o inestables, ya que les compensa sus desventajas. La 7-60 (7.1g) es la version mas estable, y la 7-80 (7.8g) es la mejor opcion para combos altos que necesiten maxima estabilidad.",
    details:
      "Su saliente mas larga genera un efecto de balance similar al del Ratchet 1 en menor grado, pudiendo mejorar la resistencia del bey, aunque en ese rubro 1 y 9 suelen ser mas consistentes. Su principal desventaja es que puede rozar con el suelo o los rieles si se sobreinclina, y en contacto directo su saliente marcada puede provocar retroceso considerable. La 7-60 (7.1g) es la de mayor riesgo a rozar pero la mas estable. La 7-70 (7.2g) mantiene estabilidad y facilita el uso de la parte media del Blade. La 7-80 (7.8g) es muy pesada, ideal para combos altos: su plastico adicional cubre la separacion entre segmentos, reduce retroceso y aumenta su vida despues de muerte, defendiendo con eficacia incluso a esa altura. Junto a 1 y 9, forma el trio mas versatil e indispensable del sistema.",
    bestHeight: "60",
    tier: "S",
  },
  {
    number: "7-55",
    description:
      "Ratchet super bajo (5.5mm) y ligero (5.2g) con ensamble tipo O, completamente distinto al 7 normal: las siete divisiones estan mas espaciadas, redondeadas en la parte baja y todas del mismo tamano. Su redondez inferior mitiga considerablemente el riesgo de raspar el suelo, e incluso si sucede, el desgaste de energia es mucho menor que el 7 estandar. Dentro de los ratchets tipo O, es sin duda el mas estable y de menor riesgo a estallar, y brilla especialmente con blades como ClockMirage que requieren este tipo de ensamble.",
    details:
      "El ensamble tipo O aprieta por igual todos los Bits, permitiendo usar puntas de defensa y resistencia con mayor seguridad. Pero la eliminacion del mecanismo de presion le quito casi 2g comparado con 7-60, y esa ligereza es notoria. En teoria baja medio milimetro el centro de gravedad, pero el cambio es minimo frente a la perdida de peso. De haber tenido el ensamble normal y el plastico habitual, pudo ser una excelente pieza defensiva y estabilizadora. Aun asi, 7-55 es la mejor opcion dentro de este tipo de ratchets, y si en el futuro aparecen mas Blades con la restriccion de solo usar tipo O, se volvera indispensable. Para todo lo demas, 7-60 sigue siendo la mejor alternativa.",
    bestHeight: "55",
    tier: "B",
  },
  {
    number: "9",
    description:
      "Nueve pequenas salientes ubicadas en la parte superior, muy cerca del Blade, con un lateral sumamente suave que se estrecha hacia el centro reduciendo casi por completo el retroceso y la exposicion. Es el ratchet menos invasivo de todo el sistema: no interfiere practicamente nada en los impactos, permitiendo que el Blade se encargue de todo sin obstrucciones. Su suavidad lateral y posicion superior evitan rozar el suelo, lo que permite maniobrar con total libertad en cualquier angulo de inclinacion. La vieja confiable: no te perjudica y te beneficia mucho.",
    details:
      "De los pocos ratchets que con seguridad proporcionan excelente estabilidad y resistencia en la mayoria de los Blades. Permite a beys agresivos moverse sin preocupacion y con gran estabilidad, y a defensivos conservar energia sin riesgo de roce. La 9-60 (6.2g) es la version baja, la mas estable y confiable del sistema entero. La 9-65 (4.5g) tiene ensamble tipo O, es mas ligero e inestable, pero los Bits de tubo delgado aprietan mas fuerte. La 9-70 (6.4g) conserva la estabilidad pero permite aprovechar la parte central del Blade, util para compensar Bits bajos como Under Needle. La 9-80 (7.0g) es mas pesada, con plastico inferior redondeado que mantiene bajo retroceso, excelente para ataque aplastante. En su version 60 y 70 es indispensable para todo jugador.",
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
      "La punta agresiva por excelencia: plana y redondeada de solo 6mm de diametro, la segunda mas pequena entre las de ataque, lo que le da una eficiencia energetica excepcional. Genera menos friccion que cualquier otra flat, logrando 4-5 Xtreme Dash consecutivos con patrones de ataque controlados y predecibles. Podes lanzar a maxima potencia sin miedo a que se descontrole, lo que la hace ideal tanto para combos ofensivos como para defensa evasiva. Es el estandarte del ataque controlado y pieza indispensable para todo blader.",
    details:
      "Su engrane tiene 10 dientes en vez de los 12 estandar, ademas de ser mas cortos en altura, lo que reduce el desgaste de energia al tomar el riel. Su reducido diametro permite mantener un amplio margen de tiempo para acertar impactos sin desperdiciar energia. El blader puede ajustar la fuerza de lanzamiento con total libertad sin que el bey rebote excesivamente. Su mayor inconveniente es el desgaste: el engrane delgado se deforma visiblemente con el tiempo y la punta pierde su redondez, afectando notablemente el desempeno. Es una pieza que vas a usar tanto que inevitablemente vas a necesitar multiples repuestos. A partir de Rush podes aumentar agresividad, traccion o rebote con otras puntas segun lo que necesites.",
    tier: "S",
  },
  {
    name: "Low Rush",
    category: "attack",
    weight: "1.9g",
    description:
      "Variante directa de Rush con la misma forma plana de 6mm y engrane de 10 dientes, pero 1mm mas baja. Esa menor altura baja el centro de gravedad y mejora la estabilidad, exponiendo mas la parte superior del Blade para impactos desde abajo. Conserva todas las ventajas de Rush: baja friccion, excelente control y multiples Xtreme Dash consecutivos. Es indispensable en el formato 3v3 donde no podes repetir piezas, porque te permite llevar dos puntas practicamente identicas de forma legal.",
    details:
      "El unico detalle negativo es que la circunferencia arriba del engrane tiene forma de petalo dividido en tres secciones (caracteristica visual de los Bits Low), que puede rebotar con el riel, consumiendo energia, rompiendo el patron de ataque o complicando la toma del Xtreme Dash. Tene cuidado con la inclinacion del lanzamiento a menos que busques intencionalmente rebotar. La version Hasbro con ImpactDrake viene con un punto central que la hace actuar como Point al inicio, hay que desgastarla para que funcione como debe. Mantiene el mismo rendimiento y estilo de juego que Rush con minimas variaciones.",
    tier: "S",
  },
  {
    name: "Flat",
    category: "attack",
    weight: "2.2g",
    description:
      "La punta basica de ataque con 7mm de diametro perfectamente redondo y un hueco al centro. Se situa justo en el punto medio entre control y agresividad: puede tomar los rieles limpiamente hasta tres veces seguidas sin gastar demasiada energia. Tambien mantiene brevemente un patron de flor al centro o puede forzar rebotes impredecibles por todo el stadium. Hay puntas con mayor control y otras con mas potencia, pero Flat es el punto medio confiable para quienes buscan mas fuerza que Rush sin perder maniobrabilidad.",
    details:
      "Su diametro de 7mm con engrane estandar de 12 dientes le da velocidad alta y resistencia decente, permitiendo sostener la ofensiva sin tanto riesgo de autosacarse. Su hueco central reduce levemente la friccion con el suelo. Es la referencia contra la cual se comparan todas las demas puntas de ataque: Rush tiene mas control y resistencia, Gear Flat tiene mas velocidad y agresividad, y Flat queda en el medio de ambas. Funciona bien con casi cualquier blade de ataque y es un excelente punto de partida para entender como las puntas planas afectan el movimiento.",
    tier: "A",
  },
  {
    name: "Low Flat",
    category: "attack",
    weight: "2.1g",
    description:
      "Version mas baja de Flat sin el hueco central, dejando una superficie completamente solida que le da mayor agarre al stadium y golpes mas fuertes. Esa misma friccion extra reduce el tiempo de giro. Su menor altura mejora la estabilidad y aprovecha mejor la parte superior del Blade para impactos directos. El petalo de tres aspas sobre el engrane puede chocar con el riel, interrumpiendo patrones de ataque y haciendola menos predecible. Es la version potente y erratica de Flat para quienes priorizan pocos golpes contundentes.",
    details:
      "La superficie completa sin hueco genera mas traccion, lo que se traduce en impactos mas fuertes pero tambien mayor consumo de energia por friccion. Los rebotes del petalo con el riel pueden interrumpir tu patron de ataque en cualquier momento, haciendola mas dificil de controlar que la Flat estandar. Funciona mejor con blades pesados que compensen la perdida de stamina y puedan aprovechar esos pocos golpes contundentes. Para quienes dominan bien el lanzamiento y pueden controlar la inclinacion inicial, ofrece una opcion de ataque mas letal que Flat a costa de consistencia.",
    tier: "B",
  },
  {
    name: "Under Flat",
    category: "attack",
    weight: "2.1g",
    description:
      "Variante de Flat que es 2mm mas baja, conservando el mismo diametro de 7mm pero con un hueco mas amplio que reduce la friccion. Su altura extremadamente baja le da excelente estabilidad y gran fuerza de impacto, exponiendo por completo la parte superior del Blade para upper attack. Las aspas sobre el engrane pueden pegar con los rieles en inclinaciones pronunciadas, pero su potencia y altura abren estrategias que ninguna otra punta de ataque ofrece. Si tu Blade necesita ser chaparro y agresivo, esta es tu punta.",
    details:
      "La poca distancia entre la punta y el engrane hace que en inclinaciones pronunciadas las aspas rocen los rieles, provocando rebotes o perdida de energia. Pero esa misma altura le da un potencial unico de upper attack: expone completamente la parte superior del Blade, ideal para blades con puntos de contacto superiores fuertes. Mantiene la misma aceleracion y velocidad que Flat con una ligera mejora en resistencia gracias al hueco mas amplio. Puede ser dificil de controlar, pero la combinacion de potencia y perfil bajo la hace valiosa para experimentar nuevas opciones de ataque.",
    tier: "B",
  },
  {
    name: "Gear Rush",
    category: "attack",
    weight: "2.1g",
    description:
      "Punta plana en forma de engrane de 10 dientes que se extienden hasta arriba, con diametro entre Rush y Flat. Su aceleracion inicial supera a Rush y alcanza mayor velocidad maxima que Flat gracias a la traccion adicional de los dientes. Aunque comparte nombre con Rush, su desempeno se asemeja mas a Flat: mas veloz y potente pero mas dificil de controlar, con engranes que interrumpen los patrones de ataque al centro. Es el upgrade natural para usuarios de Flat que buscan un extra de intensidad sin llegar al caos de Gear Flat.",
    details:
      "Al contar con solo 10 dientes como Rush, su desgaste de energia al tomar el riel es minimo, lo que le da una ventaja sobre Gear Flat en eficiencia. Sin embargo, los engranes rompen con frecuencia los patrones de ataque al centro, provocando movimientos mas amplios e impredecibles. Rush sigue siendo la opcion mas precisa y consistente gracias a mejor control y resistencia. Gear Rush ofrece un punto medio entre control y agresividad extrema, ideal para quienes quieren mas potencia que Flat sin comprometer demasiado la maniobrabilidad. Funciona bien con blades de peso medio que pueden aprovechar esa velocidad extra.",
    tier: "A",
  },
  {
    name: "Gear Flat",
    category: "attack",
    weight: "2.3g",
    description:
      "Punta plana con 12 dientes que se extienden hacia arriba, dando un diametro ligeramente mayor que Flat. Su diseno facilita el enganche con los rieles sin importar la altura del contacto, aumentando la frecuencia de Xtreme Dash y conservando mejor la energia al reducir rebotes. La mayor circunferencia da mas velocidad y agresividad al desplazarse por el stadium, pero incrementa el riesgo de salir sola. Las divisiones del engrane tienden a romper patrones de ataque, empujando al bey hacia los extremos para tomar el riel.",
    details:
      "Comparada con Flat normal, Gear Flat prioriza la velocidad y frecuencia de Xtreme Dash: el engrane la hace engancharse mas facilmente con los rieles, pero cada enganche la acelera de forma agresiva. Las divisiones del engrane ofrecen mayor agarre al suelo, traducido en golpes mas potentes. Su mayor riesgo es la tendencia a salirse sola del stadium por la velocidad que alcanza. Si buscas mas poder que Flat sin comprometer la resistencia, es buena candidata. Funciona especialmente bien con blades pesados que soporten la agresividad extra sin perder el control.",
    tier: "A",
  },
  {
    name: "Vortex",
    category: "attack",
    weight: "2.1g",
    description:
      "Punta en forma de estrella con picos que giran hacia la derecha, casi del tamano de Flat. La forma de estrella aumenta notablemente la traccion, incrementando el poder de los impactos incluso por encima de Gear Flat. Su rendimiento varia segun la direccion de giro: a la derecha los picos hacen contacto directo aumentando potencia pero reduciendo resistencia, a la izquierda la parte suavizada da mas control con impactos algo menores. Es una punta de ataque puro donde la traccion es tu arma principal.",
    details:
      "En giro a la derecha, la traccion extra de los picos genera golpes brutales pero consume mucha energia y rompe facilmente el patron de ataque al centro, abriendose a los extremos del stadium. En giro a la izquierda se vuelve una excelente alternativa a Flat, mas agresiva pero sin depender tanto del riel como Gear Flat. La traccion adicional le resta resistencia comparada con Flat estandar. Funciona mejor con blades pesados que puedan aprovechar la fuerza extra sin salir volando. En giro derecho, Gear Flat puede ser la opcion mas segura; en giro izquierdo, Vortex brilla como opcion mas agresiva que Flat.",
    tier: "B",
  },
  {
    name: "Cyclone",
    category: "attack",
    weight: "2.1g",
    description:
      "La punta de ataque mas pequena del sistema, con picos en forma de estrella girando a la izquierda y diametro incluso menor que Rush. Su tamano reducido la hace facil de controlar y poco probable que se salga sola, ya que su aceleracion maxima no alcanza para perder el control. Usa los 12 dientes estandar, dandole un Xtreme Dash mas potente que Rush pero con mayor consumo. La friccion de la estrella aumenta la fuerza de impacto manteniendo una resistencia muy parecida a Rush gracias a su tamano compacto.",
    details:
      "En giro a la izquierda los picos hacen contacto directo, aumentando traccion y potencia pero reduciendo resistencia y rompiendo el patron de ataque. En giro a la derecha la parte suavizada ofrece mas resistencia y control con impacto ligeramente menor pero aun superior a Rush. La combinacion ideal es usar Cyclone en giro derecho y Vortex en giro izquierdo, donde ambas tienen mejor equilibrio entre control, fuerza y resistencia. Ofrece mas traccion que Rush sin comprometer resistencia, con un control decente. Es una excelente punta para quienes quieren un paso extra de potencia sin alejarse demasiado de la confiabilidad de Rush.",
    tier: "A",
  },
  {
    name: "Accel",
    category: "attack",
    weight: "2.6g",
    description:
      "Variante de Flat con la misma punta plana de 7mm pero un engrane de 16 dientes mas amplio y bajo que facilita tomar el riel con suavidad. El resultado es un Xtreme Dash mucho mas veloz y agresivo que la original: sale disparada del riel con potencia explosiva. Pero esa misma velocidad la hace muy propensa a estrellarse con la pared, interrumpiendo cadenas de ataques, y el engrane amplio desgasta mas energia por cada toma del riel. Es la punta de la sorpresa explosiva: si fallas el primer impacto, quedas muy vulnerable.",
    details:
      "Mientras la punta toca el suelo, la velocidad y maniobrabilidad son iguales a Flat. Pero cuando se acerca al riel, todo cambia: el engrane alargado lo toma con suavidad y los 16 dientes generan un impulso brutal. Ese impulso la hace propensa a salirse sola y a chocar contra las paredes, lo que frena y consume energia antes de que pueda volver a acelerar. Alcanza a ejecutar menos Xtreme Dash que Rush o Flat por el mayor desgaste. Si logras un buen control inicial para postergar el Xtreme Dash, puede resultar interesante para sorprender, pero es mas arriesgada e inconsistente que Flat. Funciona mejor con blades pesados que absorban el retroceso de sus propios impactos.",
    tier: "B",
  },
  {
    name: "Rubber Accel",
    category: "attack",
    weight: "3.2g",
    description:
      "Punta plana de goma de 7mm con engrane de 16 dientes, que ofrece el mayor poder de impacto entre todas las puntas de ataque gracias a la friccion de la goma. Pero esa misma goma se adhiere al suelo de inmediato, abriendose demasiado al inicio, y una semiesfera choca con los rieles levantando al bey en vez de generar Xtreme Dash. Es el segundo Bit con menor resistencia del sistema. Curiosamente, con el desgaste la goma se redondea y se convierte casi en una Rubber Ball, mejorando control y defensa considerablemente.",
    details:
      "La semiesfera buscaba en teoria separar la punta del suelo durante el Xtreme Dash para evitar friccion, pero en la practica sigue tocando el stadium y actua como freno. La goma nueva deja residuos sobre el stadium que pueden afectar a otros beys, asi que hay que limpiar despues de usarla. Con el tiempo, la punta se desgasta y se vuelve redonda, reduciendo agresividad pero mejorando control, resistencia y adherencia, haciendola muy dificil de noquear. Hay debate sobre si en ese estado deberia seguir siendo legal. Su potencia es innegable cuando conecta, pero los rieles del sistema X son su peor enemigo: la friccion excesiva la hace mas experimental que competitiva.",
    tier: "C",
  },
  {
    name: "Level",
    category: "attack",
    weight: "2.7g",
    description:
      "Punta unica con tres niveles de agresion: una puntita plana diminuta (estable y semiagresiva), una circunferencia del ancho de Rush (velocidad media), y una circunferencia enorme de 8mm con 20 picos (maxima agresividad y traccion). La inclinacion del lanzamiento determina que nivel toca primero: erguido al centro se queda tranquilo, inclinado hacia las curvas progresa gradualmente, perpendicular sobre las curvaturas explota agresivo de inmediato. Tras los acelerones suele caer al nivel 1 o 2, conservando mejor la energia que Accel.",
    details:
      "El nivel 1 ofrece la mejor resistencia entre puntas de ataque. El nivel 3 alcanza velocidades superiores a Gear Flat con traccion intensa de los picos, y su engrane de 16 dientes produce Xtreme Dash al nivel de Accel. Su mayor debilidad es la inconsistencia: despues de los primeros ataques, es impredecible en que nivel se apoya, pudiendo quedarse agresivo o inmovil al centro. Es ideal para blades que buscan atacar a largo plazo dentro del centro del stadium, no para los que necesitan un solo golpe decisivo. Tambien puede funcionar en defensa evasiva porque su reaccion impredecible rompe la cadena de ataques del rival. Sorprendentemente versatil para quienes disfrutan adaptar la estrategia en cada lanzamiento.",
    tier: "A",
  },
  {
    name: "Quake",
    category: "attack",
    weight: "2.2g",
    description:
      "Punta plana con un corte en diagonal y tres engranes extendidos que generan movimiento violento, erratico y completamente descontrolado. El corte diagonal provoca rebotes impredecibles buscando impactos sorpresivos en direcciones imposibles de anticipar. Tiene la peor resistencia de todo el sistema y al rebotar expone el Ratchet constantemente, dejandote vulnerable a estallar. Es una punta que apuesta todo al caos y la sorpresa: puede dar momentos espectaculares pero deja el resultado a la suerte.",
    details:
      "Dependiendo del angulo de lanzamiento muestra cierta versatilidad: inclinado golpea el suelo y rebota con agresividad, paralelo mantiene un breve movimiento mas estable antes de tomar el riel. Pero en la practica es tan impredecible que no se puede planificar nada con ella. Su resistencia extremadamente baja significa que cada batalla es corta y explosiva. No tiene cabida competitiva seria, pero es la punta mas divertida para batallas casuales donde lo unico que importa es la emocion del momento. Si queres reir y sorprender, Quake es tu punta.",
    tier: "C",
  },
  {
    name: "Turbo",
    category: "attack",
    weight: "12.7g",
    description:
      "Primer Bit fusionado que cumple funcion de Ratchet y Bit en una sola pieza, con cuatro ganchos marcados arriba y una punta POM escondida que se expone al girar rapido (altura 90) y se contrae al perder energia (altura 65), cayendo sobre una superficie plana que lo vuelve agresivo de golpe. Es un homenaje a puntas clasicas como Final Drive y Reboot. Combina muy bien con CobaltDragoon porque al girar a la izquierda no estalla tan facil, sus divisiones se alinean, y la punta plana lo mantiene erguido para ecualizar.",
    details:
      "La punta POM se desliza con facilidad generando movimiento erratico con tendencia a rebotar por la altura del Bit. Una vez que desciende, gana un aceleron notable y puede realizar Xtreme Dash facilmente, haciendola bastante caotica y agresiva. Es util para esperar a que el oponente se acerque al centro y liberar un ataque sorpresa, aunque no tenes control de cuando o como lo hara. Su ensamble simple (solo presion con el Blade) la hace muy propensa a estallar, mas aun por el retroceso de los ganchos prominentes. La idea es excelente y divertida, pero dentro del sistema X resulta extremadamente riesgosa. Te va a sacar muchas carcajadas.",
    tier: "C",
  },
  {
    name: "Jolt",
    category: "attack",
    weight: "2.6g",
    description:
      "La punta plana mas pequena del sistema, mucho mas chica que Rush y Unite, con un engrane amplio de 16 dientes que baja mas de lo habitual. Su tamano minimo le da la mejor resistencia entre puntas de ataque y es la primera que realmente consigue un patron de flor (Rush Launch) efectivo y consistente, permitiendo moverse en circulos sin tocar el riel. Su poder de impacto es menor por la baja traccion, pero no busca reemplazar a Rush: cubre ataque a largo plazo por desgaste y defensa movil evasiva.",
    details:
      "Su excelente maniobrabilidad inicial permite elegir entre moverse en circulos sin tocar el riel, ir directo al ataque, o postergar el impulso sobreinclinandola para dejar que el rival tome el centro y luego ir por el. El engrane ancho y bajo le hace gastar mucha energia cada vez que toma el riel, y con frecuencia causa autosalidas por el gran impulso. No destaca por letalidad de pocos impactos, sino por desgaste continuo con impactos constantes. Cubre dos estilos que antes solo Level o Unite ofrecian: ataque prolongado y defensa movil. De haber tenido un engrane pequeno como Rush, seria rotisima, pero aun asi logra destacar y ampliar tus estrategias de juego.",
    tier: "A",
  },

  // --- STAMINA ---
  {
    name: "Orb",
    category: "stamina",
    weight: "2.0g",
    description:
      "Punta completamente redonda y la mas pequena entre las de resistencia, con la menor friccion con el suelo y el mejor tiempo de giro de todo el sistema. Al ser redonda mantiene superficie de contacto constante incluso al inclinarse, absorbiendo impactos y conservando estabilidad desde cualquier direccion. Es mas facil de noquear que Ball por su tamano y movimiento inicial casi nulo, convirtiendose en blanco fijo para beys agresivos. Si tu objetivo es la maxima resistencia posible, Orb es la punta ideal.",
    details:
      "Comparada con Ball, Orb traza circulos mas estrechos al inclinarse, lo que le ayuda a recuperar postura mas rapido. Sin embargo, en los giros finales se inclina mas cerca del suelo, aumentando el riesgo de que el Ratchet toque la superficie. Su tamano reducido y movimiento inicial nulo la hacen quedarse rapidamente en el centro, donde es un blanco facil. Para defensa mas completa y adaptable, Ball es mejor opcion. Pero en batallas donde la prioridad es girar mas tiempo que el rival, nada supera a Orb. Es la pieza clave para testing de balance perfecto: armala con 9-60, lanza y cronometra para saber exactamente cuanto gira tu combo.",
    tier: "S",
  },
  {
    name: "Low Orb",
    category: "stamina",
    weight: "1.9g",
    description:
      "Identica a Orb pero 1mm mas baja, con el trebol de tres aspas caracteristico de los Bits Low. Su menor altura reduce el centro de gravedad haciendola aun mas estable y ligeramente mas dificil de noquear, mejorando sus cualidades defensivas. En combates estacionarios donde los impactos son menos agresivos puede rendir mejor que Orb gracias a esa estabilidad adicional. El riesgo esta en que al ser mas baja, las aspas pueden chocar con los rieles o atorarse, incrementando probabilidades de estallar.",
    details:
      "Comparte todas las virtudes de Orb: excelente tiempo de giro, movimiento tranquilo y controlado, inclinacion estable que favorece la resistencia. La diferencia practica es un mayor riesgo en choques con el riel por el diseno de tres aspas, que puede causar perdida de energia o estallidos. Elegir entre una u otra depende del estilo: si preferis mayor defensa y firmeza aunque con algo de riesgo, Low Orb. Si preferis mejor conservacion de energia sin preocuparte por los rieles, Orb estandar. Funciona especialmente bien con blades pesados y estables que no se inclinan demasiado.",
    tier: "A",
  },
  {
    name: "Ball",
    category: "stamina",
    weight: "2.0g",
    description:
      "La punta estandar de resistencia, amplia y casi perfectamente redonda, que mantiene siempre la misma area de contacto sin importar la inclinacion. A diferencia de puntas afiladas que dependen del angulo correcto para resistir empujes, Ball defiende consistentemente desde cualquier direccion. Su mayor movimiento inicial le permite esquivar ataques e incluso atacar semiagresivamente. Es muy versatil y sensible a la fuerza e inclinacion del lanzamiento: inclinado atras se queda al centro, adelante se vuelve agresiva, paralelo orbita esquivando. Pieza esencial que todo blader debe tener.",
    details:
      "Puede sostener inclinaciones prolongadas, util para blades que buscan atacar desde abajo o desestabilizar al rival. Pero si la inclinas demasiado tiende a abrirse hacia los extremos del stadium, y una vez que supera cierto angulo le resulta casi imposible recuperar la postura, quedando vulnerable a ser aplastada o que le peguen al Ratchet. Su tiempo de giro no alcanza el de Orb, pero su defensa consistente desde cualquier direccion la hace mucho mas versatil. Es el punto de partida neutral para combos estacionarios: si no sabes que punta usar, empeza con Ball y ajusta desde ahi. Funciona con practicamente cualquier blade del juego.",
    tier: "S",
  },
  {
    name: "Free Ball",
    category: "stamina",
    weight: "1.9g",
    description:
      "Variante de Ball con forma ligeramente mas redondeada y transicion recta hacia el engrane, un poco mas pequena que Ball pero mas grande que Orb. Se ubica a medio camino entre Ball y Orb en resistencia, defensa y movimiento. Su mayor diferenciador es que no tiene las divisiones donde se enganchan las flechas del Ratchet, permitiendole girar libremente del resto del bey en modelos CX y UX. Eso deberia reducir la posibilidad de Xtreme Dash no deseados y mitigar la perdida de energia en caso de tomar el riel.",
    details:
      "Al cortar la esfera a la mitad tiene menor superficie para inclinarse, asi que recupera su postura erguida mas rapido que Orb. Se abre menos que Ball hacia los extremos y pandea menos que Orb en los giros finales, manteniendo posicion estable durante toda la batalla. Muchos jugadores competitivos la prefieren porque poco o mucho el giro libre deberia disminuir autocaidas, rebotes o perdida innecesaria de energia. No existe una version superior entre Ball, Orb y Free Ball: son diferentes enfoques. Orb para maxima resistencia, Ball para defensa versatil, Free Ball para equilibrio entre ambas. Es una gran adicion al arsenal competitivo.",
    tier: "A",
  },
  {
    name: "Disk Ball",
    category: "stamina",
    weight: "3.2g",
    description:
      "Variante de Ball identica en punta y engrane pero 2mm mas alta gracias a un disco amplio que incrementa la fuerza centrifuga, ayudando al bey a recuperar postura erguida tras inclinarse. Al ser empujado, el disco puede rozar el suelo para frenar el desplazamiento, dificultando las salidas. Pero el disco rozando constantemente gasta mucha mas energia que Ball, su altura aumenta el riesgo de estallar especialmente si es aplastada, y el disco actua como palanca que puede zafarse con facilidad.",
    details:
      "Conviene usar Ratchets bajos para compensar la altura del disco, porque si no la proteccion es inutil al quedar demasiado alto. Si el rival golpea desde abajo (la mayoria lo hara), el bey se eleva y el disco pierde contacto con el suelo, anulando todo su potencial defensivo. Inicialmente se penso que serviria para ecualizar energia, pero el disco queda demasiado alto para lograrlo efectivamente. Conlleva mucho riesgo sin beneficio sobresaliente comparada a Ball o Orb. Pero si tu prioridad absoluta es no salir del stadium y podes compensar la altura, dale una oportunidad.",
    tier: "C",
  },
  {
    name: "Gear Ball",
    category: "stamina",
    weight: "2.1g",
    description:
      "Punta en forma de cupula super ancha que conecta directamente con los 12 engranes, siendo la punta redonda mas agresiva del sistema. Puede realizar Xtreme Dash con gran frecuencia gracias a su amplia area de contacto y engranes tipo Gear que llegan muy abajo. Pero esa agresividad tiene tres costos: baja resistencia por la gran friccion, control limitado con tendencia a descontrolarse hacia los bordes, y alto riesgo de estallar por su tubo delgado. Taper o Unite son opciones mucho mas equilibradas para quienes buscan agresividad con resistencia.",
    details:
      "Su unico escenario donde puede destacar es en defensa evasiva con blades ligeros: su comportamiento erratico la hace rebotar por todo el stadium, incluyendo las zonas Xtreme, evitando ataques del rival hasta agotar su energia. Es un estilo arriesgado pero divertido, aunque solo efectivo contra beys agresivos de baja resistencia. En casi cualquier otro enfrentamiento tiene tarea complicada. Para defensa, Ball o Needle son mas consistentes; para resistencia, Orb es claramente superior; para agresividad con stamina, Taper o Unite ganan facil.",
    tier: "C",
  },
  {
    name: "Glide",
    category: "stamina",
    weight: "2.6g",
    description:
      "Punta redonda de POM (menor friccion que plastico comun) dentro de un contorno en forma de gancho que evita inclinaciones y frena desplazamientos al recibir impactos, con engrane de 16 dientes para Xtreme Dash de contraataque potentes. Es muy versatil si dominas el angulo de lanzamiento: inclinada adelante se mantiene estable al centro, inclinada atras genera un patron semiagresivo controlado. Puede adaptarse a defensa, evasion, estacionaria, contra-estacionarios e incluso ecualizacion en giro opuesto.",
    details:
      "La punta sobresale muy poco, y por la curvatura del stadium el gancho suele tocar el suelo incluso en lanzamientos horizontales, provocando movimientos agresivos no intencionados y perdida de energia. Al ser de tubo delgado, es susceptible a estallidos por los fuertes impactos de sus propios Xtreme Dash. En defensa, el gancho ofrece excelente soporte resistiendo impactos y dificultando los KO. En evasion, permite rodear al rival con el soporte extra del gancho. En ecualizacion de giro opuesto, la punta se patina y el gancho te mantiene mas erguido al final que una Ball normal. Es mas arriesgada que Ball pero ofrece un estilo unico de defensa-resistencia.",
    tier: "B",
  },
  {
    name: "Wall Ball",
    category: "stamina",
    weight: "2.1g",
    description:
      "Punta redonda similar a Free Ball rodeada por una barrera ondulada de cuatro secciones que toca el suelo al inclinarse, regresando al bey a posicion erguida rapidamente y frenando desplazamientos por impactos laterales. Cada roce de la barrera consume energia, asi que una secuencia de golpes agota toda su resistencia. Los impactos desde abajo la levantan y anulan la barrera por completo, y al ser de tubo delgado es muy propensa a estallar. Situacional: solo blades amplios o dificiles de golpear desde abajo le sacan provecho real.",
    details:
      "Es ligeramente mas alta que el promedio, lo que expone la parte inferior del Blade y facilita que la manden a volar. Si logra permanecer en el stadium pero aterriza sobre la barrera, pierde giro o genera rebotes indeseados. Al mantenerla erguida pierde la opcion de inclinarse para desviar ataques, haciendola vulnerable en los primeros choques. Con lanzamiento fuerte puede orbitar alrededor del centro y evadir impactos iniciales. Comparada con Hexa, Low Orb y Ball resulta mas arriesgada e inconsistente. Funciona bien con beys que necesitan permanecer perfectamente erguidos. Wall Wedge conserva mejor energia a largo plazo, mientras Wall Ball es mas segura al comienzo.",
    tier: "B",
  },
  {
    name: "Wedge",
    category: "stamina",
    weight: "1.8g",
    description:
      "Punta muy pequena y afilada con angulo de apertura mas amplio que Spike y engrane de solo 8 dientes redondeados como Rush. Visualmente parecida a Spike pero con desempeno radicalmente superior: la forma mas abierta la hace mucho mas estable, el engrane acortado y suavizado no roza el suelo, y al ser empujada sale disparada rompiendo la cadena de ataques del rival sin gastar energia innecesaria en Xtreme Dash. Brilla en combos de contradefensa donde rebota contra las paredes devolviendo impactos, especialmente con blades ligeros.",
    details:
      "Puede lanzarse ligeramente inclinada al estilo Needle para obtener un leve efecto de defensa escudo con menor riesgo de inestabilidad. A pesar de tener gran tiempo de giro, sigue siendo muy sensible al desequilibrio, requiriendo un combo bien balanceado. En batallas estacionarias no alcanza la resistencia de Ball, Hexa u Orb, pero su gran ventaja es la consistencia con los rieles: no tenes que preocuparte si hace contacto, porque su engrane chico no le hace gastar energia ni provocar autosalidas. A diferencia de puntas con engrane amplio que te puede costar la batalla tras un Xtreme Dash fuerte, Wedge es segura. Muy viable para combos defensivos.",
    tier: "A",
  },
  {
    name: "Wall Wedge",
    category: "stamina",
    weight: "2.4g",
    description:
      "Punta afilada identica a Wedge pero rodeada por una barrera ondulada de cuatro secciones, ligeramente mas alta que el promedio y con engrane de 16 dientes. Mantiene al bey erguido y frena desplazamientos por impactos laterales, pero cada roce de la barrera consume energia considerable. Opuesta a Wedge normal: la original busca salir disparada y rebotar, mientras Wall Wedge intenta frenar y alejarse. Se inclina menos que Wall Ball gracias al angulo del filo, conservando mejor energia al no depender tanto de la barrera.",
    details:
      "Al inicio del combate tiende a quedarse quieta al centro, siendo presa facil. Es mucho mas facil de empujar por su area de contacto tan pequena, pero tarda mucho en regresar al centro, lo que es fabuloso rompiendo la cadencia de ataques del rival (si no te sacan en el primer golpe). Los impactos desde abajo levantan y anulan la barrera, y al ser de tubo delgado es muy propensa a estallar. Funciona con blades amplios o dificiles de golpear desde abajo. Beys ligeros o de centro de gravedad alto no se benefician nada. Cumple lo que promete pero con demasiados riesgos, muy situacional e inconsistente incluso en sus mejores escenarios.",
    tier: "B",
  },

  // --- DEFENSE ---
  {
    name: "Needle",
    category: "defense",
    weight: "2.0g",
    description:
      "Punta conica afilada que permanece estatica al centro con gran resistencia individual, pero su desempeno depende completamente del angulo de impacto. Erguida es facil de mover con cada golpe, pero eso puede ser ventaja: al salir disparada y tardar en volver, rompe la cadena de ataques del rival haciendolo desperdiciar energia. Inclinada genera pequenos circulos con el Blade haciendo de escudo que desvia impactos frontales, clavandose al suelo como un baston estabilizador. Su potencial principal esta en la defensa escudo y en blades pesados que aplastan con el cabeceo.",
    details:
      "Su mayor problema es la conservacion de energia: comparada con puntas redondas, el desgaste tras cada impacto es mucho mas notorio, y beys agresivos pueden agotar su resistencia rapidamente. La inclinacion solo funciona si el golpe llega de frente al Blade, ya que deja expuestos laterales y parte trasera, zonas extremadamente vulnerables a KO, roce con el suelo o estallido del Ratchet. Las puntas redondas (Ball, Orb) y Hexa son mucho mas consistentes y versatiles, lo que deja a Needle como opcion muy especifica. Funciona mejor cuando sabes que el rival va a atacar de frente y tu blade es lo suficientemente pesado para absorber con el cabeceo.",
    tier: "B",
  },
  {
    name: "Metal Needle",
    category: "defense",
    weight: "2.8g",
    description:
      "Variante metalica de Needle con la misma forma conica pero material de menor friccion, dando mejor tiempo de giro pero haciendola mucho mas facil de patinar incluso si le pegan directo al Blade. Potencia la inestabilidad en beys desbalanceados, fomentando movimiento erratico que puede resultar interesante en combos pesados que aprovechen rebotes sutiles para aplastar impredeciblemente. Al inicio es muy afilada y puede danar el stadium si se lanza desde gran altura; con el uso se aplana y adopta un comportamiento mas parecido a una mini flat metalica.",
    details:
      "Mantiene las mismas cualidades y desventajas de Needle: defensa escudo en inclinacion correcta, vulnerabilidad en laterales y trasera. La diferencia clave es que el metal reduce friccion (mejor giro) pero tambien reduce traccion (mas facil de mover en cualquier direccion). Se recomienda lanzar a maximo 10cm arriba de la cubierta para no danar el stadium. Con el desgaste pierde el filo, se aplana y puede funcionar como candidata para defensa evasiva ya que se mueve con mas libertad. Queda muy opacada por Ball, Hexa y las otras redondas que son mucho mas consistentes. En algunos eventos la han baneado por danar stadiums.",
    tier: "C",
  },
  {
    name: "Dot",
    category: "defense",
    weight: "2.0g",
    description:
      "Variante de Needle con la misma forma conica pero superficie cubierta de multiples puntitos que aumentan la friccion para mejorar la traccion y dificultar que el bey sea desplazado, dandole mejor defensa desde todos los angulos que Needle normal. Cuando es nueva el punto central ofrece resistencia ligeramente superior pero inclinacion mas pronunciada. Con el desgaste los puntos exteriores hacen contacto uniforme, estabilizando el comportamiento. El aumento de friccion tambien consume mas energia, agravando el problema principal de Needle.",
    details:
      "Los residuos de plastico del desgaste irregular pueden modificar la superficie de forma contraproducente con el tiempo. Su funcion general es la misma que Needle: defensa escudo en la inclinacion correcta, vulnerable en laterales y trasera. Wall Ball y Hexa ofrecen defensa mas confiable y con mejor resistencia. Dentro de la familia de puntas afiladas, el orden de desempeno es: Metal Needle para mayor resistencia (mas facil de mover), Needle como punto medio, High Needle para mejor estabilidad, y Dot como la mas dificil de sacar pero con menor resistencia. La idea de mejorar traccion con los puntos es buena pero no garantiza resultados consistentes.",
    tier: "B",
  },
  {
    name: "High Needle",
    category: "defense",
    weight: "2.2g",
    description:
      "Punta afilada 1mm mas alta que Needle con angulo de apertura mas amplio y menos pronunciado, como la Semi Defense de Metal Fight. Entra en contacto con el suelo antes que la Needle estandar, ofreciendo mejor soporte defensivo, mayor estabilidad y mejor conservacion de energia durante los impactos. Realiza circulos mas amplios alrededor del stadium al inclinarse, manteniendose fuera del centro y reduciendo exposicion a ataques directos. Ideal para combos pesados que busquen aplastar o desgastar desde arriba con inclinacion prolongada.",
    details:
      "Si se sobreinclina puede irse demasiado hacia los bordes, dificultando la recuperacion y perdiendo resistencia en los giros finales. Con el desgaste del filo mejora aun mas su defensa, gana movimiento inicial y reduce el riesgo de sobreinclinacion, resultando en mejor resistencia general. Sigue siendo menos versatil que puntas redondas porque aun te deja vulnerable por laterales y trasera, pero en menor medida que Needle. Si buscas completamente un estilo de defensa escudo con mayor estabilidad y control, es la mejor opcion entre las afiladas. Se recomienda usar Ratchets bajos para compensar su altura extra si se busca defensa pura.",
    tier: "B",
  },
  {
    name: "Under Needle",
    category: "defense",
    weight: "1.8g",
    description:
      "Punta afilada 2mm mas baja que Needle con el trebol de tres aspas de los Bits Low. Su centro de gravedad mas bajo ofrece estabilidad significativamente mayor, reduciendo el tambaleo y haciendolo menos vulnerable al inclinarse. El anillo formado por los engranes brinda soporte adicional que afierra al bey al stadium durante impactos, logrando defensa consistente contra KOs. Ese mismo anillo suaviza los giros finales, permitiendo mantener el giro mas tiempo sin exponer la parte inferior del Blade. Una de las defensas mas solidas y viables a nivel competitivo.",
    details:
      "Conserva cierta capacidad de inclinacion para defensa escudo en menor medida que Needle, ya que el anillo de engranes limita el rango de inclinacion. Su principal desventaja es que la solapa de tres aspas puede rozar el riel, provocando que se atore, rebote o pierda energia, ademas del riesgo de que el Ratchet toque el suelo. Aun asi, la relacion riesgo-recompensa esta bastante bien equilibrada. Ideal para blades pesados y equilibrados que no dependan de inclinarse para protegerse. Comparada con Gear Needle, tiene defensa similar pero con mucho menos compromiso de resistencia: su anillo liso conserva mejor energia que los dientes de engrane de Gear.",
    tier: "A",
  },
  {
    name: "Gear Needle",
    category: "defense",
    weight: "2.0g",
    description:
      "Punta con forma de colina que sobresale del engrane, el cual queda mas abajo para facilitar Xtreme Dash. En la practica curiosamente no suele tomarlos tan frecuente porque los engranes actuan mas como frenos que rozan el suelo cuando el bey es empujado, evitando que llegue al riel. Eso da defensa efectiva contra KOs pero a costa de consumir mucha energia con cada contacto por la friccion de los dientes. Su punta redondeada reduce el efecto de defensa escudo: en vez de clavarse al suelo, tiende a patinar.",
    details:
      "Under Needle es superior en defensa similar pero con menos compromisos de resistencia: su anillo liso conserva mejor energia, es mas baja y estable, y no expone la parte inferior del Blade. Gear Needle necesita una inclinacion mayor para que el soporte entre en accion, o que le empujen mas lejos hasta la curvatura del stadium. Su punta redondeada le da un comportamiento intermedio entre Orb y Needle, recuperando rapido la posicion erguida sin sobreinclinacion. Su estilo es defender en posicion erguida, y aunque es buena en eso, pierde tanta energia que hasta los beys agresivos podrian desgastarlo. Hexa y Under Needle consiguen lo mismo pero mucho mas consistente y seguro.",
    tier: "C",
  },
  {
    name: "Spike",
    category: "defense",
    weight: "2.0g",
    description:
      "Punta diminuta y extremadamente afilada con angulo mas amplio que Needle pero extension muy corta, generando esquinas marcadas en los dientes del engrane. Puede alcanzar buenos tiempos de giro cuando esta perfectamente estable, pero su equilibrio es sumamente fragil: cualquier desbalance la hace cabecear y sobreinclinar. Carece totalmente de soporte lateral, es ridicilamente facil de empujar, y cada caida le cuesta mucha energia. Su mejor aplicacion real es como herramienta de testing para ajustar el balance de un combo.",
    details:
      "Su extrema sensibilidad revela con claridad cualquier desalineacion o descompensacion en el combo, haciendola ideal para encontrar el balance perfecto de tus combinaciones. En batalla, en defensa pura cualquier Needle la supera y en resistencia todas las Ball son mejores. Es una de las puntas que mas se inclinan, lo que puede usarse experimentalmente para forzar contacto con el Ratchet o upper attack. Se desgasta con el tiempo, mejorando la resistencia pero perdiendo su utilidad para testing. Si la estas usando para balance perfecto y se desgasto, reponela por una nueva y afilada.",
    tier: "C",
  },
  {
    name: "Bound Spike",
    category: "defense",
    weight: "2.0g",
    description:
      "Bit completamente diferente a Spike a pesar del nombre: tiene un punto diminuto al centro de una base circular casi plana, con una semiesfera en el tubo que permite que las flechas del Ratchet se deslicen, creando un mecanismo de compresion tipo resorte. En teoria busca absorber impactos, pero en la practica el roce constante entre Ratchet y Bit genera friccion, tambaleo y consume aun mas energia. Queda mas alto que una punta High, es muy propenso a estallar y a ser noqueado. Puede dar momentos espectaculares pero no tiene cabida competitiva.",
    details:
      "La inestabilidad del mecanismo puede aprovecharse intencionalmente en combos pesados: en combos bajos al sobreinclinarse actua como resorte rebotando y proyectando ataques hacia arriba, y en combos altos puede aplastar con efectividad. Cuando solo la punta toca el suelo se mantiene centrado con buena resistencia, y si la base plana entra en contacto gira ligeramente alrededor del centro. Pero su erratismo hace dificil ver esas cualidades en accion. Es un experimento interesante que muestra las posibilidades del sistema: caotica, inestable y poco consistente, pero capaz de momentos impredecibles y espectaculares, al estilo 'Rock Lee borracho'. Divertida para quienes disfrutan probar cosas diferentes.",
    tier: "C",
  },

  // --- BALANCE ---
  {
    name: "Taper",
    category: "balance",
    weight: "2.2g",
    description:
      "Bit que fusiona Ball y Flat: un anillo plano de 4mm de diametro (2mm mas estrecho que Rush) seguido de un corte diagonal cilindrico que imita el soporte defensivo de Ball al inclinarse. El anillo plano da movimiento semiagresivo de control moderado, menos agresivo que Rush pero con mejor resistencia. Cuando la parte cilindrica toca el suelo tiende a desviarse hacia los extremos, lo que puede aprovecharse en ataque rafaga o defensa evasiva. Tiene tubo ancho para mayor aguante a estallar. Cumple perfectamente su rol de equilibrio versatil.",
    details:
      "Con fuerza de lanzamiento controlada se mantiene consistente en el centro, ideal para ataque rafaga con blades que no dependen de golpes explosivos sino de mas oportunidades para acertar un golpe critico. Tambien funciona en defensa evasiva moviendose alrededor del stadium con buena resistencia y posibilidad de contraatacar. No sobresale en ninguna categoria por separado, pero su adaptabilidad la convierte en excelente opcion para blades y bladers que les gusta adaptarse a mas de una situacion. Comparada con Unite, Taper es ligeramente mas agresiva por su corte diagonal que genera cambios de direccion mas bruscos.",
    tier: "A",
  },
  {
    name: "High Taper",
    category: "balance",
    weight: "2.3g",
    description:
      "Identica a Taper en forma (mismo anillo plano de 4mm y corte diagonal cilindrico) pero 1mm mas alta. Conserva todas las cualidades de Taper con la diferencia de que la mayor altura eleva el centro de gravedad, facilitando el uso de la parte media y baja del Blade. Esa elevacion la hace ligeramente mas facil de noquear, aunque sin impacto preocupante en la practica. Si queres aprovechar la parte superior del Blade para golpes bajos, usa Taper normal. Si buscas aplastar y desgastar con la parte media-baja, High Taper es tu opcion.",
    details:
      "Es el unico caso donde se respeta completamente la forma de la variante original y literalmente solo cambia la altura. Su agresividad, resistencia y soporte defensivo son identicos a Taper. La eleccion depende unicamente de que parte del Blade queres usar como punto de contacto principal. Igual de versatil para atacar a largo plazo, defender alrededor del stadium y mantener buena resistencia. Tiene tubo ancho para mayor aguante a estallar, como todos los Bits de equilibrio (excepto Elevate).",
    tier: "A",
  },
  {
    name: "Unite",
    category: "balance",
    weight: "2.1g",
    description:
      "Punta compuesta por una base redonda cortada arriba para formar un aro plano con un punto central que en la practica no toca el suelo. Se comporta como Taper pero con movimientos mas suaves y precisos: su aro mas pequeno y contorno completamente redondeado elimina los cambios bruscos del corte diagonal de Taper. Ofrece un movimiento central mas consistente, mejor control durante ataques prolongados, y un excelente balance entre agresividad, evasion y resistencia. Quizas la punta de equilibrio mas completa del sistema.",
    details:
      "A diferencia de Taper cuyo corte diagonal genera cambios de direccion, los bordes redondeados de Unite permiten inclinarse mas suavemente, lo que puede aprovecharse en upper attack y soporte defensivo. Su aro mas suave reduce la fuerza de impacto comparado con Taper, haciendola menos agresiva pero de mejor resistencia. Es util en ataque a mediano y largo plazo, defensa evasiva, y tiene gran stamina. Sumamente versatil, consistente y responsiva a la inclinacion. Un detalle: su hueco interior acumula suciedad facilmente, lo que puede afectar el tiempo de giro si no la limpias regularmente. Tiene tubo ancho para mayor aguante a estallar.",
    tier: "S",
  },
  {
    name: "Kick",
    category: "balance",
    weight: "2.2g",
    description:
      "Variante de Taper con anillo plano de 4mm extendido en circunferencia hexagonal. Las aristas del hexagono pueden 'patear' contra el suelo y los rieles generando impulsos sorpresivos, mientras el anillo plano da movimiento semiagresivo como Taper pero con mas traccion, aceleracion y fuerza de impacto al inclinarse. Excelente para blades pesados y agresivos con buena resistencia que buscan multiples impactos erraticos y constantes en vez de un solo golpe decisivo. Para movimiento mas controlado Unite es mejor, pero si queres un descontrol moderado sin sacrificar demasiada stamina, Kick es ideal.",
    details:
      "Permite jugar con la fuerza del lanzamiento para provocar distintos efectos: desde movimientos controlados hasta choques caoticos o directo al Xtreme Dash. Funciona mejor con blades que tienen puntos de contacto distribuidos por toda su estructura, porque cada contacto con el suelo o el rival es significativo. Comparada con Taper, ofrece mas dinamismo y potencia pero menos consistencia. Comparada con Unite, tiene mas agresividad pero menor resistencia. Taper queda como punto intermedio entre ambas. Tiene tubo ancho para mayor aguante a estallar. Una punta divertida, versatil y sorprendente con potencial competitivo real.",
    tier: "A",
  },
  {
    name: "Trans Kick",
    category: "balance",
    weight: "2.3g",
    description:
      "Variante de Kick con el mismo hexagono pero ligeramente mas pequeno, y un sistema de flechas que ajusta la altura en dos modos: High (1mm mas alto) y Low (1mm mas bajo que estandar). En modo High puede cambiar automaticamente a Low durante la batalla tras un Xtreme Dash o impactos fuertes, amplificando movimiento erratico e impulsos impredecibles. En modo Low se comporta con mayor consistencia y control. Menos competitiva que Kick por la inconsistencia del cambio de modo, pero perfecta para quienes disfrutan del caos controlado.",
    details:
      "En modo High permite aprovechar la parte inferior del Blade, y al descender a Low usa la parte superior, cambiando los puntos de contacto a mitad de batalla. La forma ovalada superior contribuye a intensa inestabilidad, provocando rebotes pero tambien aumentando el riesgo de estallidos si se atora. Tiende a acortar las batallas por el dano que inflige y la energia que consume, funcionando mejor con estrategias ofensivas rapidas. Tiene diametro menor que Kick, asi que la velocidad es mas baja. Ideal para blades pesados y agresivos que puedan golpear con todo el cuerpo desde diferentes alturas.",
    tier: "B",
  },
  {
    name: "Point",
    category: "balance",
    weight: "2.2g",
    description:
      "Punto central pequeno rodeado por base plana del ancho de Flat. Si el punto toca el suelo, se queda estatico al centro con excelente resistencia. Si la base plana entra en juego, se vuelve agresivo tomando incluso el riel para Xtreme Dash antes de volver al centro. Ofrece excelente resistencia estacionaria, soporte defensivo con la parte plana, y gran potencial de contraataque. A diferencia de Taper/Unite que mantienen movimiento constante, Point tiene dos comportamientos extremos: completamente quieta o completamente agresiva, sin termino medio.",
    details:
      "Es una punta de equilibrio indispensable por su versatilidad y capacidad de alternar entre resistencia y agresividad segun la situacion. Blades con gran resistencia y siluetas con potencial agresivo le sacan gran provecho al poder esperar el impacto y luego contraatacar con fuerza. Blades de ataque puro como DranBuster no la aprovechan porque su estilo pausado reduce el ritmo ofensivo que necesitan. Las versiones mas recientes tienen un punto central mas expuesto que mejora la resistencia general pero reduce la frecuencia de contraataques. Lo que la hace impredecible pero dentro de un gran margen de seguridad al no ser propensa a autosacarse. Tiene tubo ancho para mayor aguante a estallar.",
    tier: "S",
  },
  {
    name: "Gear Point",
    category: "balance",
    weight: "2.3g",
    description:
      "Version mas agresiva de Point con punta plana en forma de engrane de 12 dientes que llegan hasta el suelo, facilitando tomar el Xtreme Dash y dandole mayor agresividad que Point original. Su circunferencia mas amplia y forma dentada genera mas friccion y poder de impacto especialmente en contraataques, haciendola mas dificil de empujar y sacar. Pero esa friccion incrementa el consumo de energia, reduciendo su resistencia total. Si buscas seguridad y control, Point es la opcion; si preferis potencia de contraataque, Gear Point puede hacer buena diferencia, especialmente en blades livianos.",
    details:
      "Despues de recibir un golpe o al hacer contacto con la parte plana, tiende a mantenerse girando alrededor del stadium, util para esquivar ataques posteriores usando el desplazamiento como defensa evasiva. Golpea con mas fuerza y es mas dificil de noquear que Point, pero se agota antes. Es ideal para beys ligeros o estrategias ofensivas que buscan compensar la falta de peso con impactos mas fuertes. La eleccion entre ambas depende del estilo: Point para control y resistencia, Gear Point para traccion y potencia en contraataques. Tiene tubo ancho para mayor aguante a estallar.",
    tier: "A",
  },
  {
    name: "Trans Point",
    category: "balance",
    weight: "2.2g",
    description:
      "Variante de Point con la misma forma base pero 1mm menor en diametro y un sistema de flechas para ajustar altura: modo High (1mm mas alto que Point) y modo Low (1mm mas bajo). En combate puede cambiar automaticamente de High a Low tras Xtreme Dash o impactos fuertes. Su diametro reducido da menor aceleracion y agresividad con movimientos mas controlados. El cambio de altura es interesante para golpear con diferentes partes del Blade, pero la rotacion en pleno combate genera desequilibrio, tambaleos y movimientos erraticos.",
    details:
      "Si la dejas en modo Low desde el inicio, se mantiene mayormente en su posicion con mayor consistencia y control, ademas de mejorar la estabilidad al ser tan baja. La forma de ovalo en la parte superior es propensa a rebotar con los rieles, haciendola impredecible y facil de estallar si se atora. Blades pesados que busquen contraataques erraticos y cuya forma tenga potencial por arriba y por abajo pueden sacarle provecho. No tiene la consistencia de Point original, pero esa es su intencion: es una idea noble con muchos riesgos, divertida para quienes disfrutan la imprevisibilidad.",
    tier: "B",
  },
  {
    name: "Hexa",
    category: "balance",
    weight: "2.6g",
    description:
      "Punta afilada ancha en forma hexagonal cuyas seis aristas empujan al bey hacia arriba al rozar el suelo, ayudandolo a recuperar postura erguida rapidamente. Casi no se inclina y tiende a volver al centro con gran estabilidad. Las aristas dan mayor traccion, frenando desplazamientos bruscos y reforzando la defensa, especialmente al ser tan ancha y de tubo ancho. Defensivamente es espectacular, y como termina en punta afilada consigue un destacable tiempo de giro. Te permite lanzar a maxima potencia sin riesgo a que se descontrole. La Wide Defense de Beyblade X.",
    details:
      "Su mayor problema es su gran engrane de 16 dientes: si hace Xtreme Dash gasta mucha energia e incluso podria alocarse tanto que se mande sola a volar, aunque en el mejor caso puede servir para contraatacar. Para un bey defensivo que busca conservar energia, estos roces con el riel pueden costar la batalla, y en beys ligeros salen volando aun mas facilmente. Las primeras versiones tenian una ligera curva hacia adentro en una arista que provocaba rebotes, pero se corrigio en lanzamientos posteriores. Es como la Wide Defense de Metal Fight: excelente defensa a caidas, gran aguante a estallar, esplendida estabilidad y muy buena resistencia. Pieza indispensable para tu arsenal.",
    tier: "S",
  },
  {
    name: "Elevate",
    category: "balance",
    weight: "3.3g",
    description:
      "Punta de tres niveles (puntita plana, ancho de Flat, engranes de 12 dientes abiertos) con un amplio disco inclinado arriba. Su movimiento varia segun que parte toque el suelo, generando desplazamiento sutil o mas agresivo pero sin alcanzar la velocidad de Flat. Los engranes abiertos y el disco dificultan tomar el riel, evitando Xtreme Dash y manteniendola estable y controlada. Tiene tubo delgado (la unica de equilibrio), haciendola mas facil de estallar. Donde realmente destaca es en la ecualizacion de energia: CobaltDragoon es el que mas provecho le saca para contrarrestar a WizardRod.",
    details:
      "El disco suavizado y la base ancha lisa le otorgan excelente vida despues de muerte, siendo una de las pocas puntas que realmente tiene esa capacidad. Su movimiento semiagresivo es consistente y controlado, ideal para ataques prolongados pero tambien util en defensa evasiva. El disco y engranes pueden detener el empuje de impactos y ayudar a recuperar postura erguida rapidamente. Contra beys del mismo sentido de giro, Unite es mas fiable por el tubo ancho. Pero en giro opuesto, Elevate es insuperable para ecualizar y drenar la energia del rival. Curiosamente fue concebida como punta de ataque (tubo ancho, punta plana, disco hexagonal) pero se redefinio como equilibrio en el producto final.",
    tier: "S",
  },
  {
    name: "Zap",
    category: "balance",
    weight: "2.6g",
    description:
      "Variante de Point con mayor diametro (8mm), engrane ancho de 16 dientes y 1mm mas baja. Su funcionamiento es el mismo: estable al centro con la punta, agresiva cuando el anillo toca el suelo. Pero gracias al mayor diametro y engrane, alcanza velocidades superiores con Xtreme Dash mas potentes e impactos mucho mas fuertes. Ese rendimiento se paga con alto consumo de energia, menor resistencia y mayor riesgo de salirse sola. Es la version mas salvaje de Point: impredecible, rapida y contundente. Su eleccion sobre Point queda a gusto personal.",
    details:
      "Tenes que ser mas cuidadoso con el lanzamiento porque se descontrola mas facil, usar maxima potencia puede ser peligroso al ser dificil mantenerla al centro al inicio. Al ser mas baja puede aprovechar mas la parte media superior de los Blades, pero su mayor agresividad hace dificil percibir la mejora de estabilidad. Es ideal para contraataque explosivo donde basten pocos impactos decisivos. Funciona mejor en blades pesados y agresivos ya que el peso controla la velocidad y evita autosalidas. Comparada con Gear Point que es mas estable y consistente, Zap prioriza la aceleracion extrema y potencia bruta. Perfecta para bladers que prefieren el riesgo total y finales rapidos.",
    tier: "B",
  },
  {
    name: "Merge",
    category: "balance",
    weight: "3.4g",
    description:
      "Punta afilada de plastico rodeada por una base plana de goma con dos salientes rectangulares tambien de goma, 4mm mas alta que el estandar y con el engrane mas grande del sistema (18 dientes). En teoria mantiene estabilidad con la punta y activa aceleraciones con la goma al inclinarse, pero en la practica la goma actua mas como ancla que como impulsor: se adhiere al stadium frenando en vez de acelerar. Las secciones rectangulares son excelentes para evitar salidas laterales, pero la altura excesiva la vuelve sumamente inestable.",
    details:
      "Si el rival golpea desde abajo, el bey se eleva y la goma pierde contacto con el suelo, anulando todo el potencial defensivo. Los roces de la goma y del engrane al hacer Xtreme Dash consumen muchisima energia, haciendo su defensa y resistencia bastante inconsistentes. Con la altura estandar habria sido una pieza excepcional comparable a Coat Sharp de Metal, pero tal como esta no es ni la sombra de lo que pudo ser. Si a pesar de los riesgos seguis vivo, la goma da soporte para impactos potentes, util en blades pesados y de ataque aplastante. Es una idea brillante mal ejecutada: combina potencia, defensa y agarre, pero su altura extrema la deja fuera del competitivo.",
    tier: "C",
  },
  {
    name: "Operate",
    category: "balance",
    weight: "14g",
    description:
      "Bit fusionado con Ratchet (engrane de 14 dientes) que puede cambiar entre dos modos rotando su capa inferior 90 grados. Modo Defensa (altura 80): punta redonda POM con movimiento tranquilo y buena inclinacion similar a Orb pero menor resistencia. Modo Ataque (altura 85): punta plana hueca tipo Rush con forma ovalada, completamente agresiva y caotica. Su ensamble tipo Simple es muy propenso a estallar. Donde brilla es en su excelente vida despues de muerte: su parte inferior es la mas suave hasta ahora en Ratchets, patinadose en los giros finales.",
    details:
      "En modo defensa la punta POM es muy pequena y suave, facil de empujar con un centro de gravedad tan alto, conviene iniciar inclinada para mitigar el riesgo de salida. En modo ataque los topes inferiores rebotan con el suelo rompiendo patrones y el engrane amplio da acelerones fuertes en el riel, muy dificil de controlar. Su pendiente ovalada puede levantar al rival o aplastar segun la direccion, pero el contacto directo es mucho riesgo a estallido. En batallas de giro opuesto puede ser opcion consistente y poderosa para ecualizacion con menor riesgo a estallar que Turbo, aunque se inclina mas en los giros finales. Comparte mucho de Xtend de Burst pero no brilla igual por las desventajas de su estructura.",
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
        "Beyblade X es la nueva generacion del juego, tambien llamada Xtreme Gear Sport System (XGS), y cambio todo lo que conocias del Beyblade: mas velocidad, mas intensidad y un sistema tan especial que convierte cada batalla en una tormenta de energia. Cada bey tiene tres piezas intercambiables: el Blade (la pieza de metal que define la forma, el peso y el estilo de combate), el Ratchet (la capa intermedia que da altura, peso extra y estabilidad) y el Bit (la punta que toca el suelo y define completamente el movimiento). El secreto del sistema es que los Bits son engranes que se enganchan al Riel X del stadium, convirtiendo la rotacion del bey en un impulso brutal llamado Xtreme Dash: si parpadeas te lo perdes. Hay cuatro formas de ganar: Spin Finish (1 punto al que gire mas tiempo), Over Finish (2 puntos si mandas al rival a las trampas), Burst Finish (2 puntos si lo desarmaste) y Xtreme Finish (3 puntos si lo sacaste por la zona Xtreme del riel). Existen tres lineas de Blades: BX (basica, mayormente metal), UX (unica, con habilidades especiales por Blade) y CX (custom, separable en tres piezas para personalizacion total). Las piezas de las tres lineas son completamente compatibles entre si, asi que podes mezclar todo. Tanto Takara Tomy como Hasbro distribuyen los beys y son intercambiables, asi que no importa que marca tengas, todo funciona junto. El objetivo final es armar el combo que mejor refleje tu estilo, dominarlo con practica y llevarlo al estadio con intencion.",
    },
    {
      title: "La fisica del giro",
      content:
        "Tu bey se mantiene de pie gracias al momento angular, un poder que gana al girar y que lo obliga a resistir la gravedad mientras tenga suficiente energia. Ese momento angular depende de tres factores: la velocidad de tu lanzamiento (tu poder directo), el peso del bey y como esta distribuido ese peso. La velocidad inicial depende completamente de vos: pensa en un latigazo rapido, fluido y preciso, porque un jalon brusco y tenso suele ser menos potente que uno con tecnica. La inercia es la resistencia de tu bey a cambiar lo que ya esta haciendo: un bey pesado es mas dificil de empujar, resiste mejor los golpes y se mantiene girando mas tiempo, como un carrito de supermercado lleno que tarda mas en frenarse. Pero la clave no esta solo en cuanto pesa sino en donde esta ese peso: peso al centro (como GolemRock) da estabilidad pero sacrifica tiempo de giro, peso a los extremos (como WizardRod) aumenta el momento angular y la potencia de impacto, peso asimetrico (como DranBuster) pega durisimo pero se detiene mas rapido, y peso equitativo (como LeonClaw) da un rendimiento parejo. Para saber como se distribuye el peso, observa el diametro del Blade (mas amplio reparte peso a los extremos), su forma (huecos al centro mandan peso afuera) y especialmente la parte inferior, donde suelen esconderse contrapesos y huecos que alteran todo el desempeno. Incluso dos Blades identicos pueden tener diferencias de balance porque las particulas del metal no siempre se distribuyen igual a nivel microscopico durante la fabricacion. Dominando estos tres fundamentos ya diste tu primer gran paso para convertirte en un blader de otro nivel.",
    },
    {
      title: "El Balance Perfecto",
      content:
        "Este es el truco que lo cambia todo y es completamente gratis: rotar el Ratchet 180 grados altera totalmente la distribucion del peso de tu combo, y una de las dos posiciones siempre va a dar mejor estabilidad que la otra. Para encontrarlo, arma tu bey con una punta de resistencia como Orb o Ball, lanzalo y cronometra cuanto gira, observando si vibra o se mantiene quieto. Despues desmonta el Ratchet, giralo 180 grados y volve a probar: la posicion donde tu bey gire mas tiempo y se quede mas tranquilo es tu Balance Perfecto. Es como balancear una llanta de auto: a simple vista parece redonda, pero los talleres le ponen contrapesos diminutos para que gire perfecto, y con el Ratchet estamos buscando esa misma alineacion ideal. Probalo tambien con diferentes versiones del mismo Ratchet, porque aunque sea 'la misma pieza', las variaciones de molde hacen que algunos den mejor balance que otros, y podes encontrar una joya que potencie aun mas tu bey. Pro Tip importantisimo: repeti estas pruebas cada cierto tiempo, porque con los golpes los Blades se deforman y pierden balance, asi que lo que antes te funcionaba perfecto puede dejar de dar el mismo resultado por el desgaste natural. La estabilidad y el centro de gravedad van de la mano: un bey bajo es como un auto de Formula 1 (dificil de volcar y con mucho control) mientras que uno alto es como una torre de Jenga (facil de derrumbar). No subestimes tampoco la precesion, ese tambaleo final cuando tu bey se queda sin energia: un bey bien balanceado, con puntas amplias y centro de gravedad bajo, puede sumar esos segundos extra que definen la victoria. Incluso podes usar el truco al reves: si queres un bey erratico que golpee por sorpresa, exagera el desequilibrio a proposito.",
    },
    {
      title: "Enemigos invisibles",
      content:
        "En el stadium hay mas rivales que el blader de enfrente: fuerzas silenciosas que afectan a tu bey todo el tiempo y le impiden girar eternamente. La friccion es el ladron de energia principal, aparece cada vez que dos cosas se rozan, y en Beyblade todo esta rozando: la punta contra el suelo, el bey contra el aire, los impactos contra otros beys. El material de la punta define cuanta friccion genera: goma tiene altisima friccion (se agarra al suelo pero dura menos girando), metal y POM tienen baja friccion (resisten mas tiempo pero se deslizan facil) y plastico queda en un punto medio. La traccion es el hermano de la friccion pero trabaja al reves: es lo que te da agarre para moverte con potencia y control, como la diferencia entre llantas lisas y llantas con dibujo. Mucha traccion (como puntas de goma o con relieves tipo Vortex o Rubber Accel) da aceleracion y fuerza de golpe pero sacrifica resistencia, mientras que poca traccion (puntas lisas o metalicas) te deja girar mas tiempo a costa de menos control. Por ejemplo, Flat tiene menor traccion que Vortex porque su circunferencia es lisa, y Needle es una punta suave mientras que Dot tiene rugosidades que aumentan su agarre. La aerodinamica tambien influye aunque no lo notes: un Blade delgado y afilado corta el aire mas facil y gira mas tiempo, mientras que uno ancho y grueso se frena mas rapido, como llevar una cartulina en medio del viento. Si tu Blade tiene pendientes inclinadas en la direccion de giro generan downforce (lo empujan al suelo como un aleron), y si van en sentido contrario generan lift (lo levantan como un ala de avion, mas rapido pero mas facil de noquear). Entender estas fuerzas hace que tus combos tengan intencion y no sean armados al azar.",
    },
    {
      title: "La ciencia de los choques",
      content:
        "El choque es el alma del Beyblade, y cada impacto afecta a tu bey de dos formas: se mueve de lugar (traslacion) y cambia su velocidad de giro (rotacion). Cuando dos beys giran en el mismo sentido y chocan, ambos se empujan con mucha fuerza y salen disparados con facilidad, perdiendose energia mutuamente con cada golpe. Cuando se enfrentan beys de giro opuesto (derecho vs izquierdo), la cosa cambia completamente: ecualizan giro, el mas rapido le transfiere energia al mas lento y las batallas se alargan porque no frenan su rotacion sino que se impulsan mutuamente. El retroceso depende directamente de la forma del Blade: formas picudas como SharkEdge causan gran dano pero sufren el mayor retroceso (y son las mejores para estallar Ratchets), paredes planas como PhoenixWing empujan al cubrir mas espacio, pendientes como DranBrave levantan al rival para mandarlo a volar, e irregularidades como WhaleWave desestabilizan a los rivales aplastando o levantando segun donde esten sus ondulaciones. Las formas redondeadas como WizardRod son de bajo retroceso: amortiguan y desvian los golpes, pierden menos energia y se vuelven muy temibles cuando estan pesadas y bien balanceadas. El material del punto de contacto tambien importa: metal da impactos solidos y brutales, plastico amortigua pero se deforma rapido, y goma frena muchisimo con altisima friccion y requiere buen peso para compensar. La fuerza del impacto sigue la formula Fuerza = Masa x Aceleracion, lo que significa que hasta un bey ligero puede pegarle mas fuerte a uno pesado si tiene suficiente aceleracion via lanzamiento rapido, punta ancha o engrane grande del Xtreme Dash. Pero tene presente que en cada choque, un solo punto del Blade hace contacto y eso esta completamente fuera de tu control, asi que no hay dos batallas iguales.",
    },
    {
      title: "Tipos de combos",
      content:
        "En Beyblade X las fronteras entre ataque, defensa y resistencia ya no son tan claras, porque el Xtreme Dash puede volver agresivo hasta al combo mas defensivo, asi que aca clasificamos por tendencia de movimiento. Los Agresivos son los mas explosivos: estan disenados para terminar rapido con pocos impactos pero contundentes, buscando sacar al rival, hacerlo estallar o lograr Xtreme Finish, pero gastan mucha energia en cada golpe y necesitan Blades irregulares con peso medio-alto mas puntas de mucho movimiento como Rush o Flat. Los Estacionarios permanecen tranquilos donde caen: pueden esperar al rival para contraatacar o evadir levemente, buscan resistir hasta el final y lograr mayor tiempo de giro, usando puntas redondas (Orb, Ball) para resistencia, afiladas (Needle) para defensa o intermedias (Hexa) para ambas cualidades. Los Semiagresivos son hibridos que buscan la victoria a mediano plazo con impactos constantes pero controlados, su versatilidad les permite adaptarse y no son tan alocados como un agresivo ni tan pasivos como un estacionario, ideales con puntas como Taper o Unite. Los Counter cambian radicalmente entre estacionarios y agresivos especializandose en contraatacar: pueden empezar muy agresivos y de repente detenerse, o iniciar estaticos y volverse caoticos en medio de la batalla, aprovechando Bits como Point que ajustan el movimiento segun como los lances. Dentro de cada tipo hay estilos especificos: Upper Attack (golpear desde abajo para levantar), Smash Attack (impactos frontales contundentes), Barrage Attack (desgaste con lluvia de roces), Counter Attack (devolver golpes con mas fuerza), Defensa Escudo (usar inclinacion para desviar ataques) y Tanque (soportar todo como muralla al centro). Un mismo Blade puede tener mas de un estilo de combate a la vez.",
    },
    {
      title: "Como armar tu combo paso a paso",
      content:
        "Paso 1 - Elegi y observa tu Blade: empieza con uno que te guste y con el que sientas conexion, no te obsesiones con si es Meta o no, a todos se les puede sacar provecho. Pesalo si podes (menos de 30g es desventaja extrema, 33-35g es promedio, mas de 39g es hiperventaja) y observa su diametro, grosor, distribucion de peso y silueta por arriba, abajo y los lados para imaginar como se va a comportar. Paso 2 - Plantea una hipotesis: analiza que puntos de diseno tiene a favor, cuales en contra, si su forma es irregular o suave, si conviene alturas bajas o altas, si su retroceso es compensado por su peso, y defini dos o tres estilos de combate viables para empezar a probar. Paso 3 - Elegi el Bit: el Bit define el alma del movimiento, empeza con la opcion mas neutral de tu estilo (Rush para agresivo, Ball para estacionario, Taper o Unite para semiagresivo, Point para counter) y despues ajusta traccion, movimiento, control o resistencia segun necesites. Paso 4 - Elegi el Ratchet: define altura, balance, estabilidad y riesgo de estallar, busca la altura que beneficie los puntos de contacto de tu Blade y alinea los salientes del Ratchet con los del Blade para potenciar los impactos. El 9 es el mas neutral y seguro para empezar, el 7 es el estabilizador que baja el centro de gravedad, el 1 es el balanceador que corrige beys inestables con su contrapeso asimetrico. Paso 5 - Proba, experimenta e itera: lanzalo en el stadium real, pero antes de cambiar piezas proba distintos angulos, inclinaciones y fuerzas de lanzamiento, porque muchas veces el problema no es el combo sino como lo lanzas. No existe el combo perfecto ni uno que gane siempre: lo importante es que entiendas que buscas lograr con cada armado y que tus elecciones tengan intencion.",
    },
    {
      title: "Lanzamiento y mentalidad",
      content:
        "El lanzamiento es tu unico input real en la batalla y quiza lo mas dificil de dominar: aunque traigas el mejor combo del planeta, si no sabes como lanzarlo lo vas a desperdiciar. Pensa en un latigazo: rapido, fluido y preciso, porque tensar todo el cuerpo queriendo jalar con mucha fuerza resulta en un lanzamiento brusco, impreciso y a veces hasta menos potente. Tu posicion importa: cuanto mas abajo lances menos rebote tendras y mayor estabilidad inicial, y la inclinacion del lanzador direcciona la salida del bey, pudiendo forzar un ataque inmediato, una evasion o quedarte al centro. Antes de lanzar hace una lectura express: mira la punta del rival para anticipar como se va a mover, fijate en su postura de lanzamiento para sacar pistas, conoce las salidas de tu lado del stadium y se consciente de las fortalezas y limites de tu propio bey. Calenta antes de jugar girando hombros y estirando brazos, porque las lesiones por malos habitos repetidos son reales, y busca una postura comoda donde tu brazo se mueva libre sin forzar articulaciones. Ahora la verdad mas dura: por mas que domines todo lo anterior, nunca vas a tener el control total de la batalla porque el Beyblade es un juego de probabilidades donde todos los beys tienen la posibilidad de ganar pero las chances varian. La diferencia entre un novato y un pro es que el novato lanza al azar mientras que el pro busca aumentar conscientemente sus probabilidades a favor, controlando lo que puede controlar: su combo, su lanzamiento y su estrategia. No te frustres si perdes, porque la consistencia gana mas torneos que la racha perfecta: cada derrota es informacion sobre que podes cambiar. Y recordar siempre el Espiritu Blader: esa energia invisible que transforma cada batalla, la diferencia entre jugar con miedo o con pasion, entre frustrarte con cada derrota o aprender de ella, porque al final la diferencia entre ganar y perder siempre sera tu Espiritu Blader.",
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
