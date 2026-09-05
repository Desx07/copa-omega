import { redirect } from "next/navigation";

// El hub "/equipos" fue descartado: los accesos de equipos ahora son directos
// desde el dashboard (Mi Equipo, Ranking equipos, Liga) y el sorteo vive en la
// Zona Juez. Se deja este redirect para no romper enlaces/bookmarks viejos.
export default function EquiposPage() {
  redirect("/team");
}
