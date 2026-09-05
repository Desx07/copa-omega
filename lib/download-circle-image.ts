/**
 * Descarga una imagen recortada en CÍRCULO como PNG con fondo TRANSPARENTE.
 *
 * Pensado para armar flyers: el logo del equipo se exporta ya recortado en
 * círculo, en alta resolución y con las esquinas transparentes, listo para
 * pegar sobre cualquier fondo.
 */

/** Sanitiza el nombre del equipo para usarlo como nombre de archivo. */
function sanitizeFileName(name: string): string {
  const clean = name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // caracteres inválidos en filenames
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return clean.length > 0 ? clean : "equipo";
}

/**
 * Genera y dispara la descarga de un PNG circular transparente.
 *
 * @param imageUrl  URL pública de la imagen (bucket público de Supabase).
 * @param fileName  Nombre base del archivo (ej: nombre del equipo).
 * @param size      Lado del PNG cuadrado. Default 1024 (mínimo recomendado 512).
 */
export async function downloadCircleImage(
  imageUrl: string,
  fileName: string,
  size: number = 1024
): Promise<void> {
  // 1. Cargar la imagen con CORS habilitado para poder exportar el canvas
  //    sin que quede "tainted". El bucket público de Supabase responde con
  //    Access-Control-Allow-Origin: *, por lo que crossOrigin funciona.
  const img = new Image();
  img.crossOrigin = "anonymous";

  // Cache-buster solo para URLs http(s) sin query: fuerza una respuesta fresca
  // con headers CORS (evita reusar una respuesta cacheada sin esos headers, que
  // taintaría el canvas). No se toca en data:/blob: URLs ni si ya tienen query.
  const needsCacheBuster =
    /^https?:/i.test(imageUrl) && !imageUrl.includes("?");
  const finalSrc = needsCacheBuster ? `${imageUrl}?cb=${Date.now()}` : imageUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No se pudo cargar la imagen del logo"));
    img.src = finalSrc;
  });

  // 2. Dibujar en un canvas cuadrado con clip circular → esquinas transparentes
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no soporta canvas 2D");

  ctx.clearRect(0, 0, size, size); // asegurar fondo transparente

  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Dibujar la imagen tipo object-cover (centrada, sin deformar)
  const scale = Math.max(size / img.width, size / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.drawImage(img, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
  ctx.restore();

  // 3. Exportar a PNG (mantiene la transparencia) y disparar la descarga
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("No se pudo generar el PNG");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFileName(fileName)}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
