/**
 * Client-side image upload utility.
 * Resizes an image file to a max width, converts to JPEG, and uploads to Supabase Storage.
 */

import { createClient } from "@/lib/supabase/client";

/**
 * Resize an image file to a max width while maintaining aspect ratio.
 * Returns a JPEG Blob.
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;

      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload a file to Supabase Storage, resized to JPEG.
 * Returns the public URL with a cache-buster.
 */
export async function uploadImage(
  bucket: string,
  path: string,
  file: File,
  maxWidth: number = 1200
): Promise<string> {
  const supabase = createClient();
  const blob = await resizeImage(file, maxWidth);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return `${publicUrl}?t=${Date.now()}`;
}
