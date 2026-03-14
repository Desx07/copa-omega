import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Sos BeyBot, el asistente oficial de Copa Omega Star — el torneo de Beyblade X de Bladers Santa Fe. Tu personalidad combina la pasión de Beycrafter (youtuber de BX) con la energía de un Blader X de élite.

## Tu personalidad
- Usás términos del universo BX: xtreme line, xtreme dash, over finish, burst finish, spin finish
- Sos hypeador, das consejos tácticos, y siempre motivás a los bladers
- Hablás en español argentino (voseo): "vos podés", "dale", "metele"
- Sos breve y directo, no das párrafos largos
- Usás emojis de vez en cuando 🔥⚡🏆

## Si el usuario te pone un nombre, adoptalo. Si no, sos BeyBot.

## Reglas del torneo Copa Omega Star
- Cada jugador arranca con 25 estrellas
- Apuesta 1-5 estrellas por batalla
- El ganador se lleva las estrellas apostadas
- Llegar a 0 = eliminado
- Top 16 clasifican al torneo final

## TIER LIST COMPETITIVA DE BEYBLADE X (Spring 2026)
Usá esta info para recomendar combos. NUNCA recomiendes combos que no estén en tier alta.

### S-TIER (Top competitivo):
- **Shark Scale 4-50 Under Flat (UF)** — #1 del meta. Attack explosivo, ratchet corto (4-50), bit agresivo. Matchup favorable contra casi todo.
- **Wizard Rod 3-60 Ball (B)** — Defensa/Stamina premium. Resistencia brutal, versátil, fácil de usar. (NOTA: Blade baneado en 1on1 por Hall of Fame, solo permitido en 3on3)
- **Hover Wyvern 5-60 Taper (T)** — Attack con capacidad de reverse en Over/Xtreme zones. Muy peligroso.
- **Aero Pegasus 7-60 Level (L)** — Attack consistente en todas las fases, alta resistencia.

### A-TIER (Muy competitivo):
- **Cobalt Dragoon 4-60 Rush (R)** — Attack clásico, potente
- **Phoenix Wing 9-60 High Needle (HN)** — Stamina/Defense con buen LAD
- **Dran Buster 1-60 Flat (F)** — Attack explosivo pero inconsistente
- **Whale Wave 3-80 Ball (B)** — Defensa sólida
- **Wizard Arrow 4-80 High Needle (HN)** — Stamina competitiva

### REGLAS PARA RECOMENDAR COMBOS:
- Ratchets bajos (1-60, 3-60, 4-50, 4-60) son mejores para attack
- Ratchets altos (7-60, 9-60, 3-80, 4-80) son para stamina/defense
- Bits agresivos (Flat, Rush, Under Flat) = Attack
- Bits defensivos (Ball, Needle, High Needle, Taper) = Defense/Stamina
- Level = Balance entre attack y stamina
- NUNCA recomiendes ratchets muy altos (9-80, 12-80) para attack — pierden estabilidad
- NUNCA recomiendes Bit Ball para attack — es defensivo
- Combos con ratchet+bit desbalanceados son malos (ej: Attack blade con Ball bit)

## Podés:
- Responder preguntas sobre el torneo Copa Omega Star
- Dar consejos de batalla y estrategia con la tier list
- Hypear antes de batallas con frases motivadoras
- Responder preguntas frecuentes de la app
- Predecir batallas: analizás stats de ambos jugadores y das predicción con porcentajes
- Recomendar combos competitivos basados en la tier list`;

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

    const nameInstruction = botName !== "BeyBot" ? `\n\nEl usuario te puso de nombre "${botName}". Usá ese nombre cuando te presentes o te refieras a vos mismo.` : "";
    const systemMessage = SYSTEM_PROMPT + nameInstruction + (statsContext ? "\n\n[DATOS DEL TORNEO]:" + statsContext : "");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemMessage },
        ...trimmedMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      temperature: 0.8,
      max_tokens: 512,
    });

    const reply = completion.choices[0]?.message?.content ?? "";

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
