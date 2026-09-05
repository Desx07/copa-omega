import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "avatars";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Verifica que el usuario autenticado sea el capitán del equipo o un admin.
 * Devuelve el equipo si tiene permiso, o una Response de error si no.
 */
async function authorizeCaptainOrAdmin(
  id: string
): Promise<
  | { ok: true; teamName: string }
  | { ok: false; response: Response }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, response: Response.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("captain_id, name")
    .eq("id", id)
    .single();

  if (teamError || !team) {
    return { ok: false, response: Response.json({ error: "Equipo no encontrado" }, { status: 404 }) };
  }

  const { data: me, error: meError } = await supabase
    .from("players")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (meError) {
    return { ok: false, response: Response.json({ error: "Error verificando permisos" }, { status: 500 }) };
  }

  const isAdmin = me?.is_admin === true;
  const isCaptain = team.captain_id === user.id;

  if (!isCaptain && !isAdmin) {
    return {
      ok: false,
      response: Response.json(
        { error: "Solo el capitán del equipo o un admin puede cambiar el logo" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, teamName: team.name };
}

// POST — subir/cambiar el logo del equipo (capitán o admin)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await authorizeCaptainOrAdmin(id);
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Falta el archivo de imagen" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: "Formato no permitido (usá JPG, PNG o WEBP)" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "La imagen no puede pesar más de 5MB" }, { status: 400 });
    }

    // Path canónico único por equipo: teams/<teamId>.jpg
    // (el recortador del cliente siempre exporta JPEG, así que no quedan
    //  archivos huérfanos de distintas extensiones).
    const path = `teams/${id}.jpg`;
    const arrayBuffer = await file.arrayBuffer();

    // Subida server-side con service role: bypassa el RLS del bucket avatars
    // (que exige carpeta == uid) para poder usar la carpeta "teams/".
    const admin = createAdminClient();

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { upsert: true, contentType: "image/jpeg" });

    if (uploadError) {
      console.error("POST /api/teams/[id]/logo upload error:", uploadError);
      return Response.json({ error: "Error subiendo la imagen" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(path);
    const logoUrl = `${publicUrl}?t=${Date.now()}`; // cache-buster

    const { error: updateError } = await admin
      .from("teams")
      .update({ logo_url: logoUrl })
      .eq("id", id);

    if (updateError) {
      console.error("POST /api/teams/[id]/logo update error:", updateError);
      return Response.json({ error: "Error actualizando el equipo" }, { status: 500 });
    }

    return Response.json({ logo_url: logoUrl });
  } catch (err) {
    console.error("POST /api/teams/[id]/logo error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE — quitar el logo del equipo (capitán o admin)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await authorizeCaptainOrAdmin(id);
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();

    // Borrar el archivo del storage (ignorar error si no existe)
    const { error: removeError } = await admin.storage
      .from(BUCKET)
      .remove([`teams/${id}.jpg`]);
    if (removeError) {
      console.error("DELETE /api/teams/[id]/logo remove error:", removeError);
    }

    const { error: updateError } = await admin
      .from("teams")
      .update({ logo_url: null })
      .eq("id", id);

    if (updateError) {
      console.error("DELETE /api/teams/[id]/logo update error:", updateError);
      return Response.json({ error: "Error actualizando el equipo" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/teams/[id]/logo error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
