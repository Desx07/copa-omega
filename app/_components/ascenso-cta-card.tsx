import Link from "next/link";
import { ChevronsUp } from "lucide-react";
import { rankInfo, type RankLetter } from "@/lib/ascenso";

// ── CTA del Torneo de Ascenso en el dashboard ──
// Se muestra a TODOS los jugadores cuando la modalidad ascenso está activa.
// Recibe rango y puntos ya resueltos por el server component (con fallback
// "F"/0 si las columnas todavía no existen en la DB — nunca rompe).
interface AscensoCtaCardProps {
  rankLetter: RankLetter;
  ticketPoints: number;
}

export function AscensoCtaCard({ rankLetter, ticketPoints }: AscensoCtaCardProps) {
  const info = rankInfo(rankLetter);
  const target = info.ticketTarget;
  // Rango S no tiene ticket (es el máximo); el resto muestra progreso X/Y
  const progreso = target ? Math.max(0, Math.min(100, (ticketPoints / target) * 100)) : 100;

  return (
    <Link
      href="/ascenso"
      className="group relative overflow-hidden rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, rgba(123,47,247,0.18) 0%, rgba(30,30,56,0.6) 55%, rgba(96,165,250,0.10) 100%)",
        border: "1px solid rgba(123,47,247,0.35)",
        boxShadow: `0 4px 18px ${info.glow}`,
      }}
      data-testid="ascenso-cta"
    >
      {/* Insignia del rango actual */}
      <div
        className={`size-12 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center shrink-0 ring-2 ring-white/15`}
        style={{ boxShadow: `0 0 14px ${info.glow}` }}
      >
        <span className="text-2xl font-black text-white drop-shadow">{info.letter}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-omega-text flex items-center gap-1.5">
          <ChevronsUp className="size-4 text-omega-purple" />
          Torneo de Ascenso
        </p>
        <p className="text-[10px] text-omega-muted">
          Rango {info.letter} · {info.name}
          {target !== null ? ` · Ticket ${ticketPoints}/${target} pts` : " · Rango máximo"}
        </p>
        {/* Barra de progreso del ticket (oculta en rango S) */}
        {target !== null && (
          <div className="h-1 mt-1.5 bg-omega-dark rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${info.color}`}
              style={{ width: `${progreso}%` }}
            />
          </div>
        )}
      </div>

      <span className="text-xs text-omega-muted group-hover:text-omega-purple transition-colors shrink-0">&rarr;</span>
    </Link>
  );
}
