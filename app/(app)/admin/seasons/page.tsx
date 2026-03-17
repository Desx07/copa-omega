"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Play, CheckCircle, Loader2, Calendar, Star } from "lucide-react";
import { toast } from "sonner";

interface Season {
  id: string;
  name: string;
  number: number;
  status: "upcoming" | "active" | "completed";
  starts_at: string;
  ends_at: string;
  initial_stars: number;
  created_at: string;
}

export default function AdminSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadSeasons(); }, []);

  async function loadSeasons() {
    try {
      const res = await fetch("/api/admin/seasons");
      if (res.ok) setSeasons(await res.json());
    } finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!name.trim() || !endsAt) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          starts_at: new Date().toISOString(),
          ends_at: new Date(endsAt + "T23:59:59").toISOString(),
        }),
      });
      if (res.ok) {
        toast.success("Temporada creada");
        setName(""); setEndsAt(""); setShowForm(false);
        loadSeasons();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error");
      }
    } finally { setCreating(false); }
  }

  async function handleAction(seasonId: string, action: "start" | "complete") {
    const confirmMsg = action === "start"
      ? "Iniciar esta temporada? La temporada activa actual se completara."
      : "Completar esta temporada? Se archivara el ranking y se resetearan las estrellas de todos a 25.";
    if (!confirm(confirmMsg)) return;

    setActionLoading(seasonId);
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(action === "start" ? "Temporada iniciada!" : "Temporada completada! Estrellas reseteadas.");
        loadSeasons();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error");
      }
    } finally { setActionLoading(null); }
  }

  const active = seasons.filter(s => s.status === "active");
  const upcoming = seasons.filter(s => s.status === "upcoming");
  const completed = seasons.filter(s => s.status === "completed");

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-gold/20 via-omega-surface to-omega-purple/15 px-6 pt-8 pb-6 shadow-lg">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-4">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-omega-gold/20 flex items-center justify-center">
              <Calendar className="size-5 text-omega-gold" />
            </div>
            <h1 className="text-2xl font-black neon-gold">TEMPORADAS</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="omega-btn omega-btn-primary px-4 py-2.5 text-sm">
            <Plus className="size-4" /> Nueva
          </button>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* Create form */}
        {showForm && (
          <div className="omega-card p-4 space-y-3 border-l-4 border-l-omega-gold">
            <h3 className="text-sm font-bold text-omega-text">Nueva temporada</h3>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre (ej: Omega Genesis)" className="omega-input w-full" />
            <div>
              <label className="text-[10px] font-bold text-omega-muted uppercase tracking-wider block mb-1">Fecha de fin</label>
              <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="omega-input w-full" />
            </div>
            <button onClick={handleCreate} disabled={creating || !name.trim() || !endsAt} className="omega-btn omega-btn-gold w-full py-2.5 text-sm">
              {creating ? <Loader2 className="size-4 animate-spin" /> : "Crear temporada"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-omega-gold" /></div>
        ) : (
          <>
            {/* Active season */}
            {active.map(s => (
              <div key={s.id} className="omega-card p-4 space-y-3 border-l-4 border-l-omega-green">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-omega-green uppercase tracking-wider">Activa</p>
                    <h3 className="text-sm font-black text-omega-text">Temporada {s.number}: {s.name}</h3>
                  </div>
                  <span className="omega-badge omega-badge-green">EN CURSO</span>
                </div>
                <p className="text-[11px] text-omega-muted">
                  Finaliza: {new Date(s.ends_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <button
                  onClick={() => handleAction(s.id, "complete")}
                  disabled={actionLoading === s.id}
                  className="omega-btn omega-btn-red w-full py-2.5 text-sm"
                >
                  {actionLoading === s.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                  Completar temporada (resetea estrellas)
                </button>
              </div>
            ))}

            {/* Upcoming */}
            {upcoming.map(s => (
              <div key={s.id} className="omega-card p-4 space-y-3 border-l-4 border-l-omega-blue">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-omega-blue uppercase tracking-wider">Proxima</p>
                    <h3 className="text-sm font-black text-omega-text">Temporada {s.number}: {s.name}</h3>
                  </div>
                  <span className="omega-badge omega-badge-blue">PROXIMA</span>
                </div>
                <button
                  onClick={() => handleAction(s.id, "start")}
                  disabled={actionLoading === s.id}
                  className="omega-btn omega-btn-green w-full py-2.5 text-sm"
                >
                  {actionLoading === s.id ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                  Iniciar temporada
                </button>
              </div>
            ))}

            {/* Completed */}
            {completed.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-omega-muted uppercase tracking-wider">Temporadas anteriores</h3>
                {completed.map(s => (
                  <div key={s.id} className="omega-card p-4 border-l-4 border-l-omega-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-omega-text">T{s.number}: {s.name}</h3>
                        <p className="text-[10px] text-omega-muted">
                          {new Date(s.starts_at).toLocaleDateString("es-AR", { month: "short", year: "numeric" })} — {new Date(s.ends_at).toLocaleDateString("es-AR", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className="omega-badge omega-badge-purple">COMPLETADA</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {seasons.length === 0 && (
              <div className="omega-card p-10 text-center space-y-3">
                <Calendar className="size-10 text-omega-muted/20 mx-auto" />
                <p className="text-sm text-omega-muted">No hay temporadas creadas</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
