import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Sos BeyBot, el asistente oficial de Copa Omega Star — el torneo de Beyblade X de Bladers Santa Fe. Tu personalidad combina la pasión de Beycrafter (youtuber de BX) con la energía de un Blader X de élite. Usás términos del universo BX: xtreme line, bey battle, xtreme dash, over finish, burst finish. Sos hypeador, das consejos tácticos, y siempre motivás a los bladers.

Podés:
- Responder preguntas sobre el torneo Copa Omega Star
- Dar consejos de batalla y estrategia de Beyblade X
- Hypear antes de batallas con frases motivadoras
- Responder preguntas frecuentes de la app
- Cuando un usuario dice 'voy a pelear contra [alias]', analizás stats de ambos y das predicción con porcentajes

Reglas del torneo: cada jugador arranca con 25 estrellas, apuesta 1-5 por batalla, el ganador se las lleva, llegar a 0 = eliminado, top 16 clasifican al torneo final.

Siempre hablás en español argentino (voseo). Sos breve y directo, no das parrafos largos. Usás emojis de vez en cuando.`;

// Extract aliases mentioned after "contra" or "vs" patterns
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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Se requiere un array de mensajes" },
        { status: 400 }
      );
    }

    // Check the latest user message for alias mentions
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    let statsContext = "";

    if (lastUserMessage) {
      const mentionedAliases = extractAliases(lastUserMessage.content);

      if (mentionedAliases.length > 0) {
        // Fetch current player stats
        const { data: currentPlayer } = await supabase
          .from("players")
          .select("alias, stars, wins, losses, is_eliminated")
          .eq("id", user.id)
          .single();

        // Fetch mentioned players' stats
        const { data: mentionedPlayers } = await supabase
          .from("players")
          .select("alias, stars, wins, losses, is_eliminated")
          .in(
            "alias",
            mentionedAliases.map((a) => a.toLowerCase())
          );

        // Also try case-insensitive match via ilike
        let allMentioned = mentionedPlayers ?? [];
        if (allMentioned.length < mentionedAliases.length) {
          for (const alias of mentionedAliases) {
            const alreadyFound = allMentioned.some(
              (p) => p.alias.toLowerCase() === alias.toLowerCase()
            );
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
          const winRate =
            currentPlayer.wins + currentPlayer.losses > 0
              ? Math.round(
                  (currentPlayer.wins /
                    (currentPlayer.wins + currentPlayer.losses)) *
                    100
                )
              : 0;
          statsContext += `\n\nStats del usuario actual (${currentPlayer.alias}): ${currentPlayer.stars} estrellas, ${currentPlayer.wins}W/${currentPlayer.losses}L, winrate ${winRate}%, ${currentPlayer.is_eliminated ? "ELIMINADO" : "activo"}.`;
        }

        for (const p of allMentioned) {
          const wr =
            p.wins + p.losses > 0
              ? Math.round((p.wins / (p.wins + p.losses)) * 100)
              : 0;
          statsContext += `\nStats de ${p.alias}: ${p.stars} estrellas, ${p.wins}W/${p.losses}L, winrate ${wr}%, ${p.is_eliminated ? "ELIMINADO" : "activo"}.`;
        }
      }
    }

    const systemMessage = statsContext
      ? SYSTEM_PROMPT +
        "\n\n[DATOS DEL TORNEO para esta consulta]:" +
        statsContext
      : SYSTEM_PROMPT;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemMessage },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      temperature: 0.8,
      max_tokens: 512,
    });

    const reply = completion.choices[0]?.message?.content ?? "";

    return Response.json({ message: reply });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
