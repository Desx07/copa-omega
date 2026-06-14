import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

// PATCH - Toggle is_hidden
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from("players")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!admin?.is_admin) {
    return Response.json({ error: "Solo administradores" }, { status: 403 });
  }

  const body = await request.json();

  // Build update payload — support both is_hidden and is_judge toggles
  const updateData: Record<string, boolean> = {};
  if (typeof body.is_hidden === "boolean") {
    updateData.is_hidden = body.is_hidden;
  }
  if (typeof body.is_judge === "boolean") {
    updateData.is_judge = body.is_judge;
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No hay campos para actualizar" }, { status: 400 });
  }

  // Usamos el cliente admin (service role) para el UPDATE: la RLS puede impedir
  // que un admin edite filas de otros jugadores y el update afectaría 0 filas
  // sin devolver error (toggle silencioso). El permiso ya se validó arriba.
  const adminClient = createAdminClient();
  const { data: updated, error } = await adminClient
    .from("players")
    .update(updateData)
    .eq("id", id)
    .select("id");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Si no se afectó ninguna fila, el jugador no existe (o el id es inválido):
  // devolvemos error explícito en vez de un success engañoso.
  if (!updated || updated.length === 0) {
    return Response.json({ error: "Jugador no encontrado" }, { status: 404 });
  }

  return Response.json({ success: true });
}

// DELETE - Delete user entirely
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from("players")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!admin?.is_admin) {
    return Response.json({ error: "Solo administradores" }, { status: 403 });
  }

  // Prevent deleting yourself
  if (id === user.id) {
    return Response.json({ error: "No podés eliminarte a vos mismo" }, { status: 400 });
  }

  // Use admin client to delete from auth (cascades to players)
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
