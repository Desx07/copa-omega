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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { BADGE_EMOJIS, ACCENT_COLORS } from "@/lib/titles";
import { ImageCropper } from "@/app/_components/image-cropper";
import BadgesDisplay from "@/app/_components/badges-display";

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
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);

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

    const [playerResult, beysResult, badgesResult] = await Promise.all([
      supabase
        .from("players")
        .select("id, full_name, alias, stars, wins, losses, is_eliminated, avatar_url, tagline, hide_beys, badge, accent_color, created_at")
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
    ]);

    if (playerResult.data) {
      setPlayer(playerResult.data);
      setTaglineInput(playerResult.data.tagline || "");
    }
    if (beysResult.data) setBeys(beysResult.data);
    if (badgesResult.data) setEarnedBadgeIds(badgesResult.data.map((b) => b.badge_id));
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
      toast.error("La imagen no puede pesar mas de 5MB");
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

  return (
    <>
      <div className="mx-auto max-w-md px-4 py-6 space-y-6">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors">
          <ArrowLeft className="size-4" />
          Volver
        </Link>

        {/* Avatar + Stats card */}
        <div className="relative overflow-hidden rounded-2xl border border-omega-purple/20 bg-gradient-to-br from-omega-card/60 to-omega-card/30 p-6 text-center space-y-4 backdrop-blur-sm">
          {/* Avatar */}
          <div className="relative inline-block">
            <div className={`size-32 rounded-full border-2 ${accentConfig.border} overflow-hidden bg-omega-dark mx-auto`}>
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
              className="absolute bottom-0 right-0 size-8 rounded-full bg-omega-purple text-white flex items-center justify-center shadow-lg hover:bg-omega-purple-glow transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
          </div>

          {/* Name + badge */}
          <div>
            <p className="text-lg font-black text-omega-text">
              {player.badge && <span className="mr-1">{BADGE_EMOJIS[player.badge]}</span>}
              {player.alias}
            </p>
          </div>

          {/* Tagline */}
          {editingTagline ? (
            <div className="flex gap-2 max-w-xs mx-auto">
              <input
                type="text"
                value={taglineInput}
                onChange={(e) => setTaglineInput(e.target.value)}
                maxLength={60}
                placeholder="Tu frase de batalla..."
                className="flex-1 min-w-0 rounded-lg border border-omega-border bg-omega-dark px-3 py-2 text-sm text-omega-text text-center placeholder:text-omega-muted/50 outline-none focus:border-omega-purple"
                autoFocus
              />
              <button
                onClick={() => { updateField("tagline", taglineInput.trim() || null); setEditingTagline(false); }}
                className="px-3 py-2 rounded-lg bg-omega-purple text-white text-xs font-bold"
              >
                {savingField === "tagline" ? <Loader2 className="size-3 animate-spin" /> : "OK"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTagline(true)}
              className="flex items-center justify-center gap-1.5 mx-auto text-sm text-omega-muted hover:text-omega-purple transition-colors"
            >
              <MessageSquare className="size-3.5" />
              {player.tagline ? (
                <span className="italic">&ldquo;{player.tagline}&rdquo;</span>
              ) : (
                <span>Agregar frase de batalla</span>
              )}
            </button>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="size-4 text-omega-gold fill-omega-gold star-glow" />
                <span className="text-2xl font-black text-omega-gold">{player.stars}</span>
              </div>
              <p className="text-[11px] text-omega-muted">estrellas</p>
            </div>
            <div className="w-px h-8 bg-omega-border" />
            <div className="text-center">
              <p className="text-lg font-black">
                <span className="text-omega-green">{player.wins}</span>
                <span className="text-omega-muted/50"> / </span>
                <span className="text-omega-red">{player.losses}</span>
              </p>
              <p className="text-[11px] text-omega-muted">victorias / derrotas</p>
            </div>
          </div>

          <p className="text-[11px] text-omega-muted/60 flex items-center justify-center gap-1">
            <Calendar className="size-3" />
            Blader desde {memberSince}
          </p>

          {player.is_eliminated && (
            <span className="inline-flex items-center rounded-full bg-omega-red/10 border border-omega-red/30 px-3 py-1 text-xs font-bold text-omega-red">
              ELIMINADO
            </span>
          )}
        </div>

        {/* Personalización */}
        <div className="rounded-2xl border border-omega-border/40 bg-omega-card/30 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-omega-border bg-omega-card/60">
            <h2 className="text-sm font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
              <Palette className="size-4 text-omega-gold" />
              Personalizar
            </h2>
          </div>

          <div className="p-4 space-y-4">
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
          </div>
        </div>

        {/* Badges / Achievements */}
        <BadgesDisplay earnedBadgeIds={earnedBadgeIds} />

        {/* Beys section */}
        <div className="rounded-2xl border border-omega-border/40 bg-omega-card/30 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-omega-border bg-omega-card/60">
            <h2 className="text-sm font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
              <Swords className="size-4 text-omega-blue" />
              Mis Beys
            </h2>
          </div>

          {beys.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-omega-muted/70">No tenés beys cargados todavía</p>
            </div>
          ) : (
            <div className="divide-y divide-omega-border/30">
              {beys.map((bey) => {
                const config = beyTypeConfig[bey.type];
                const Icon = config.icon;
                return (
                  <div key={bey.id} className="flex items-center gap-3 px-4 py-3 hover:bg-omega-card/60 transition-colors">
                    <div className={`size-8 rounded-lg border flex items-center justify-center ${config.bg}`}>
                      <Icon className={`size-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-omega-text truncate">{bey.name}</p>
                      <p className={`text-[11px] font-medium ${config.color}`}>{config.label}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteBey(bey.id)}
                      className="size-8 rounded-lg flex items-center justify-center text-omega-muted hover:text-omega-red hover:bg-omega-red/10 transition-all"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-4 border-t border-omega-border bg-omega-card/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={newBeyName}
                onChange={(e) => setNewBeyName(e.target.value)}
                placeholder="Nombre del bey"
                maxLength={40}
                className="flex-1 min-w-0 rounded-lg border border-omega-border bg-omega-dark px-3 py-2 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-purple focus:ring-1 focus:ring-omega-purple/30 transition-all"
              />
              <select
                value={newBeyType}
                onChange={(e) => setNewBeyType(e.target.value as Bey["type"])}
                className="rounded-lg border border-omega-border bg-omega-dark px-2 py-2 text-sm text-omega-text outline-none focus:border-omega-purple transition-all"
              >
                <option value="attack">Ataque</option>
                <option value="defense">Defensa</option>
                <option value="stamina">Stamina</option>
                <option value="balance">Balance</option>
              </select>
              <button
                onClick={handleAddBey}
                disabled={addingBey || !newBeyName.trim()}
                className="flex items-center justify-center size-10 rounded-lg bg-omega-purple text-white hover:bg-omega-purple-glow transition-colors disabled:opacity-50 shrink-0"
              >
                {addingBey ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-omega-border bg-omega-card/40 py-3 text-sm font-medium text-omega-muted hover:text-omega-red hover:border-omega-red/30 transition-all"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
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
