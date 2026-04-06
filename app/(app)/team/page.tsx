"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Users,
  Crown,
  Star,
  UserPlus,
  LogOut,
  Trash2,
  Search,
  Check,
  X,
  Shield,
  Swords,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamMember {
  id: string;
  player_id: string;
  role: string;
  joined_at: string;
  player: {
    id: string;
    alias: string;
    avatar_url: string | null;
    stars: number;
    wins: number;
    losses: number;
  };
}

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  stars: number;
  wins: number;
  losses: number;
  captain_id: string;
  is_active: boolean;
  team_members: TeamMember[];
}

interface Invitation {
  id: string;
  status: string;
  created_at: string;
  team: { id: string; name: string; logo_url: string | null; stars: number };
  invited_by_player: { alias: string; avatar_url: string | null };
}

interface SearchPlayer {
  id: string;
  alias: string;
  avatar_url: string | null;
  stars: number;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [teamsEnabled, setTeamsEnabled] = useState(true);

  // Create team form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  // Invite player
  const [showInviteSearch, setShowInviteSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPlayer[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  // Confirm dialogs
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDissolve, setConfirmDissolve] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Check feature flag
    try {
      const configRes = await fetch("/api/app-config");
      if (configRes.ok) {
        const config = await configRes.json();
        if (config.teams_enabled === "false") {
          setTeamsEnabled(false);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }

    // Check my team
    const { data: memberData } = await supabase
      .from("team_members")
      .select("team_id, team:teams!team_id(id, is_active)")
      .eq("player_id", user.id)
      .limit(10);

    const activeTeamMember = (memberData ?? []).find(
      (m) => (m.team as unknown as { is_active: boolean })?.is_active
    );

    if (activeTeamMember) {
      const teamRef = activeTeamMember.team as unknown as { id: string; is_active: boolean };
      const res = await fetch(`/api/teams/${teamRef.id}`);
      if (res.ok) {
        const team = await res.json();
        setMyTeam(team);
      }
    }

    // Fetch invitations
    try {
      const invRes = await fetch("/api/teams/invitations");
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvitations(invData);
      }
    } catch { /* ignore */ }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search players
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("players")
        .select("id, alias, avatar_url, stars")
        .ilike("alias", `%${searchQuery}%`)
        .neq("id", userId ?? "")
        .limit(10);

      // Filter out players already in the team
      const memberIds = new Set(myTeam?.team_members?.map((m) => m.player_id) ?? []);
      setSearchResults((data ?? []).filter((p) => !memberIds.has(p.id)));
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, userId, myTeam]);

