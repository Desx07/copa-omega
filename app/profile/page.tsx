"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  ArrowLeft,
  Camera,
  Loader2,
  Trash2,
  Plus,
  Swords,
  ShieldHalf,
  Timer,
  Scale,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Player {
  id: string;
  full_name: string;
  alias: string;
  stars: number;
  wins: number;
  losses: number;
  is_eliminated: boolean;
  avatar_url: string | null;
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

  // New bey form
  const [newBeyName, setNewBeyName] = useState("");
  const [newBeyType, setNewBeyType] = useState<Bey["type"]>("attack");
  const [addingBey, setAddingBey] = useState(false);

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

    const [playerResult, beysResult] = await Promise.all([
      supabase
        .from("players")
        .select("id, full_name, alias, stars, wins, losses, is_eliminated, avatar_url")
        .eq("id", user.id)
        .single(),
      supabase
        .from("beys")
        .select("id, name, type")
        .eq("player_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

    if (playerResult.data) setPlayer(playerResult.data);
    if (beysResult.data) setBeys(beysResult.data);
    setLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !player) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${player.id}/avatar.${ext}`;

      // Remove old avatar if exists
      await supabase.storage.from("avatars").remove([path]);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        toast.error("Error subiendo imagen");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // Add cache buster
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("players")
        .update({ avatar_url: avatarUrl })
        .eq("id", player.id);

      if (updateError) {
        toast.error("Error actualizando perfil");
        return;
      }

      setPlayer({ ...player, avatar_url: avatarUrl });
      toast.success("Foto actualizada!");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setUploading(false);
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

      if (error) {
        toast.error("Error agregando bey");
        return;
      }

      setBeys([...beys, data]);
      setNewBeyName("");
      toast.success("Bey agregado!");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setAddingBey(false);
    }
  }

  async function handleDeleteBey(beyId: string) {
    const { error } = await supabase.from("beys").delete().eq("id", beyId);
    if (error) {
      toast.error("Error eliminando bey");
      return;
    }
    setBeys(beys.filter((b) => b.id !== beyId));
    toast.success("Bey eliminado");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-omega-purple" />
      </div>
    );
  }

  if (!player) return null;

  return (
    <div className="min-h-screen bg-omega-black">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-omega-purple)_0%,_transparent_60%)] opacity-10 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-md px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center justify-center size-10 rounded-xl bg-omega-card border border-omega-border text-omega-muted hover:text-omega-blue hover:border-omega-blue/50 transition-all"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-xl font-black neon-purple">MI PERFIL</h1>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center size-10 rounded-xl bg-omega-card border border-omega-border text-omega-muted hover:text-omega-red hover:border-omega-red/50 transition-all"
          >
            <LogOut className="size-5" />
          </button>
        </div>

        {/* Avatar + Stats card */}
        <div className="rounded-2xl border border-omega-border bg-omega-card/60 p-6 text-center space-y-4 backdrop-blur-sm">
          {/* Avatar */}
          <div className="relative inline-block">
            <div className="size-24 rounded-full border-2 border-omega-purple overflow-hidden bg-omega-dark mx-auto">
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={player.alias}
                  className="size-full object-cover"
                />
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
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Name & alias */}
          <div>
            <p className="text-lg font-black text-omega-text">{player.alias}</p>
            <p className="text-sm text-omega-muted">{player.full_name}</p>
          </div>

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

          {player.is_eliminated && (
            <span className="inline-flex items-center rounded-full bg-omega-red/10 border border-omega-red/30 px-3 py-1 text-xs font-bold text-omega-red">
              ELIMINADO
            </span>
          )}
        </div>

        {/* Beys section */}
        <div className="rounded-2xl border border-omega-border bg-omega-card/40 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-omega-border bg-omega-card/60">
            <h2 className="text-sm font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
              <Swords className="size-4 text-omega-purple" />
              Mis Beys
            </h2>
          </div>

          {/* Bey list */}
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
                  <div
                    key={bey.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-omega-card/60 transition-colors"
                  >
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

          {/* Add bey form */}
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
                {addingBey ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
