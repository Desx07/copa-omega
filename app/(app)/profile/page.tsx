"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Camera,
  ArrowLeft,
  Loader2,
  Trash2,
  Plus,
  Swords,
  ShieldHalf,
  Timer,
  Scale,
  LogOut,
  MessageSquare,
  Eye,
  EyeOff,
  Palette,
  Calendar,
  Trophy,
  ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { BADGE_EMOJIS, ACCENT_COLORS } from "@/lib/titles";
import { ImageCropper } from "@/app/_components/image-cropper";
import { uploadImage } from "@/lib/upload-image";
import BadgesDisplay from "@/app/_components/badges-display";
import TournamentBadgesDisplay from "@/app/_components/tournament-badges-display";
import PushToggle from "@/app/_components/push-toggle";
import ReferralCard from "@/app/_components/referral-card";

interface Player {
  id: string;
  full_name: string;
  alias: string;
  stars: number;
  wins: number;
  losses: number;
  is_eliminated: boolean;
  avatar_url: string | null;
  tagline: string | null;
  hide_beys: boolean;
  badge: string | null;
  accent_color: string;
  created_at: string;
  profile_card_url: string | null;
  referral_code: string | null;
}

interface Bey {
  id: string;
  name: string;
  type: "attack" | "defense" | "stamina" | "balance";
}