  // Handlers
  async function handleCreateTeam() {
    if (!teamName.trim() || teamName.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al crear equipo");
        return;
      }
      toast.success("Equipo creado");
      setShowCreateForm(false);
      await fetchData();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite(playerId: string) {
    if (!myTeam) return;
    setInviting(playerId);
    try {
      const res = await fetch(`/api/teams/${myTeam.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al invitar");
        return;
      }
      toast.success("Invitacion enviada");
      setShowInviteSearch(false);
      setSearchQuery("");
    } catch {
      toast.error("Error de conexion");
    } finally {
      setInviting(null);
    }
  }

  async function handleInvitationAction(invitationId: string, action: "accept" | "decline") {
    try {
      const res = await fetch("/api/teams/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitation_id: invitationId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Error");
        return;
      }
      toast.success(action === "accept" ? "Te uniste al equipo" : "Invitacion rechazada");
      await fetchData();
    } catch {
      toast.error("Error de conexion");
    }
  }

  async function handleLeave() {
    if (!myTeam) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/teams/${myTeam.id}/leave`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Error");
        return;
      }
      toast.success("Abandonaste el equipo");
      setMyTeam(null);
      setConfirmLeave(false);
      await fetchData();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLeaving(false);
    }
  }

  async function handleDissolve() {
    if (!myTeam) return;
    setDissolving(true);
    try {
      const res = await fetch(`/api/teams/${myTeam.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Error");
        return;
      }
      toast.success("Equipo disuelto");
      setMyTeam(null);
      setConfirmDissolve(false);
      await fetchData();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setDissolving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 text-omega-purple animate-spin" />
      </div>
    );
  }

  if (!teamsEnabled) {
    return (
      <div className="max-w-lg mx-auto pb-10 pt-6 px-4 space-y-6">
        <Link href="/dashboard" className="text-sm text-omega-muted hover:text-omega-text transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>
        <div className="omega-card p-8 text-center space-y-3">
          <Shield className="size-12 text-omega-muted/30 mx-auto" />
          <h2 className="text-xl font-black text-omega-text">Equipos deshabilitados</h2>
          <p className="text-sm text-omega-muted">La funcion de equipos no esta activa en este momento.</p>
        </div>
      </div>
    );
  }

  const isCaptain = myTeam?.captain_id === userId;
  const memberCount = myTeam?.team_members?.length ?? 0;

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-purple/20 via-omega-surface to-omega-blue/10 shadow-lg shadow-omega-purple/10">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/dashboard"
            className="text-sm text-omega-muted hover:text-omega-text transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-omega-purple/20 flex items-center justify-center ring-2 ring-omega-purple/30">
              <Users className="size-6 text-omega-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-black neon-purple">
                {myTeam ? myTeam.name : "MI EQUIPO"}
              </h1>
              <p className="text-xs text-omega-muted">
                {myTeam ? `${memberCount}/3 miembros` : "Unite o crea un equipo"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ HAS TEAM — Show team profile ═══ */}
      {myTeam && (
        <div className="px-4 space-y-5">
          {/* Team stats */}
          <div className="flex items-center justify-around rounded-xl bg-omega-card border border-omega-border/20 py-3 px-2">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Star className="size-4 text-omega-gold fill-omega-gold" />
                <span className="text-xl font-black text-omega-gold">{myTeam.stars}</span>
              </div>
              <p className="text-[10px] text-omega-muted uppercase">Estrellas</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <span className="text-xl font-black text-omega-green">{myTeam.wins}</span>
              <p className="text-[10px] text-omega-muted uppercase">Victorias</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <span className="text-xl font-black text-omega-red">{myTeam.losses}</span>
              <p className="text-[10px] text-omega-muted uppercase">Derrotas</p>
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
              <Users className="size-4" />
              Miembros ({memberCount}/3)
            </h2>
            {(myTeam.team_members ?? []).map((member) => (
              <div
                key={member.id}
                className={`omega-card px-4 py-3 flex items-center gap-3 ${
                  member.role === "captain" ? "border-l-4 border-l-omega-gold" : ""
                }`}
              >
                <div className="size-10 rounded-full overflow-hidden bg-omega-dark border border-omega-border/30 shrink-0">
                  {member.player.avatar_url ? (
                    <img src={member.player.avatar_url} alt={member.player.alias} className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-sm font-black text-omega-purple">
                      {member.player.alias.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-omega-text truncate">
                      {member.player.alias}
                    </p>
                    {member.role === "captain" && (
                      <Crown className="size-3.5 text-omega-gold shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-omega-muted">
                    <span>{member.player.stars} estrellas</span>
                    <span>-</span>
                    <span>{member.player.wins}W/{member.player.losses}L</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Invite button (captain only, < 3 members) */}
            {isCaptain && memberCount < 3 && (
              <button
                onClick={() => setShowInviteSearch(!showInviteSearch)}
                className="omega-btn omega-btn-purple w-full py-3 text-sm"
                data-testid="invite-player-btn"
              >
                <UserPlus className="size-5" />
                Invitar jugador
              </button>
            )}

            {/* Invite search */}
            {showInviteSearch && (
              <div className="omega-card p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-omega-muted pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por alias..."
                    className="omega-input pl-9"
                    autoFocus
                    data-testid="invite-search-input"
                  />
                </div>
                {searching && <Loader2 className="size-4 text-omega-purple animate-spin mx-auto" />}
                {searchResults.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-2">
                    <div className="size-8 rounded-full overflow-hidden bg-omega-dark border border-omega-border/30 shrink-0">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.alias} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                          {p.alias.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate">{p.alias}</p>
                      <p className="text-[10px] text-omega-muted">{p.stars} estrellas</p>
                    </div>
                    <button
                      onClick={() => handleInvite(p.id)}
                      disabled={inviting === p.id}
                      className="omega-btn omega-btn-green px-3 py-1.5 text-[10px]"
                      data-testid={`invite-${p.id}`}
                    >
                      {inviting === p.id ? <Loader2 className="size-3 animate-spin" /> : "Invitar"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {!isCaptain && (
              <>
                {!confirmLeave ? (
                  <button
                    onClick={() => setConfirmLeave(true)}
                    className="omega-btn omega-btn-secondary w-full py-3 text-sm"
                    data-testid="leave-team-btn"
                  >
                    <LogOut className="size-4" />
                    Abandonar equipo
                  </button>
                ) : (
                  <div className="omega-card p-4 space-y-3 border-l-4 border-l-omega-red">
                    <p className="text-sm text-omega-text">Seguro que queres abandonar?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmLeave(false)} className="omega-btn omega-btn-secondary flex-1 py-2 text-xs">
                        Cancelar
                      </button>
                      <button onClick={handleLeave} disabled={leaving} className="omega-btn omega-btn-red flex-1 py-2 text-xs">
                        {leaving ? <Loader2 className="size-3 animate-spin" /> : "Si, abandonar"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {isCaptain && (
              <>
                {!confirmDissolve ? (
                  <button
                    onClick={() => setConfirmDissolve(true)}
                    className="omega-btn omega-btn-secondary w-full py-3 text-sm text-omega-red"
                    data-testid="dissolve-team-btn"
                  >
                    <Trash2 className="size-4" />
                    Disolver equipo
                  </button>
                ) : (
                  <div className="omega-card p-4 space-y-3 border-l-4 border-l-omega-red">
                    <p className="text-sm text-omega-text font-bold">ATENCION: Esta accion es irreversible</p>
                    <p className="text-xs text-omega-muted">Se eliminara el equipo y todos los miembros seran removidos.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDissolve(false)} className="omega-btn omega-btn-secondary flex-1 py-2 text-xs">
                        Cancelar
                      </button>
                      <button onClick={handleDissolve} disabled={dissolving} className="omega-btn omega-btn-red flex-1 py-2 text-xs">
                        {dissolving ? <Loader2 className="size-3 animate-spin" /> : "Si, disolver"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ NO TEAM — Invitations + Create ═══ */}
      {!myTeam && (
        <div className="px-4 space-y-5">
          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
                <Mail className="size-4 text-omega-gold" />
                Invitaciones Pendientes
              </h2>
              {invitations.map((inv) => (
                <div key={inv.id} className="omega-card p-4 border-l-4 border-l-omega-gold">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-xl bg-omega-gold/15 flex items-center justify-center shrink-0">
                      <Users className="size-5 text-omega-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate">
                        {inv.team.name}
                      </p>
                      <p className="text-[10px] text-omega-muted">
                        Invitado por {inv.invited_by_player.alias}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="size-3 text-omega-gold fill-omega-gold" />
                      <span className="text-xs font-bold text-omega-gold">{inv.team.stars}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInvitationAction(inv.id, "decline")}
                      className="omega-btn omega-btn-secondary flex-1 py-2.5 text-xs gap-1"
                    >
                      <X className="size-3" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleInvitationAction(inv.id, "accept")}
                      className="omega-btn omega-btn-green flex-1 py-2.5 text-xs gap-1"
                    >
                      <Check className="size-3" />
                      Aceptar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create team */}
          {!showCreateForm ? (
            <div className="space-y-3">
              <div className="omega-card p-8 text-center space-y-4">
                <Swords className="size-12 text-omega-purple/30 mx-auto" />
                <div>
                  <h2 className="text-lg font-black text-omega-text">No tenes equipo</h2>
                  <p className="text-sm text-omega-muted mt-1">
                    Crea tu equipo o espera una invitacion
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="omega-btn omega-btn-purple px-6 py-3 text-sm"
                  data-testid="create-team-btn"
                >
                  <Users className="size-5" />
                  Crear equipo
                </button>
              </div>
            </div>
          ) : (
            <div className="omega-card p-5 space-y-4 border-l-4 border-l-omega-purple">
              <h2 className="text-sm font-bold text-omega-text flex items-center gap-2">
                <Users className="size-4 text-omega-purple" />
                Crear Equipo
              </h2>
              <div>
                <label className="text-xs text-omega-muted block mb-1.5">Nombre del equipo</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Nombre del equipo..."
                  className="omega-input"
                  maxLength={30}
                  autoFocus
                  data-testid="team-name-input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="omega-btn omega-btn-secondary flex-1 py-2.5 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={creating || teamName.trim().length < 2}
                  className="omega-btn omega-btn-purple flex-1 py-2.5 text-sm"
                  data-testid="confirm-create-team"
                >
                  {creating ? <Loader2 className="size-4 animate-spin" /> : "Crear"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
