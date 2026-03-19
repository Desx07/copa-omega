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
      "WizardRod es la pieza mas completa que existe hoy. Con 35.2g tiene peso suficiente para aguantar golpes, y su forma redondeada con bordes suavizados minimiza la friccion en cada contacto, dandole una stamina que solo CobaltDragoon supera. Lo que lo hace especial es que funciona en CUALQUIER estilo: con Ball se vuelve un muro estacionario que gira eternamente, con Rush se transforma en un atacante sorpresivo, y con Unite o Point es un semiagresivo letal. En nuestros tests, WizardRod 1-60 Hexa fue consistentemente uno de los combos mas dificiles de vencer, apareciendo como ganador repetidamente contra el top del meta. El Ratchet 9 le queda perfecto porque no interfiere con su forma lisa, y el 1 le da un contrapeso que mejora aun mas su ya excelente stamina. Si tenes que elegir un solo blade para competir, este es.",
    bestCombos: [
      "1-60 Hexa (estacionario dominante, consistentemente ganador en tests contra todo el meta)",
      "9-60 Ball (stamina maxima sin riesgo, el ratchet 9 no interfiere con su forma suave)",
      "9-60 Unite (semiagresivo inteligente, se adapta a cualquier rival sin perder stamina)",
    ],
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
      "PhoenixWing combina peso solido con formas de impacto que cubren todos los angulos: smash frontal directo, upper attack desde abajo cuando esta inclinado, y downforce que aplasta desde arriba. Lo que lo hace realmente especial es su capacidad de counter: cuando el rival lo golpea, devuelve el impacto multiplicado gracias a su masa concentrada en los puntos de contacto. Con 7-70 Point fue uno de los combos mas temidos en nuestros tests, apareciendo consistentemente como ganador contra blades de todos los tiers. El Ratchet 7 le queda ideal porque su peso extra (7.2g en 7-70) baja el centro de gravedad y potencia aun mas su smash. Tambien funciona increible con 9 para maxima libertad de movimiento. Un blade para jugadores que quieren pegar fuerte sin perder el control.",
    bestCombos: [
      "7-70 Point (counter letal, consistentemente dominante en tests contra todo el meta)",
      "9-60 High Needle (defensa estacionaria con smash natural, el 9 le da libertad total)",
      "7-60 Ball (tanque con stamina, el ratchet 7 baja su centro de gravedad para maxima estabilidad)",
    ],
    tier: "A",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "CobaltDrake",
    weight: "38.1g",
    type: "defense",
    description:
      "El blade mas pesado del juego. Paredes que reflejan ataques con gran potencial de counter. Raro y codiciado.",
    details:
      "CobaltDrake es el rey absoluto del peso con 38.1g, lo que lo hace practicamente inamovible en el stadium. Sus paredes altas y anchas actuan como escudos que reflejan los ataques rivales con una fuerza brutal: cuanto mas fuerte te pegan, mas fuerte devuelve el golpe. Esa mecanica de counter natural lo convierte en la pesadilla de cualquier atacante agresivo. El Ratchet 9 es perfecto porque no interfiere con sus paredes y le da maxima estabilidad, mientras que el 7 aporta aun mas peso para un combo que supera los 47g totales. Con Ball o Hexa plantado en el centro, el rival se desgasta intentando moverlo. Es una pieza premium, dificil de conseguir, pero si la tenes en tu arsenal cambia completamente tus opciones competitivas.",
    bestCombos: [
      "9-60 Ball (muro inamovible, el 9 no interfiere y Ball le da stamina infinita)",
      "7-60 Hexa (defensa maxima, el 7 suma peso para superar 47g totales de combo)",
      "9-60 Unite (counter semiagresivo, devuelve golpes con la fuerza de sus 38.1g)",
    ],
    tier: "A",
    imageUrl: STORAGE_BASE + "/guia_p03.png",
  },
  {
    name: "SharkScale",
    weight: "",
    type: "attack",
    description:
      "Bajo y estable, excelente para ataque consistente. Opuesto a WhaleWave en estilo. Tambien conocido como SharkScale.",
    details:
      "SharkScale es el atacante mas consistente y confiable del juego. Su perfil ultra bajo le da una estabilidad natural que otros atacantes no tienen, y sus filos afilados concentran el impacto en puntos precisos que maximizan el dano por golpe. En nuestros tests, SharkScale 3-60 Low Rush fue uno de los combos mas dominantes del meta, apareciendo como ganador contra practicamente todo lo que se le puso enfrente. El Ratchet 3 le queda excelente porque su bajo retroceso complementa el perfil bajo del blade sin riesgo de estallar, y con Low Rush activa el Xtreme Dash con una precision quirurgica. Tambien funciona increible con 9-60 Rush para un ataque mas controlado. Es el blade que elegis cuando queres ganar por KO de forma consistente, no por suerte.",
    bestCombos: [
      "3-60 Low Rush (ataque dominante, consistentemente ganador en tests contra todo el meta)",
      "9-60 Rush (ataque controlado, el ratchet 9 le da maxima libertad sin riesgo)",
      "4-55 Low Rush (perfil ultra bajo, el tipo O del 4-55 aprieta mejor para combos agresivos)",
    ],
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
      "CobaltDragoon gira en sentido contrario al resto (left-spin), y eso cambia completamente la mecanica de cada batalla. Cuando un blade right-spin lo golpea, en vez de rebotar, CobaltDragoon absorbe y ecualiza esa energia: el rival pierde velocidad mientras Dragoon mantiene la suya. Combinado con Elevate (3.3g, el bit mas pesado del juego), se convierte en una trampa mortal con excelente 'vida despues de la muerte', es decir, sigue girando incluso cuando parece que ya freno. En nuestros tests, CobaltDragoon 9-60 Elevate fue consistentemente dominante, ganando por Spin Finish contra casi todo el meta. El Ratchet 9 es la mejor opcion porque su suavidad total evita cualquier interferencia con la ecualizacion. Sus 37.8g lo hacen el segundo blade mas pesado del juego. El blade que redefinio la meta competitiva.",
    bestCombos: [
      "9-60 Elevate (ecualizacion maxima, dominante en tests contra todo el meta por SF)",
      "4-60 Elevate (opcion alternativa, el 4 blanco de DranDagger traba fuerte y evita bursts)",
      "5-60 Point (counter left-spin, Point se vuelve agresivo al inclinarse aprovechando el giro inverso)",
    ],
    tier: "A",
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
      "DranSword es el blade con el que muchos empiezan y con razon: con 35.4g es sorprendentemente pesado para un atacante, y su recoil moderado significa que no se descontrola al pegar. Tiene un balance natural entre ataque y stamina que pocos blades logran, lo que le permite funcionar con casi cualquier combo. Sus formas de impacto son limpias y predecibles, ideales para aprender a leer las batallas. El Ratchet 3 complementa bien su estilo porque el bajo retroceso del ratchet no suma al recoil del blade, y Rush le da ataques controlados con buen Xtreme Dash. Funciona tanto para tu primer torneo como para el centesimo. Es el blade mas honesto del juego.",
    bestCombos: [
      "3-60 Rush (ataque controlado, el bajo retroceso del 3 complementa su recoil moderado)",
      "9-60 Ball (stamina sorpresiva, aprovecha sus 35.4g para ganar por desgaste)",
      "5-60 Flat (ataque potente, el peso del 5 suma inercia a sus golpes)",
    ],
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
      "HellsScythe te deja elegir el estilo en el momento del lanzamiento: fuerte y central se comporta como defensivo, inclinado y al borde se vuelve un atacante agresivo. Su forma de guadana genera un desgaste continuo con cada contacto, drenando la energia del rival sin perder demasiada propia. En nuestros tests, HellsScythe 1-70 Kick fue el combo con mejor rendimiento absoluto: 7 victorias y 3 derrotas contra el top del meta, incluyendo KOs contra EmperorBlast y ScorpioSpear y un BF contra GolemRock. El Ratchet 1-70 es clave porque es la version mas pesada (7.3g) y funciona como contrapeso perfecto para compensar la ligereza del blade. Con 9-60 Ball en modo estacionario tambien rinde bien. Un blade para jugadores que disfrutan adaptar su estrategia en tiempo real.",
    bestCombos: [
      "1-70 Kick (agresivo camaleonico, 7-3 en tests contra el top del meta con KOs y BFs)",
      "9-60 Ball (estacionario con stamina, el 9 no interfiere con su forma de guadana)",
      "9-60 Unite (semiagresivo adaptable, cambia de estilo segun tu lanzamiento)",
    ],
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
      "WhaleWave es el blade de alto riesgo y alta recompensa. Su forma de ola genera tres tipos de impacto al mismo tiempo: upper que levanta al rival, smash frontal que lo empuja, y downforce que lo aplasta desde arriba. Cuando conecta bien, pocos blades sobreviven. Su movimiento es naturalmente impredecible y caotico, lo que dificulta que el rival anticipe por donde viene el golpe. El Ratchet 5 le aporta peso extra y estabilidad que ayudan a compensar su caos natural, mientras que Ball le da stamina para seguir presionando despues del primer impacto. Con 9-60 Taper combina agresion semiagresiva con libertad de movimiento. Requiere practica y un buen lanzamiento para dominar, pero en manos de un blader experimentado es devastador.",
    bestCombos: [
      "5-60 Ball (potencia con estabilidad, el peso del 5 compensa su movimiento caotico)",
      "9-60 Taper (semiagresivo libre, el 9 le da maxima libertad sin interferir)",
      "7-60 Unite (control con peso, el 7 baja su centro de gravedad para mas consistencia)",
    ],
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
      "TyrannoBeat golpea con fuerza bruta pura. Sus 36.8g lo ponen entre los tres blades mas pesados del juego, y su forma genera smash potente sin importar el angulo de contacto. En nuestros tests con 7-70 Kick fue un rival formidable, ganando multiples batallas incluyendo KOs contra blades mas livianos. Funciona mejor en alturas medias (60/70) donde puede impactar la zona media del rival con maxima fuerza. El Ratchet 1 le queda bien porque su contrapeso corrige el balance de un blade tan pesado, y con Flat tiene la potencia bruta para sacar a cualquiera del stadium. Un blade directo y honesto para jugadores que prefieren la fuerza sobre la sutileza.",
    bestCombos: [
      "1-60 Flat (fuerza bruta maxima, el contrapeso del 1 corrige el balance de sus 36.8g)",
      "3-60 Rush (ataque controlado, el bajo retroceso del 3 evita que su peso lo descontrole)",
      "7-70 Kick (smash a media altura, el peso del 7 suma aun mas inercia a sus golpes)",
    ],
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
      "SamuraiSaber fue disenado especificamente para enfrentar la amenaza de CobaltDragoon y otros blades left-spin. Su forma de sable tiene angulos que desvian los golpes del giro inverso con precision, devolviendo el impacto sin perder estabilidad. Pero no es solo un counter de left-spin: funciona como un defensivo versatil que se adapta a cualquier matchup. El Ratchet 9 le da la suavidad perfecta para no interferir con sus angulos de desvio, y Ball le aporta stamina para ganar por desgaste despues de absorber los golpes. Con Hexa en 7-60 se convierte en un muro estacionario premium. Es uno de los mejores blades defensivos del formato actual, especialmente valioso en torneos donde left-spin aparece frecuentemente.",
    bestCombos: [
      "9-60 Ball (defensa versatil, el 9 no interfiere con sus angulos de counter)",
      "7-60 Hexa (muro estacionario, el 7 baja el centro de gravedad para maxima defensa)",
      "5-60 Unite (semiagresivo defensivo, los 5 segmentos complementan su forma de sable)",
    ],
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
      "SilverWolf es un blade CX que sorprende por su versatilidad. Su centro de gravedad alto le permite generar upper attack cuando se inclina, combinando defensa solida con capacidad ofensiva latente que pocos rivales esperan. Funciona como un defensivo que puede convertirse en atacante en el momento justo. Con puntas de balance como Point o Unite, alterna entre estilos segun la inclinacion del giro. El Ratchet 9 le da libertad total de movimiento sin riesgo, y Ball le aporta la stamina que necesita para aguantar hasta que aparezca el momento de contraatacar. Su mecanica CX lo hace unico y valioso como opcion tactica.",
    bestCombos: [
      "9-60 Ball (defensa con stamina, el 9 complementa su versatilidad sin interferir)",
      "5-60 Point (counter ofensivo, Point se vuelve agresivo cuando Wolf se inclina)",
      "7-60 Unite (balance pesado, el 7 compensa su centro de gravedad alto)",
    ],
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
      "GolemRock concentra mucho peso en poco espacio, lo que lo hace extremadamente estable y dificil de mover del centro del stadium. Su estilo es tanque puro: se planta y absorbe todo lo que le tiran. En nuestros tests con 3-60 Orb fue consistentemente un rival dificil, ganando por Spin Finish gracias a su excelente stamina estacionaria. El Ratchet 9 es ideal porque su suavidad total no interfiere con la forma compacta del blade, y el 3 le da buen balance con bajo retroceso. Con Ball o Hexa, se convierte en un muro que frustra a cualquier atacante. Ideal para jugadores que prefieren la solidez y la paciencia sobre la velocidad.",
    bestCombos: [
      "9-60 Ball (tanque con stamina, el 9 maximiza su estabilidad natural)",
      "3-60 Orb (stamina pura, consistentemente efectivo en tests estacionarios)",
      "7-60 Hexa (defensa maxima, el 7 suma peso extra a su perfil compacto)",
    ],
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
      "DranDagger tiene una forma compacta que concentra el impacto en pocos puntos de contacto, generando un desgaste eficiente con cada golpe. Sus 34.9g le dan buena inercia para mantener el ritmo de la batalla sin perder velocidad. Un dato clave: la version blanca de su Ratchet 4-60 suele trabarse y es mucho mas dificil de desarmar, lo que la hace especialmente viable para combos agresivos porque reduce el riesgo de estallido. Con Point se comporta como un semiagresivo inteligente que empieza estable y se vuelve agresivo al inclinarse. El Ratchet 5 complementa su forma de 5 segmentos naturalmente.",
    bestCombos: [
      "4-60 Point (su 4-60 blanco traba fuerte, Point desgasta controladamente)",
      "5-60 Point (los 5 segmentos del ratchet complementan su forma compacta)",
      "3-60 Rush (ataque con bajo retroceso, buena sinergia con su peso de 34.9g)",
    ],
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
      "KnightShield tiene una mecanica unica entre los blades defensivos: cuando empieza a woblar (inclinarse al final del giro), su forma de escudo genera mas area de contacto contra el rival, drenandole energia de forma pasiva. No es el mas pesado con 32.3g, pero su diseno compensa con inteligencia mecanica. Funciona mejor con puntas estables que le permitan woblar de forma controlada, como Ball o Hexa, donde el wobble trabaja a su favor en vez de en su contra. El Ratchet 9 le da la suavidad necesaria para no interferir con esta mecanica. Un blade para jugadores pacientes que entienden que a veces ganar es dejar que el rival se desgaste solo.",
    bestCombos: [
      "9-60 Ball (stamina con wobble util, el 9 no interfiere con su mecanica de escudo)",
      "7-60 Hexa (defensa pesada, Hexa se planta y el escudo drena al rival que lo golpea)",
      "5-60 Unite (semiagresivo defensivo, Unite le da movimiento controlado para desgastar)",
    ],
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
      "LeonClaw brilla cuando ataca desde una posicion baja. Sus garras texturadas enganchan al rival y lo levantan, generando un upper attack natural que desestabiliza al oponente. En nuestros tests, LeonClaw 7-60 Gear Point tuvo un rendimiento de 5-5 contra el top del meta, logrando KOs contra TyrannoBeat y Burst Finishes contra EmperorBlast y ScorpioSpear, demostrando que puede competir con blades de tier mas alto. El Ratchet 7 es interesante porque su peso (7.1g) compensa la ligereza del blade (31.6g), y con ratchets bajos como 1-60 maximiza su upper attack desde abajo. Ideal para jugadores que disfrutan un estilo tecnico y agresivo.",
    bestCombos: [
      "7-60 Gear Point (5-5 en tests, KOs contra TyrannoBeat y BFs contra blades S-tier)",
      "1-60 Rush (upper maximo, el ratchet bajo maximiza sus garras texturadas)",
      "3-60 Flat (ataque agresivo, el bajo retroceso del 3 evita que su ligereza lo perjudique)",
    ],
    tier: "B",
    imageUrl: STORAGE_BASE + "/guia_p03.png",
  },
  {
    name: "ViperTail",
    weight: "34.4g",
    type: "balance",
    description:
      "Blade sutil de desgaste. Drena energia con contacto continuo. Efectivo con paciencia.",
    details:
      "ViperTail no busca el golpe espectacular: su fuerte es el contacto constante que le quita energia al rival sin gastar demasiada propia. Con 34.4g tiene un peso muy respetable que le da buena inercia de giro. En nuestros tests con 3-60 Unite mostro capacidad de ganar por KO contra PhoenixWing y por BF contra HoverWyvern, demostrando que su estilo de desgaste continuo puede ser letal. El Ratchet 5 le queda natural por su buen peso y estabilidad, y Point le da la capacidad de ser semiagresivo manteniendo contacto sin perder posicion. Un blade para jugadores pacientes que prefieren ganar por Spin Finish.",
    bestCombos: [
      "5-60 Point (desgaste semiagresivo, Point mantiene contacto constante sin perder posicion)",
      "3-60 Unite (semiagresivo con bajo retroceso, capaz de KOs y BFs en tests)",
      "9-60 Ball (stamina pura, aprovecha sus 34.4g para girar mas que el rival)",
    ],
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
      "WeissTiger es la definicion de equilibrio: no domina en ninguna categoria, pero tampoco tiene puntos debiles claros. Eso lo convierte en un blade muy adaptable que funciona bien contra casi cualquier rival. Su forma distribuye el peso de manera uniforme, dando una estabilidad natural que facilita el uso de cualquier tipo de punta. Con Unite se vuelve un semiagresivo confiable que rara vez te deja mal, y con Ball es un estacionario solido. El Ratchet 5 le aporta buen peso distribuido que complementa su balance natural. Ideal para jugadores que quieren un blade comodin que nunca los deje en desventaja.",
    bestCombos: [
      "5-60 Unite (balance perfecto, el 5 complementa su distribucion uniforme de peso)",
      "9-60 Ball (estacionario confiable, el 9 no interfiere con ninguna de sus cualidades)",
      "3-60 Taper (semiagresivo con bajo retroceso, versatil para cualquier matchup)",
    ],
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
      "KnightLance concentra toda su fuerza en un punto de contacto, como una lanza real. Cuando conecta bien, el impacto es enorme y puede sacar al rival de un solo golpe. Su alto recoil es un arma de doble filo que podes usar a tu favor con lanzamientos controlados: en vez de pelear contra el retroceso, dejalo que lo lleve a un patron de movimiento agresivo. El Ratchet 3 es la mejor opcion porque su bajo retroceso no suma al ya alto recoil del blade, y Rush le da la direccionalidad que necesita para conectar con precision. Con lanzamientos bien calibrados, es capaz de Xtreme Finishes espectaculares.",
    bestCombos: [
      "3-60 Rush (precision con bajo retroceso, el 3 no suma al alto recoil del blade)",
      "1-60 Flat (potencia maxima, el contrapeso del 1 ayuda a controlar su trayectoria)",
      "5-60 Rush (estabilidad con impacto, el peso del 5 le da mas inercia en el golpe)",
    ],
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
      "KnightMail es un blade CX que aprovecha su centro de gravedad alto para generar downforce y upper attack cuando se mueve. No es un blade estatico: necesita movimiento para sacar su verdadero potencial, lo que lo diferencia de los defensivos clasicos. Con puntas semiagresivas como Point o Taper, combina defensa solida con capacidad ofensiva sorpresiva que pocos rivales esperan. El Ratchet 5 le da peso distribuido que complementa su mecanica CX, y con Point puede alternar entre defensa estacionaria y ataques oportunistas. Un blade para jugadores que quieren defender de forma activa.",
    bestCombos: [
      "5-60 Point (defensa activa, Point le da movimiento controlado para activar su upper)",
      "9-60 Ball (estacionario con stamina, util cuando no necesitas movimiento agresivo)",
      "7-60 Taper (semiagresivo pesado, el 7 compensa su centro de gravedad alto)",
    ],
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
      "PhoenixFeather compensa su peso ligero con velocidad y evasion. En vez de absorber los golpes como un tanque, los esquiva gracias a su perfil aerodinamico que deflecta el contacto. Funciona mejor con puntas estables como Ball o Unite, donde puede mantenerse en movimiento constante sin perder stamina. Su estilo de juego es unico: parece un atacante pero juega como un defensivo evasivo, frustrando a los rivales agresivos que no logran conectar limpio. El Ratchet 9 es perfecto porque su suavidad total le da maxima libertad de movimiento para esquivar. Un blade para jugadores que prefieren la inteligencia sobre la fuerza bruta.",
    bestCombos: [
      "9-60 Ball (evasion con stamina, el 9 le da libertad total de movimiento)",
      "7-60 Unite (evasion con peso, el 7 le da mas inercia para mantener velocidad)",
      "5-60 Taper (semiagresivo evasivo, Taper le da opcion de contraatacar al esquivar)",
    ],
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
      "HellsChain tiene una forma que genera friccion constante contra el rival en cada contacto, como una cadena que lo frena y le drena energia. Su bajo recoil es su mayor ventaja: casi no retrocede al pegar, lo que significa que cada golpe le quita energia al rival sin gastar la propia. Eso lo hace extremadamente eficiente en batallas de desgaste. Funciona tanto en modo defensivo con Ball, plantado en el centro absorbiendo golpes, como semiagresivo con Point, buscando contacto activo. El Ratchet 9 le da la suavidad que necesita para no interferir con su mecanica de cadena. Un blade para jugadores que disfrutan ganar desgastando al rival poco a poco.",
    bestCombos: [
      "9-60 Ball (desgaste estacionario, el 9 no suma retroceso a su ya bajo recoil)",
      "5-60 Point (desgaste activo, Point busca contacto constante para drenar al rival)",
      "7-60 Unite (semiagresivo pesado, el 7 le da peso para que el desgaste sea mas efectivo)",
    ],
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
      "UnicornSting tiene una forma aerodinamica que desvla golpes con elegancia. Su especialidad es el counter: recibe el ataque del rival y lo redirige, haciendo que el agresor pierda mas energia que el defensor. Funciona especialmente bien contra blades agresivos de alto recoil que se descontrolan al no conectar limpio. Con Ball se planta en el centro y espera a que el rival se desgaste solo, y con Unite puede buscar posicionamiento activo para maximizar sus angulos de desvio. El Ratchet 9 es ideal porque su suavidad no interfiere con la forma aerodinamica del blade. Un blade que premia la paciencia y el buen posicionamiento.",
    bestCombos: [
      "9-60 Ball (counter estacionario, el 9 no interfiere con sus angulos de desvio)",
      "5-60 Unite (counter activo, Unite le da movimiento para buscar el angulo perfecto)",
      "7-60 Taper (counter pesado, el 7 le da inercia para devolver golpes con mas fuerza)",
    ],
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
      "LeonCrest usa su forma de plato ancho para redirigir la energia del rival. Los ataques literalmente resbalan sobre su superficie, perdiendo la mayor parte de su fuerza en el proceso. No es el blade mas pesado, pero su diseno compensa: la forma deflectora hace que los atacantes se desgasten intentando conectar un golpe limpio que nunca llega. Funciona mejor plantado en el centro con puntas estables como Ball o Hexa, donde puede maximizar su area de deflexion. El Ratchet 9 es la mejor opcion porque su perfil suave complementa la superficie lisa del plato. Ideal para jugadores que quieren frustrar a los atacantes y ganar por desgaste.",
    bestCombos: [
      "9-60 Ball (plato deflector con stamina, maxima area de desvio en el centro)",
      "7-60 Hexa (muro estacionario, Hexa se planta mientras el plato desvla todo)",
      "5-60 Unite (counter con movimiento, Unite le da opcion de buscar mejor posicion)",
    ],
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
      "PhoenixRudder tiene una forma compacta que lo hace dificil de golpear limpiamente, con angulos que desvian el contacto de manera natural. Su mejor uso es como especialista anti left-spin con Elevate, donde ecualiza la energia de blades como CobaltDragoon aprovechando la mecanica de giro inverso. Tambien funciona como defensivo general con Ball, plantado en el centro aprovechando su perfil compacto. El Ratchet 9 le da la libertad de movimiento que necesita para posicionarse bien, y el 5 le aporta peso extra para mejorar su ecualizacion. Un blade especializado que brilla en matchups especificos pero que cumple bien como defensivo general.",
    bestCombos: [
      "9-60 Elevate (anti left-spin, ecualizacion maxima contra CobaltDragoon y similares)",
      "5-60 Ball (defensa general, el peso del 5 mejora su estabilidad en el centro)",
      "7-60 Point (counter versatil, Point agrega capacidad ofensiva a su perfil compacto)",
    ],
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
      "TriceraPress es uno de esos blades que no llama la atencion hasta que lo ves en accion. Sus tres puntos de contacto generan embestidas potentes y consistentes que recuerdan a un triceratops cargando. Con Rush o Flat a baja altura, puede competir de igual a igual con blades de tier mas alto, generando Xtreme Finishes sorpresivos. El Ratchet 3 sinergiza naturalmente con sus tres puntos de contacto, alineando las divisiones del ratchet con las embestidas del blade para maximizar el impacto. Con 1-60 Flat en modo ultra agresivo, su potencia bruta sorprende a rivales confiados. Un blade accesible, efectivo y muy divertido de usar.",
    bestCombos: [
      "3-60 Rush (sinergia natural, los 3 segmentos del ratchet alinean con sus 3 puntos de impacto)",
      "1-60 Flat (potencia bruta, el contrapeso del 1 le da trayectoria impredecible)",
      "5-60 Rush (estabilidad con impacto, el peso del 5 suma inercia a sus embestidas)",
    ],
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
      "SamuraiCalibur tiene una forma de espada que genera impactos concentrados con un estilo unico. Aunque hay atacantes mas populares en tiers superiores, su factor sorpresa es una ventaja real: los rivales no conocen bien sus patrones de movimiento, lo que dificulta anticipar por donde viene el golpe. Funciona mejor con puntas agresivas en ratchets medios, donde su forma de espada puede cortar el movimiento del rival. El Ratchet 3 le da bajo retroceso que complementa bien su estilo de corte, y Rush le da la direccionalidad precisa para conectar con la parte afilada. Un blade para quienes disfrutan sorprender con combos poco convencionales.",
    bestCombos: [
      "3-60 Rush (corte preciso, el bajo retroceso del 3 le da control sobre cada golpe)",
      "1-60 Flat (ataque impredecible, el contrapeso del 1 crea patrones que sorprenden)",
      "5-60 Flat (corte con peso, los 5 segmentos suman inercia a su estilo de espada)",
    ],
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
      "DranBuster concentra todo su peso en un solo punto de contacto, como un rifle de francotirador. Cuando conecta limpio, el dano es enorme: puede sacar al rival del stadium de un solo golpe con un Xtreme Finish espectacular. Su espada afilada genera impactos que penetran las defensas de blades que normalmente desvian los ataques. Requiere precision y practica para dominar, pero recompensa generosamente a los jugadores tecnicos que aprenden a leer la posicion del rival. El Ratchet 1 es ideal porque su contrapeso unico complementa la concentracion de peso del blade, y Flat le da la velocidad necesaria para conectar antes de que el rival reaccione.",
    bestCombos: [
      "1-60 Flat (precision maxima, el contrapeso del 1 complementa su concentracion de peso)",
      "3-60 Rush (control preciso, Rush le da direccionalidad para conectar con la espada)",
      "5-60 Flat (impacto pesado, el peso del 5 suma inercia al golpe concentrado)",
    ],
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
      "ShinobiShadow pesa solo 28.4g, lo que lo hace el mas liviano del juego por un margen considerable. Pero esa ligereza es una herramienta, no una debilidad: su velocidad le permite esquivar ataques y rebotar contra las paredes del stadium de formas completamente impredecibles que confunden al rival. Su patron de movimiento es caotico pero controlable con practica, como un ninja que aparece y desaparece. Con puntas de balance como Point o Unite, se vuelve una pesadilla para los atacantes que no pueden anticipar donde va a estar. El Ratchet 5 le aporta el peso extra que necesita para compensar su ligereza, y el 9 le da maxima libertad para sus movimientos erraticos.",
    bestCombos: [
      "5-60 Point (velocidad con peso extra, el 5 compensa su ligereza mientras Point le da agilidad)",
      "9-60 Unite (ninja con libertad total, el 9 no interfiere con sus rebotes impredecibles)",
      "7-60 Ball (estabilizador ninja, el peso del 7 le da mas inercia para mantener el giro)",
    ],
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
      "DranBrave tiene una forma de pendiente inclinada disenada para meterse debajo del rival y levantarlo, generando upper attack de una manera unica entre los blades. Es un blade experimental por naturaleza: cuando conecta bien el upper, los resultados son espectaculares con el rival saliendo disparado hacia arriba. Requiere ratchets bajos especificos y lanzamientos bien calibrados para maximizar su angulo de ataque, lo que lo hace un blade tecnico que premia la practica. El Ratchet 3 le da bajo retroceso para no descontrolarse despues del upper, y Rush le da la velocidad necesaria para meterse debajo del rival. Ideal para jugadores aventureros que quieren probar mecanicas diferentes.",
    bestCombos: [
      "3-60 Rush (upper controlado, el bajo retroceso del 3 evita descontrolarse post-impacto)",
      "1-60 Flat (upper maximo, el ratchet bajo maximiza su angulo de pendiente)",
      "5-60 Flat (upper con peso, el 5 le da inercia para levantar rivales mas pesados)",
    ],
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
      "CrimsonGaruda rinde homenaje al legendario Dranzer de generaciones anteriores, trayendo su espiritu a la generacion X. Es un blade de balance que funciona mejor con puntas de equilibrio que le den movimiento y control, permitiendole adaptarse al estilo del rival durante la batalla. Su versatilidad lo hace util como comodin en formatos 3v3, donde podes necesitar cubrir un hueco en tu lineup. El Ratchet 5 le da buen peso distribuido que complementa su balance natural, y Unite le aporta la consistencia que necesita para ser confiable. Un blade con mucha identidad para jugadores que valoran la historia del juego.",
    bestCombos: [
      "5-60 Unite (balance con peso, el 5 complementa su distribucion equilibrada)",
      "9-60 Ball (estacionario confiable, el 9 le da libertad sin riesgo)",
      "3-60 Taper (semiagresivo con bajo retroceso, versatil como comodin en 3v3)",
    ],
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
      "PteraSwing tiene un diseno inspirado en un pterodactilo que genera patrones de movimiento amplios y agresivos, cubriendo mucho terreno en el stadium. En nuestros tests, PteraSwing 3-60 Jolt tuvo un rendimiento de 6 victorias y 4 derrotas contra el top del meta, incluyendo un Xtreme Finish contra SharkScale, demostrando que puede dar sorpresas contra rivales de tier superior. El Ratchet 3 sinergiza bien con su forma de 3 alas, y Jolt con su patron de flor le da un movimiento amplio que cubre todo el stadium. Un blade BX accesible que puede ser tu puerta de entrada al estilo de ataque agresivo.",
    bestCombos: [
      "3-60 Jolt (6-4 en tests, incluyendo XF contra SharkScale, patron de flor agresivo)",
      "3-60 Rush (ataque controlado, los 3 segmentos del ratchet alinean con sus 3 alas)",
      "5-60 Flat (ataque con peso, el 5 le da inercia para golpes mas potentes)",
    ],
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
      "ShelterDrake tiene una forma protectora que cubre muchos angulos de ataque, actuando como un escudo natural en el centro del stadium. Es un blade BX, lo que significa que es mas accesible y facil de conseguir que los UX o CX. Funciona mejor plantado en el centro con puntas estables como Ball o Hexa, donde su cobertura amplia desvla los golpes del rival. Aunque no es el defensivo mas fuerte del juego, su consistencia y accesibilidad lo hacen perfecto para aprender el estilo defensivo y entender las mecanicas de counter antes de pasar a blades mas avanzados. El Ratchet 9 es ideal porque su suavidad total complementa su perfil protector.",
    bestCombos: [
      "9-60 Ball (defensa accesible, el 9 no interfiere con su cobertura protectora)",
      "7-60 Hexa (muro basico, Hexa se planta mientras su forma desvla golpes)",
      "5-60 Unite (defensa con movimiento, Unite le da opcion de reposicionarse)",
    ],
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
      "HaevensRing tiene la forma mas redonda de todos los blades BX, lo que reduce drasticamente la friccion cuando recibe golpes: los ataques rivales resbalan sobre su superficie circular sin quitarle mucha energia. Eso lo convierte en el blade BX con mejor stamina pura, ideal para ganar por Spin Finish simplemente girando mas tiempo que el rival. Funciona mejor con Ball u Orb que maximizan su tiempo de giro, y el Ratchet 9 complementa su suavidad natural sin agregar retroceso. Para jugadores que recien empiezan y quieren entender la mecanica de stamina y desgaste, es el blade perfecto para aprender.",
    bestCombos: [
      "9-60 Ball (stamina maxima, el 9 y Ball no suman friccion a su forma circular)",
      "9-60 Orb (stamina pura, Orb es el bit con menor friccion del juego)",
      "7-60 Ball (stamina con peso, el 7 le da mas inercia de giro para durar mas tiempo)",
    ],
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
      "AeroPegasus lleva el legado del legendario Pegasus a la generacion X. Su diseno aerodinamico le da velocidad natural y un excelente potencial para activar el Xtreme Dash, la mecanica mas emocionante del sistema X. Cuando toca el riel del stadium, sale disparado con una aceleracion que puede sorprender a cualquier rival. El Ratchet 3 le da bajo retroceso para controlar esa velocidad, y Rush le da la direccionalidad precisa para activar el Xtreme Dash de forma consistente. Es un blade iconico que conecta la historia del juego con la nueva generacion, ideal para jugadores que quieren velocidad y emocion.",
    bestCombos: [
      "3-60 Rush (Xtreme Dash controlado, el bajo retroceso del 3 complementa su velocidad)",
      "5-60 Flat (velocidad con peso, el 5 le da inercia para golpes mas potentes)",
      "1-60 Rush (velocidad maxima, el contrapeso del 1 crea trayectorias impredecibles)",
    ],
    tier: "S",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "WyvernGale",
    weight: "",
    type: "balance",
    description:
      "Blade UX de balance con forma flotante. Buen movimiento lateral en el stadium.",
    details:
      "WyvernHover tiene un perfil unico que genera movimiento lateral interesante en el stadium, como si estuviera flotando sobre la superficie. Con puntas de balance como Unite o Point, puede alternar entre posicion defensiva y ataques laterales segun la inclinacion del giro. Su forma flotante le da un estilo de juego diferente a los blades convencionales, lo que lo hace impredecible para rivales que no lo conocen. El Ratchet 5 le da peso distribuido que complementa su movimiento lateral, y el 9 le da libertad total para sus patrones flotantes. Un blade versatil para quienes buscan opciones diferentes a los clasicos.",
    bestCombos: [
      "5-60 Unite (movimiento lateral con peso, Unite le da control sobre su patron flotante)",
      "9-60 Ball (estacionario flotante, el 9 le da libertad para su movimiento natural)",
      "3-60 Point (counter lateral, Point se activa cuando su movimiento flotante lo inclina)",
    ],
    tier: "S",
    imageUrl: STORAGE_BASE + "/guia_p07.png",
  },
  {
    name: "MeteorDragoon",
    weight: "39.2g",
    type: "attack",
    description:
      "El mejor blade left-spin del sistema X. Tres hojas con goma que genera presión explosiva contra giros derechos.",
    details:
      "MeteorDragoon es la evolución definitiva del concepto left-spin. Con 39.2g es uno de los más pesados del juego, y su diseño de tres hojas con insertos de rubber genera fricción devastadora contra blades right-spin. Cada impacto drena energía del rival mientras él conserva la suya gracias a la ecualización del giro opuesto. Su base metálica distribuye el peso arriba, lo que eleva el centro de gravedad y lo hace más errático, pero esa inestabilidad genera rebotes violentos que son letales. Requiere práctica para dominar su movimiento, pero una vez que lo controlás, es una máquina.",
    bestCombos: [
      "7-70 Level (ataque versátil, el 7 baja su centro de gravedad)",
      "3-70 Jolt (patrón de flor con contraataques potentes)",
      "7-70 Elevate (ecualización con vida después de la muerte)",
    ],
    tier: "S",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
  {
    name: "ScorpioSpear",
    weight: "",
    type: "attack",
    description:
      "Blade UX con forma de aguijon. Concentra el impacto en puntos de contacto precisos.",
    details:
      "ScorpioSpear tiene puntos de contacto afilados inspirados en el aguijon de un escorpion que generan impactos concentrados y penetrantes. Su estilo unico de ataque puede sorprender al rival con golpes que llegan desde angulos inesperados. En nuestros tests aparecio como rival frecuente con 3-60 Hexa en modo estacionario, demostrando versatilidad mas alla del ataque puro. El Ratchet 3 complementa bien su forma porque el bajo retroceso le permite concentrar toda la fuerza en su aguijon sin dispersarla, y Rush le da la precision para conectar con la punta afilada. Un blade con personalidad propia para jugadores que valoran el estilo.",
    bestCombos: [
      "3-60 Rush (aguijon preciso, el bajo retroceso del 3 concentra toda la fuerza en la punta)",
      "3-60 Hexa (estacionario versatil, Hexa le da defensa solida con sus puntos afilados)",
      "5-60 Flat (ataque con peso, el 5 suma inercia al impacto de su aguijon)",
    ],
    tier: "A",
    imageUrl: STORAGE_BASE + "/guia_p08.png",
  },
  {
    name: "ValorBison",
    weight: "",
    type: "defense",
    description:
      "Blade UX defensivo y robusto. Aguanta bien los impactos frontales.",
    details:
      "ValorBison tiene una forma robusta inspirada en un bisonte que absorbe impactos frontales con una solidez impresionante. Su masa esta distribuida de forma amplia, lo que le da estabilidad natural contra empujes directos. Funciona mejor plantado en el centro del stadium con puntas estables como Ball o Hexa, donde puede aprovechar su robustez para aguantar oleadas de ataques sin perder posicion. El Ratchet 9 es ideal porque su perfil suave complementa la forma robusta del blade sin agregar puntos debiles, y el 7 le suma peso extra para hacerlo aun mas dificil de mover. Para jugadores que quieren un defensivo directo y confiable.",
    bestCombos: [
      "9-60 Ball (tanque con stamina, el 9 complementa su robustez sin agregar puntos debiles)",
      "7-60 Hexa (defensa maxima, el 7 suma peso para que sea aun mas dificil de mover)",
      "5-60 Unite (defensa con movimiento, Unite le da opcion de reposicionarse tacticamente)",
    ],
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