const beyTypeConfig = {
  attack: { label: "Ataque", icon: Swords, color: "text-omega-red", bg: "bg-omega-red/10 border-omega-red/30" },
  defense: { label: "Defensa", icon: ShieldHalf, color: "text-omega-blue", bg: "bg-omega-blue/10 border-omega-blue/30" },
  stamina: { label: "Stamina", icon: Timer, color: "text-omega-green", bg: "bg-omega-green/10 border-omega-green/30" },
  balance: { label: "Balance", icon: Scale, color: "text-omega-purple", bg: "bg-omega-purple/10 border-omega-purple/30" },
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [player, setPlayer] = useState<Player | null>(null);
  const [beys, setBeys] = useState<Bey[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  const [newBeyName, setNewBeyName] = useState("");
  const [newBeyType, setNewBeyType] = useState<Bey["type"]>("attack");
  const [addingBey, setAddingBey] = useState(false);

  const [editingTagline, setEditingTagline] = useState(false);
  const [taglineInput, setTaglineInput] = useState("");

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const profileCardInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProfileCard, setUploadingProfileCard] = useState(false);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [tournamentBadges, setTournamentBadges] = useState<
    { tournament_name: string; logo_url: string | null; position: number }[]
  >([]);
  const [rank, setRank] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const [playerResult, beysResult, badgesResult, allPlayersResult, tournamentBadgesResult] = await Promise.all([
      supabase
        .from("players")
        .select("id, full_name, alias, stars, wins, losses, is_eliminated, avatar_url, tagline, hide_beys, badge, accent_color, created_at, profile_card_url, referral_code")
        .eq("id", user.id)
        .single(),
      supabase
        .from("beys")
        .select("id, name, type")
        .eq("player_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("player_badges")
        .select("badge_id")
        .eq("player_id", user.id),
      supabase
        .from("players")
        .select("id")
        .eq("is_hidden", false)
        .order("stars", { ascending: false })
        .order("wins", { ascending: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("tournament_badges")
        .select("position, tournament:tournaments!tournament_id(name, logo_url)")
        .eq("player_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (playerResult.data) {
      setPlayer(playerResult.data);
      setTaglineInput(playerResult.data.tagline || "");
    }
    if (beysResult.data) setBeys(beysResult.data);
    if (badgesResult.data) setEarnedBadgeIds(badgesResult.data.map((b) => b.badge_id));
    if (tournamentBadgesResult.data) {
      setTournamentBadges(
        tournamentBadgesResult.data.map((tb) => {
          const tournament = tb.tournament as unknown as { name: string; logo_url: string | null };
          return {
            tournament_name: tournament?.name ?? "Torneo",
            logo_url: tournament?.logo_url ?? null,
            position: tb.position,
          };
        })
      );
    }
    if (allPlayersResult.data) {
      setTotalPlayers(allPlayersResult.data.length);
      const r = allPlayersResult.data.findIndex((p) => p.id === user.id) + 1;
      setRank(r);
    }
    setLoading(false);
  }

  async function updateField(field: string, value: unknown) {
    if (!player) return;
    setSavingField(field);
    const { error } = await supabase
      .from("players")
      .update({ [field]: value })
      .eq("id", player.id);
    if (error) {
      toast.error("Error guardando");
    } else {
      setPlayer({ ...player, [field]: value } as Player);
      toast.success("Guardado!");
    }
    setSavingField(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleCroppedUpload(blob: Blob) {
    if (!player) return;
    setCropSrc(null);
    setUploading(true);
    try {
      const path = `${player.id}/avatar.jpeg`;
      await supabase.storage.from("avatars").remove([path]);
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) { toast.error("Error subiendo imagen"); return; }

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("players")
        .update({ avatar_url: avatarUrl })
        .eq("id", player.id);

      if (updateError) { toast.error("Error actualizando perfil"); return; }
      setPlayer({ ...player, avatar_url: avatarUrl });
      toast.success("Foto actualizada!");
    } catch { toast.error("Error de conexión"); }
    finally { setUploading(false); }
  }

  async function handleProfileCardUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !player) return;
    e.target.value = "";

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no puede pesar mas de 10MB");
      return;
    }

    setUploadingProfileCard(true);
    try {
      const path = `${player.id}/profile-card.jpeg`;
      const publicUrl = await uploadImage("avatars", path, file, 1200);

      const { error: updateError } = await supabase
        .from("players")
        .update({ profile_card_url: publicUrl })
        .eq("id", player.id);

      if (updateError) {
        toast.error("Error actualizando perfil");
        return;
      }
      setPlayer({ ...player, profile_card_url: publicUrl });
      toast.success("Ficha de jugador actualizada!");
    } catch {
      toast.error("Error subiendo imagen");
    } finally {
      setUploadingProfileCard(false);
    }
  }

  async function handleRemoveProfileCard() {
    if (!player) return;
    setUploadingProfileCard(true);
    try {
      const { error } = await supabase
        .from("players")
        .update({ profile_card_url: null })
        .eq("id", player.id);
      if (error) {
        toast.error("Error eliminando ficha");
        return;
      }
      setPlayer({ ...player, profile_card_url: null });
      toast.success("Ficha eliminada");
    } catch {
      toast.error("Error de conexion");
    } finally {
      setUploadingProfileCard(false);
    }
  }

  async function handleAddBey() {
    if (!newBeyName.trim() || !player) return;
    setAddingBey(true);
    try {
      const { data, error } = await supabase
        .from("beys")
        .insert({ player_id: player.id, name: newBeyName.trim(), type: newBeyType })
        .select("id, name, type")
        .single();
      if (error) { toast.error("Error agregando bey"); return; }
      setBeys([...beys, data]);
      setNewBeyName("");
      toast.success("Bey agregado!");
    } catch { toast.error("Error de conexión"); }
    finally { setAddingBey(false); }
  }

  async function handleDeleteBey(beyId: string) {
    const { error } = await supabase.from("beys").delete().eq("id", beyId);
    if (error) { toast.error("Error eliminando bey"); return; }
    setBeys(beys.filter((b) => b.id !== beyId));
    toast.success("Bey eliminado");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-omega-purple" />
      </div>
    );
  }

  if (!player) return null;

  const accentConfig = ACCENT_COLORS[player.accent_color] || ACCENT_COLORS.purple;
  const memberSince = new Date(player.created_at).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const winRate = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;

  return (
    <>
      <div className="max-w-md mx-auto pb-10 space-y-5">
        {/* Back */}
        <div className="px-4 pt-2">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </div>

        {/* ═══ HERO BANNER ═══ */}
        <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-purple/30 via-omega-surface to-omega-blue/15 px-6 pt-8 pb-10 shadow-lg shadow-omega-purple/40">
          {/* Decorative orbs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-omega-purple/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-omega-blue/15 rounded-full blur-[60px] pointer-events-none" />

          {/* Avatar centered */}
          <div className="relative flex flex-col items-center">
            <div className="relative">
              <div className={`size-28 rounded-full border-2 ${accentConfig.border} overflow-hidden bg-omega-dark ring-4 ring-omega-card shadow-lg`}>
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.alias} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-3xl font-black text-omega-purple">
                    {player.alias.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 size-9 rounded-full bg-omega-purple text-white flex items-center justify-center shadow-lg hover:bg-omega-purple-glow transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
            </div>

            {/* Name + badge */}
            <p className="text-xl font-black text-omega-text mt-3">
              {player.badge && <span className="mr-1">{BADGE_EMOJIS[player.badge]}</span>}
              {player.alias}
            </p>

            {/* Tagline */}
            {editingTagline ? (
              <div className="flex gap-2 max-w-xs mx-auto mt-2">
                <input
                  type="text"
                  value={taglineInput}
                  onChange={(e) => setTaglineInput(e.target.value)}
                  maxLength={60}
                  placeholder="Tu frase de batalla..."
                  className="omega-input flex-1 min-w-0 text-center"
                  autoFocus
                />
                <button
                  onClick={() => { updateField("tagline", taglineInput.trim() || null); setEditingTagline(false); }}
                  className="omega-btn omega-btn-purple px-3 py-2 text-xs"
                >
                  {savingField === "tagline" ? <Loader2 className="size-3 animate-spin" /> : "OK"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTagline(true)}
                className="flex items-center justify-center gap-1.5 mt-1.5 text-sm text-omega-muted hover:text-omega-purple transition-colors"
              >
                <MessageSquare className="size-3.5" />
                {player.tagline ? (
                  <span className="italic">&ldquo;{player.tagline}&rdquo;</span>
                ) : (
                  <span>Agregar frase de batalla</span>
                )}
              </button>
            )}

            {player.is_eliminated && (
              <span className="omega-badge omega-badge-red mt-2">ELIMINADO</span>
            )}
          </div>

          {/* Stats strip inside hero */}
          <div className="relative flex items-center justify-around rounded-xl bg-omega-dark/60 border border-white/[0.06] py-2.5 px-2 mt-5">
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="size-3.5 text-omega-gold fill-omega-gold star-glow" />
              <span className="text-xl font-black neon-gold">{player.stars}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            {rank > 0 && (
              <>
                <div className="flex items-center gap-1.5 text-sm">
                  <Trophy className="size-3.5 text-omega-gold" />
                  <span className="font-bold text-omega-gold">#{rank}</span>
                  <span className="text-omega-muted text-xs">de {totalPlayers}</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
              </>
            )}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="font-bold text-omega-green">{player.wins}W</span>
              <span className="text-omega-muted/50">/</span>
              <span className="font-bold text-omega-red">{player.losses}L</span>
            </div>
            {winRate > 0 && (
              <>
                <div className="w-px h-4 bg-white/10" />
                <span className="font-bold text-omega-blue text-sm">{winRate}%</span>
              </>
            )}
          </div>

          <p className="relative text-[11px] text-omega-muted/60 flex items-center justify-center gap-1 mt-3">
            <Calendar className="size-3" />
            Blader desde {memberSince}
          </p>
        </div>

        {/* ═══ PERSONALIZAR ═══ */}
        <div className="px-4 space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-omega-gold" />
            <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">Personalizar</h2>
          </div>

          <div className="omega-card p-4 space-y-4">
            {/* Badge emoji */}
            <div>
              <p className="text-xs text-omega-muted mb-2">Emoji de perfil</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(BADGE_EMOJIS).map(([key, emoji]) => (
                  <button
                    key={key}
                    onClick={() => updateField("badge", player.badge === key ? null : key)}
                    className={`size-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                      player.badge === key
                        ? "bg-omega-purple/20 border-2 border-omega-purple scale-110"
                        : "bg-omega-dark border border-omega-border hover:border-omega-purple/50"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div>
              <p className="text-xs text-omega-muted mb-2">Color de perfil</p>
              <div className="flex gap-2">
                {Object.entries(ACCENT_COLORS).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => updateField("accent_color", key)}
                    className={`size-8 rounded-full ${config.bg} transition-all ${
                      player.accent_color === key
                        ? "ring-2 ring-offset-2 ring-offset-omega-card scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title={config.label}
                  />
                ))}
              </div>
            </div>

            {/* Hide beys toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {player.hide_beys ? <EyeOff className="size-4 text-omega-muted" /> : <Eye className="size-4 text-omega-green" />}
                <span className="text-sm text-omega-muted">
                  {player.hide_beys ? "Beys ocultos en tu perfil" : "Beys visibles en tu perfil"}
                </span>
              </div>
              <button
                onClick={() => updateField("hide_beys", !player.hide_beys)}
                className={`w-10 h-6 rounded-full transition-all relative ${player.hide_beys ? "bg-omega-border" : "bg-omega-green"}`}
              >
                <div className={`size-4 rounded-full bg-white absolute top-1 transition-all ${player.hide_beys ? "left-1" : "left-5"}`} />
              </button>
            </div>

            {/* Push notifications toggle */}
            <PushToggle />
          </div>
        </div>

        {/* ═══ FICHA DE JUGADOR (Profile Card) ═══ */}
        <div className="px-4 space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 text-omega-purple" />
            <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">Ficha de jugador</h2>
          </div>

          {/* Current profile card preview */}
          {player.profile_card_url && (
            <div className="omega-card shadow-sm overflow-hidden">
              <img
                src={player.profile_card_url}
                alt={`Ficha de ${player.alias}`}
                className="w-full object-contain"
                loading="lazy"
              />
            </div>
          )}

          <input
            ref={profileCardInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleProfileCardUpload}
          />

          <div className="flex gap-2">
            <button
              onClick={() => profileCardInputRef.current?.click()}
              disabled={uploadingProfileCard}
              className="omega-btn omega-btn-secondary flex-1 px-4 py-2 text-xs"
            >
              {uploadingProfileCard ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ImageIcon className="size-3.5" />
              )}
              {player.profile_card_url
                ? "Cambiar ficha de jugador"
                : "Subir ficha de jugador"}
            </button>
            {player.profile_card_url && (
              <button
                onClick={handleRemoveProfileCard}
                disabled={uploadingProfileCard}
                className="omega-btn omega-btn-secondary px-3 py-2 text-xs text-omega-red hover:bg-omega-red/10"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ═══ TOURNAMENT BADGES ═══ */}
        {tournamentBadges.length > 0 && (
          <div className="mx-4">
            <TournamentBadgesDisplay badges={tournamentBadges} />
          </div>
        )}

        {/* ═══ BADGES ═══ */}
        <div className="mx-4">
          <BadgesDisplay earnedBadgeIds={earnedBadgeIds} />
        </div>

        {/* ═══ BEYS ═══ */}
        <div className="px-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="size-4 text-omega-blue" />
              <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">Mis Beys</h2>
            </div>
            <span className="omega-badge omega-badge-blue">{beys.length}</span>
          </div>

          {beys.length === 0 ? (
            <div className="omega-card p-6 text-center">
              <Swords className="size-10 text-omega-muted/20 mx-auto mb-2" />
              <p className="text-sm text-omega-muted/70">No tenés beys cargados todavía</p>
            </div>
          ) : (
            <div className="space-y-2">
              {beys.map((bey) => {
                const config = beyTypeConfig[bey.type];
                const Icon = config.icon;
                return (
                  <div
                    key={bey.id}
                    className={`rounded-xl border-l-4 ${
                      bey.type === "attack" ? "border-l-omega-red" :
                      bey.type === "defense" ? "border-l-omega-blue" :
                      bey.type === "stamina" ? "border-l-omega-green" :
                      "border-l-omega-purple"
                    } bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3 group`}
                  >
                    <div className={`size-8 rounded-lg border flex items-center justify-center ${config.bg}`}>
                      <Icon className={`size-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate leading-tight">{bey.name}</p>
                      <p className={`text-[10px] font-medium ${config.color} leading-tight`}>{config.label}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteBey(bey.id)}
                      className="size-7 rounded-md flex items-center justify-center text-omega-muted hover:text-omega-red hover:bg-omega-red/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add bey form */}
          <div className="omega-card p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newBeyName}
                onChange={(e) => setNewBeyName(e.target.value)}
                placeholder="Nombre del bey"
                maxLength={40}
                className="omega-input flex-1 min-w-0"
              />
              <select
                value={newBeyType}
                onChange={(e) => setNewBeyType(e.target.value as Bey["type"])}
                className="omega-input w-auto"
              >
                <option value="attack">Ataque</option>
                <option value="defense">Defensa</option>
                <option value="stamina">Stamina</option>
                <option value="balance">Balance</option>
              </select>
              <button
                onClick={handleAddBey}
                disabled={addingBey || !newBeyName.trim()}
                className="omega-btn omega-btn-purple size-10 shrink-0"
              >
                {addingBey ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ REFERRAL ═══ */}
        {player.referral_code && (
          <div className="px-4">
            <ReferralCard referralCode={player.referral_code} />
          </div>
        )}

        {/* ═══ LOGOUT ═══ */}
        <div className="px-4">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="omega-btn omega-btn-secondary w-full py-3 text-sm hover:text-omega-red hover:border-omega-red/30"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Image cropper modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onCropDone={handleCroppedUpload}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </>
  );
}
