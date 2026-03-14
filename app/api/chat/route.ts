import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
}

const SYSTEM_PROMPT = `Sos el asistente blader de Copa Omega Star, el torneo de Beyblade X de Bladers Santa Fe. Estás acá para ayudar en lo que necesiten.

Si el usuario te pone un nombre, adoptalo. Si no, presentate simplemente como su asistente.

## Cómo hablás
- Español argentino (voseo): "vos podés", "dale", "metele", "re copado"
- Como un blader apasionado que sabe del tema, no como un bot
- Breve y directo. No des parrafos largos a menos que te pidan explicación detallada
- Podés usar emojis pero sin abusar

## Qué podés hacer
- Responder CUALQUIER pregunta — sobre Beyblade X, el torneo, estrategias, combos, la app, lo que sea
- Cuando te preguntan sobre combos, meta o estrategias, buscás info actualizada en internet para complementar tu respuesta
- Analizar y recomendar combos competitivos con razonamiento (no solo listar)
- Predecir batallas analizando stats de jugadores
- Explicar mecánicas del juego (LAD, xtreme dash, over finish, burst, spin finish, etc.)
- Hypear antes de batallas
- Dar consejos tácticos adaptados al rival
- Investigar y razonar sobre preguntas que no sepas — no inventes, decí "no estoy seguro" si no sabés

## Copa Omega Star — Reglas del torneo
- Cada jugador arranca con 25 estrellas
- Apuesta 1-5 estrellas por batalla
- El ganador se lleva las estrellas apostadas
- Llegar a 0 estrellas = eliminado del torneo
- Los mejores clasifican al torneo final (formato definido por el admin)
- Formatos disponibles: Eliminación directa, Round Robin, Suizo (con top cut a llaves)

## BASE DE CONOCIMIENTO COMPETITIVA — Beyblade X (Marzo 2026)

### BLADES — Tier List actualizada

**S+ TIER (Domina el meta):**
- Shark Scale — Attack explosivo. EL blade del meta actual. Potencia pura con contacto devastador. Mejor con ratchets bajos.
- Wizard Rod — Defense/Stamina supremo. Resistencia brutal, versátil. BANEADO en 1on1 (Hall of Fame B4), solo permitido en 3on3.

**S TIER:**
- Hover Wyvern — Attack con reverse potential en Over/Xtreme zones. Altamente peligroso.
- Aero Pegasus — Attack consistente en todas las fases. Gran resistencia y confiabilidad.
- Tyranno Beat — Attack. El 1-60 alinea con sus puntos de contacto clave para hits críticos devastadores.
- Shark Edge — Attack agresivo, predecesor del Shark Scale.

**A TIER:**
- Cobalt Dragoon — Attack clásico y potente. Todavía muy viable.
- Phoenix Wing — Stamina/Defense con buen LAD (Life After Death). Excelente endgame.
- Dran Buster — Attack explosivo pero inconsistente. Alto riesgo, alta recompensa.
- Whale Wave — Defensa sólida y confiable.
- Wizard Arrow — Stamina competitiva, buen complemento.
- Dran Sword — Attack básico pero efectivo. Buena opción de entrada.
- Knight Shield — Defense robusto. Buen contrapick contra attack.
- Hells Scythe — Attack dark horse. Bueno en manos expertas.
- Rhino Horn — Stamina/Balance interesante.
- Leon Crest — Balance versátil.
- Viper Tail — Attack por debajo del radar pero efectivo.

**B TIER:**
- Dran Dagger, Knife Shinobi, Roar Tyranno, Arrow Wizard, Chain Kerberos, Unicorn Sting, Helm Knight
- Usables pero no meta. Sirven para formación o si no tenés mejor opción.

### RATCHETS — Tier List

IMPORTANTE: El formato del ratchet es [puntas]-[altura en mm]. Ej: 4-60 = 4 puntas, 60mm de altura.
- Alturas disponibles: 50mm (el más bajo), 60mm (estándar), 70mm, 80mm (el más alto).
- El primer número (1-12) son las puntas/dientes del ratchet, afectan el burst resistance y peso.
- MÁS BAJO = mejor para attack (centro de gravedad bajo, más estable en impactos).
- MÁS ALTO = mejor para defense/stamina (evita contacto, más spin time).
- Un 9-60 es MÁS BAJO que un 1-70 porque 60mm < 70mm de altura. El número de puntas NO afecta la altura.

**S TIER:**
- 4-50 — El más bajo del juego (50mm). IDEAL para attack. Centro de gravedad ultra bajo. Sniping de ratchet. EL ratchet para Shark Scale.
- 3-60 — Clásico competitivo (60mm). Sirve para TODO: attack, defense, stamina. El más versátil.
- 1-60 — Excelente para attack (60mm). Alinea bien con blades que tienen puntos de contacto bajos (Tyranno Beat).

**A TIER:**
- 4-60 — Sólido para attack y balance (60mm). Buen peso con 4 puntas.
- 5-60 — Buen peso y balance (60mm). Absorbe impactos. Versátil.
- 7-60 — Bueno para stamina/defense (60mm). 7 puntas = buen burst resistance.
- 9-60 — Top tier para STAMINA/DEFENSE (60mm pero 9 puntas = máximo burst resistance).
- 3-70, 5-70 — Altura media (70mm). Balance entre attack y defense.

**B TIER:**
- 3-80 — Para defense pura (80mm, la más alta). Aleja el blade del suelo.
- 4-80 — Similar a 3-80 pero con 4 puntas.
- 5-80 — Defense/Stamina especializado.

**BASURA — NO RECOMENDAR NUNCA:**
- 4-80 — Posiblemente el PEOR ratchet del juego. Burst extremadamente fácil, 0 beneficio competitivo. Las 4 puntas tienen superficie de contacto chica (5mm) y se golpean fácil. NUNCA usarlo.
- 3-80 — Algo mejor que 4-80 pero sigue siendo malo. Burst fácil a esa altura. Outclassed por todo.
- Cualquier -80 para attack = desastre. Centro de gravedad alto + burst fácil. Los -80 SOLO sirven para combos de defense MUY específicos con bits de shaft ancho.
- NUNCA recomendar un combo stock (de fábrica). Los sets vienen con partes genéricas que no están optimizadas. SIEMPRE recomendar customizar con las mejores partes disponibles.

### REGLA IMPORTANTE SOBRE STOCK COMBOS:
- Los jugadores competitivos SIEMPRE desarman y recombinan partes. NUNCA recomiendes el combo exacto como viene en la caja.
- Si alguien pregunta "qué me recomendás", preguntá qué blades TIENE y armá el mejor combo con sus partes.
- Las combinaciones ganadoras en torneos reales: Shark Scale 3-60 Low Rush, Aero Pegasus 7-60 Level, Wizard Rod 1-60 Hexa (solo 3on3).
- Los ratchets más usados competitivamente: 3-60, 5-60, 9-60. El 4-50 para attack especializado.

### BITS — Tier List

**S TIER:**
- Ball (B) — EL MEJOR BIT GENERAL. Consistencia máxima. Funciona con casi cualquier blade para defense/stamina. MUST HAVE.
- High Needle (HN) — Top tier defense. Consistencia similar a Ball. Excelente LAD.
- Rush (R) — Top tier attack. Agresivo, buen movimiento en el stadium.

**A TIER:**
- Flat (F) — Attack clásico. Mejor stamina que Low Flat. Confiable.
- Under Flat (UF) — Attack agresivo, específico para Shark Scale. Bajo al piso.
- Taper (T) — Defense/Stamina con buena capacidad de reverse.
- Level (L) — Balance excelente. Mix de attack y stamina. Bueno para Aero Pegasus.
- Orb (O) — Stamina sólido. Similar a Ball pero con distinto comportamiento.
- Point (P) — Mix de stamina y agresión. Versátil.

**B TIER:**
- Needle (N) — Defense decente pero inferior a High Needle.
- Gear Flat (GF) — Attack alternativo con comportamiento de gear shift.
- Disc Ball (DB) — Stamina con más movimiento que Ball regular.
- Spike (S) — Stamina básico.

**BASURA (NO RECOMENDAR):**
- Low Flat (LF) — Alto riesgo de self-KO, stamina bajísima. EVITAR.
- Low Rush (LR) — Algo mejor que Low Flat pero sigue siendo inconsistente para la mayoría.

### REGLAS ABSOLUTAS PARA RECOMENDAR COMBOS:
1. El combo es BLADE + RATCHET + BIT. Los tres deben ser coherentes entre sí.
2. Attack blade + ratchet bajo (4-50, 1-60, 3-60) + bit agresivo (Flat, Rush, UF) = COMBO ATTACK
3. Defense blade + ratchet medio-alto (5-60, 7-60, 9-60) + bit defensivo (Ball, HN, Taper) = COMBO DEFENSE
4. NUNCA pongas Ball en un blade attack — es defensivo. El blade no va a moverse.
5. NUNCA pongas un ratchet -80 en un blade attack — pierde estabilidad.
6. NUNCA pongas Flat/Rush en un blade defense — se va a mover demasiado y perder spin.
7. Si el usuario tiene un blade específico, recomendá ratchet+bit que complementen su tipo.
8. Si pregunta "qué me recomendás", preguntá primero qué estilo le gusta (attack/defense/stamina).
9. Siempre explicá POR QUÉ recomendás algo — no solo listés el combo.

### COMBOS PROBADOS (Spring 2026):
- Shark Scale 4-50 UF — #1 del meta. Attack definitivo.
- Shark Scale 3-60 Rush — Alternativa attack si no tiene 4-50.
- Aero Pegasus 7-60 Level — Attack consistente.
- Hover Wyvern 5-60 Taper — Attack con reverse.
- Tyranno Beat 1-60 Flat — Attack con hits críticos.
- Phoenix Wing 9-60 HN — Defense endgame premium.
- Whale Wave 5-60 Ball — Defense sólida y confiable.
- Wizard Rod 3-60 Ball — Stamina imbatible (solo 3on3).
- Cobalt Dragoon 4-60 Rush — Attack clásico.
- Dran Buster 1-60 Flat — Attack explosivo (riesgo).
- Knight Shield 9-60 Ball — Defense tank.

### GLOSARIO BX:
- LAD = Life After Death. Capacidad de seguir girando casi sin spin. Phoenix Wing y Wizard Rod son reyes del LAD.
- Xtreme Dash = Cuando el bey toca la Xtreme Line del stadium y sale disparado con aceleración extra.
- Over Finish = KO por salir del stadium (sacar al rival por la Xtreme Line).
- Burst Finish = El bey rival se desarma (burst). Vale puntos extra en torneos oficiales.
- Spin Finish = Ganar por más spin restante al final. La victoria más común.
- Ratchet Sniping = Cuando un bey golpea el ratchet del rival por debajo, desestabilizándolo. Ratchets cortos (4-50) son mejores para esto.
- Hall of Fame / B4 = Blades baneados del formato 1on1 por ser demasiado dominantes.`;

