import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("id");

  if (!playerId) {
    return new Response("Missing player id", { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: player } = await supabase
    .from("players")
    .select("alias, stars, wins, losses, current_title, avatar_url")
    .eq("id", playerId)
    .single();

  if (!player) {
    return new Response("Player not found", { status: 404 });
  }

  // Get ranking position
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, stars")
    .eq("is_hidden", false)
    .eq("is_eliminated", false)
    .order("stars", { ascending: false });

  const rank = (allPlayers?.findIndex((p) => p.id === playerId) ?? -1) + 1;
  const totalMatches = player.wins + player.losses;
  const winRate =
    totalMatches > 0 ? Math.round((player.wins / totalMatches) * 100) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "600px",
          height: "400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: "40px",
          position: "relative",
        }}
      >
        {/* Border glow */}
        <div
          style={{
            position: "absolute",
            inset: "2px",
            border: "2px solid rgba(124, 58, 237, 0.5)",
            borderRadius: "16px",
            display: "flex",
          }}
        />

        {/* Logo text */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "24px",
            fontSize: "12px",
            color: "#f59e0b",
            fontWeight: "bold",
            display: "flex",
          }}
        >
          COPA OMEGA STAR
        </div>

        {/* Rank badge */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "24px",
            fontSize: "14px",
            color: rank <= 3 ? "#f59e0b" : "#a78bfa",
            fontWeight: "bold",
            display: "flex",
          }}
        >
          #{rank}
        </div>

        {/* Player alias */}
        <div
          style={{
            fontSize: "42px",
            fontWeight: "900",
            color: "#f59e0b",
            textShadow: "0 0 20px rgba(245, 158, 11, 0.5)",
            marginBottom: "8px",
            display: "flex",
          }}
        >
          {player.alias}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "16px",
            color: "#a78bfa",
            marginBottom: "24px",
            display: "flex",
          }}
        >
          {player.current_title || "Blader"}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#f59e0b",
                display: "flex",
              }}
            >
              {player.stars}
            </div>
            <div
              style={{ fontSize: "12px", color: "#888", display: "flex" }}
            >
              ESTRELLAS
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#22c55e",
                display: "flex",
              }}
            >
              {player.wins}
            </div>
            <div
              style={{ fontSize: "12px", color: "#888", display: "flex" }}
            >
              VICTORIAS
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#ef4444",
                display: "flex",
              }}
            >
              {player.losses}
            </div>
            <div
              style={{ fontSize: "12px", color: "#888", display: "flex" }}
            >
              DERROTAS
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#a78bfa",
                display: "flex",
              }}
            >
              {winRate}%
            </div>
            <div
              style={{ fontSize: "12px", color: "#888", display: "flex" }}
            >
              WIN RATE
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            fontSize: "11px",
            color: "#666",
            display: "flex",
          }}
        >
          bladers-sf.vercel.app
        </div>
      </div>
    ),
    {
      width: 600,
      height: 400,
    }
  );
}