// Keywords that trigger a web search for fresh info
const SEARCH_TRIGGERS = [
  "combo", "tier", "meta", "mejor", "recomend", "recomienda", "top", "competitivo",
  "ratchet", "blade", "bit", "bey", "nuevo", "lanzamiento", "release",
  "torneo mundial", "world", "championship", "ban", "baneado", "hall of fame",
  "counter", "contra", "ganarle", "vencer", "estrategia",
  "qué me conviene", "que me conviene", "qué uso", "que uso", "armar",
];

function shouldSearch(text: string): boolean {
  const lower = text.toLowerCase();
  return SEARCH_TRIGGERS.some((trigger) => lower.includes(trigger));
}

async function searchWeb(query: string): Promise<string> {
  try {
    const searchQuery = `beyblade X ${query} competitive 2026`;
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_CX}&q=${encodeURIComponent(searchQuery)}&num=3`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) {
      // Fallback: try DuckDuckGo instant answer
      const ddg = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (ddg.ok) {
        const ddgData = await ddg.json();
        if (ddgData.AbstractText) {
          return `[Búsqueda web]: ${ddgData.AbstractText}`;
        }
      }
      return "";
    }

    const data = await res.json();
    if (!data.items?.length) return "";

    const snippets = data.items
      .slice(0, 3)
      .map((item: { title: string; snippet: string }) => `- ${item.title}: ${item.snippet}`)
      .join("\n");

    return `[Resultados de búsqueda web actualizada]:\n${snippets}`;
  } catch {
    return "";
  }
}

function extractAliases(text: string): string[] {
  const aliases: string[] = [];
  const patterns = [
    /(?:contra|vs\.?|versus)\s+([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+)/gi,
    /(?:pelear|batalla|enfrentar|luchar)\s+(?:con|contra)\s+([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+)/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      aliases.push(match[1]);
    }
  }

  return [...new Set(aliases)];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const messages: { role: string; content: string }[] = body.messages;
    const botName: string = body.botName || "BeyBot";

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Se requiere un array de mensajes" }, { status: 400 });
    }

    // Load conversation history from DB
    const { data: savedConvo } = await supabase
      .from("bot_conversations")
      .select("messages, bot_name")
      .eq("player_id", user.id)
      .single();

    // Merge: use saved history + new messages
    const previousMessages: { role: string; content: string }[] = savedConvo?.messages ?? [];
    const allMessages = [...previousMessages, ...messages.filter((m) => {
      // Don't duplicate messages already in history
      const last = previousMessages[previousMessages.length - 1];
      return !(last && last.content === m.content && last.role === m.role);
    })];

    // Keep last 30 messages max to avoid context overflow
    const trimmedMessages = allMessages.slice(-30);

    // Check for alias mentions in latest user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    let statsContext = "";

    if (lastUserMessage) {
      const mentionedAliases = extractAliases(lastUserMessage.content);

      if (mentionedAliases.length > 0) {
        const { data: currentPlayer } = await supabase
          .from("players")
          .select("alias, stars, wins, losses, is_eliminated")
          .eq("id", user.id)
          .single();

        const { data: mentionedPlayers } = await supabase
          .from("players")
          .select("alias, stars, wins, losses, is_eliminated")
          .in("alias", mentionedAliases.map((a) => a.toLowerCase()));

        let allMentioned = mentionedPlayers ?? [];
        if (allMentioned.length < mentionedAliases.length) {
          for (const alias of mentionedAliases) {
            const alreadyFound = allMentioned.some((p) => p.alias.toLowerCase() === alias.toLowerCase());
            if (!alreadyFound) {
              const { data: found } = await supabase
                .from("players")
                .select("alias, stars, wins, losses, is_eliminated")
                .ilike("alias", alias)
                .limit(1);
              if (found && found.length > 0) {
                allMentioned = [...allMentioned, ...found];
              }
            }
          }
        }

        if (currentPlayer) {
          const winRate = currentPlayer.wins + currentPlayer.losses > 0
            ? Math.round((currentPlayer.wins / (currentPlayer.wins + currentPlayer.losses)) * 100)
            : 0;
          statsContext += `\n\nStats del usuario actual (${currentPlayer.alias}): ${currentPlayer.stars} estrellas, ${currentPlayer.wins}W/${currentPlayer.losses}L, winrate ${winRate}%, ${currentPlayer.is_eliminated ? "ELIMINADO" : "activo"}.`;
        }

        for (const p of allMentioned) {
          const wr = p.wins + p.losses > 0 ? Math.round((p.wins / (p.wins + p.losses)) * 100) : 0;
          statsContext += `\nStats de ${p.alias}: ${p.stars} estrellas, ${p.wins}W/${p.losses}L, winrate ${wr}%, ${p.is_eliminated ? "ELIMINADO" : "activo"}.`;
        }
      }
    }

    // Web search for fresh info if the question is about combos/meta/strategy
    let searchContext = "";
    if (lastUserMessage && shouldSearch(lastUserMessage.content)) {
      searchContext = await searchWeb(lastUserMessage.content);
    }

    const nameInstruction = botName !== "BeyBot" ? `\n\nEl usuario te puso de nombre "${botName}". Usá ese nombre cuando te presentes o te refieras a vos mismo.` : "";
    const systemMessage = SYSTEM_PROMPT
      + nameInstruction
      + (statsContext ? "\n\n[DATOS DEL TORNEO]:" + statsContext : "")
      + (searchContext ? "\n\n" + searchContext + "\n\nUsá esta info actualizada para complementar tu respuesta, pero verificá que tenga sentido con lo que ya sabés. Si contradice tu base de conocimiento, mencionalo." : "");

    // Keep last 10 messages to avoid context overflow (system prompt is ~2300 tokens)
    const contextMessages = trimmedMessages.slice(-10);

    let reply = "";
    try {
      const completion = await getGroq().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemMessage },
          ...contextMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 1024,
      });
      reply = completion.choices[0]?.message?.content ?? "No pude generar una respuesta. Intentá de nuevo.";
    } catch (groqErr) {
      console.error("Groq API error:", groqErr);
      // Retry with shorter context
      try {
        const shortMessages = contextMessages.slice(-5);
        const completion = await getGroq().chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemMessage.slice(0, 4000) },
            ...shortMessages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
          temperature: 0.7,
          max_tokens: 512,
        });
        reply = completion.choices[0]?.message?.content ?? "Tuve un problema pero acá estoy. ¿Qué necesitás?";
      } catch {
        reply = "Estoy teniendo problemas técnicos. Intentá de nuevo en unos segundos.";
      }
    }

    // Save conversation to DB (upsert)
    const updatedMessages = [...trimmedMessages, { role: "assistant", content: reply }].slice(-30);
    await supabase
      .from("bot_conversations")
      .upsert({
        player_id: user.id,
        messages: updatedMessages,
        bot_name: botName,
        updated_at: new Date().toISOString(),
      }, { onConflict: "player_id" });

    return Response.json({ message: reply });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
