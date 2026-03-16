#!/usr/bin/env python3
"""
generate_video.py
Recibe un script de texto y genera un video MP4 listo para YouTube Shorts.
Uso: python generate_video.py --script "texto..." --topic "tema" --output /app/videos/
"""

import argparse
import os
import sys
import json
import requests
from pathlib import Path
from gtts import gTTS
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import subprocess
import textwrap
import random

# ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────

VIDEO_W = 1080
VIDEO_H = 1920
UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_KEY", "")  # opcional

# Paletas de colores por estilo
PALETTES = {
    "motivacional": [
        {"bg": (15, 15, 35), "accent": (255, 180, 0), "text": (255, 255, 255)},
        {"bg": (20, 0, 40), "accent": (180, 0, 255), "text": (255, 255, 255)},
        {"bg": (0, 30, 60), "accent": (0, 200, 255), "text": (255, 255, 255)},
    ],
    "tecnologia": [
        {"bg": (5, 15, 25), "accent": (0, 255, 150), "text": (255, 255, 255)},
        {"bg": (10, 10, 30), "accent": (100, 150, 255), "text": (255, 255, 255)},
    ],
    "gaming": [
        {"bg": (10, 0, 20), "accent": (255, 50, 100), "text": (255, 255, 255)},
        {"bg": (0, 10, 25), "accent": (50, 255, 200), "text": (255, 255, 255)},
    ],
}

# ─── GENERACIÓN DE AUDIO ──────────────────────────────────────────────────────

def text_to_speech(text: str, output_path: str, lang: str = "es") -> str:
    """Convierte texto a audio MP3 usando gTTS (Google TTS - GRATIS)."""
    print(f"🎙️  Generando audio...")
    
    # Limpiar el texto de caracteres especiales que confunden a gTTS
    clean_text = text.replace("*", "").replace("#", "").replace("_", "")
    
    tts = gTTS(text=clean_text, lang=lang, slow=False)
    tts.save(output_path)
    
    print(f"✅ Audio guardado: {output_path}")
    return output_path


# ─── GENERACIÓN DE IMÁGENES ──────────────────────────────────────────────────

def create_gradient_image(width: int, height: int, palette: dict) -> Image.Image:
    """Crea imagen de fondo con gradiente y efectos visuales."""
    img = Image.new("RGB", (width, height), palette["bg"])
    draw = ImageDraw.Draw(img)
    
    # Gradiente vertical
    bg = palette["bg"]
    accent = palette["accent"]
    for y in range(height):
        ratio = y / height
        r = int(bg[0] + (accent[0] - bg[0]) * ratio * 0.3)
        g = int(bg[1] + (accent[1] - bg[1]) * ratio * 0.3)
        b = int(bg[2] + (accent[2] - bg[2]) * ratio * 0.3)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Círculos decorativos (efecto moderno)
    for _ in range(5):
        x = random.randint(0, width)
        y = random.randint(0, height)
        r = random.randint(100, 400)
        alpha_color = (*accent, 30)
        overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.ellipse([x-r, y-r, x+r, y+r], fill=alpha_color)
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    
    return img


def add_text_to_image(img: Image.Image, text: str, palette: dict) -> Image.Image:
    """Agrega texto al centro de la imagen con sombra y borde."""
    draw = ImageDraw.Draw(img)
    
    # Intentar cargar fuente del sistema, sino usar default
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 42)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Envolver texto
    wrapped = textwrap.fill(text, width=18)
    lines = wrapped.split("\n")
    
    # Calcular posición central
    total_height = len(lines) * 90
    start_y = (VIDEO_H - total_height) // 2
    
    for i, line in enumerate(lines):
        # Calcular ancho del texto para centrar
        bbox = draw.textbbox((0, 0), line, font=font_large)
        text_w = bbox[2] - bbox[0]
        x = (VIDEO_W - text_w) // 2
        y = start_y + i * 90
        
        # Sombra
        shadow_color = (0, 0, 0)
        for offset in [(3, 3), (-3, -3), (3, -3), (-3, 3)]:
            draw.text((x + offset[0], y + offset[1]), line, font=font_large, fill=shadow_color)
        
        # Texto principal
        draw.text((x, y), line, font=font_large, fill=palette["text"])
    
    # Línea decorativa con color accent
    accent = palette["accent"]
    draw.rectangle([80, start_y - 30, VIDEO_W - 80, start_y - 20], fill=accent)
    draw.rectangle([80, start_y + total_height + 20, VIDEO_W - 80, start_y + total_height + 30], fill=accent)
    
    return img


def generate_slide_images(script: str, topic: str, style: str, output_dir: str) -> list:
    """Genera N imágenes tipo slide para el video."""
    print(f"🖼️  Generando imágenes...")
    
    palette_list = PALETTES.get(style, PALETTES["motivacional"])
    
    # Dividir script en secciones (una imagen por sección)
    sentences = [s.strip() for s in script.replace(".", ".|").replace("!", "!|").replace("?", "?|").split("|") if s.strip()]
    
    # Agrupar en máximo 6 slides
    chunk_size = max(1, len(sentences) // 6)
    chunks = []
    for i in range(0, len(sentences), chunk_size):
        chunk = " ".join(sentences[i:i+chunk_size])
        if chunk:
            chunks.append(chunk[:150])  # máximo 150 chars por slide
    
    image_paths = []
    
    for i, text_chunk in enumerate(chunks[:6]):
        palette = palette_list[i % len(palette_list)]
        
        # Crear imagen base con gradiente
        img = create_gradient_image(VIDEO_W, VIDEO_H, palette)
        
        # Agregar texto
        img = add_text_to_image(img, text_chunk, palette)
        
        # Agregar número de slide y topic pequeño
        draw = ImageDraw.Draw(img)
        try:
            font_topic = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
        except:
            font_topic = ImageFont.load_default()
        draw.text((80, 80), f"#{topic.upper()}", font=font_topic, fill=palette["accent"])
        
        # Guardar
        img_path = os.path.join(output_dir, f"slide_{i:02d}.jpg")
        img.save(img_path, "JPEG", quality=95)
        image_paths.append(img_path)
        print(f"  ✅ Slide {i+1}/{len(chunks)}: {img_path}")
    
    return image_paths


# ─── ENSAMBLAJE DE VIDEO ──────────────────────────────────────────────────────

def assemble_video(image_paths: list, audio_path: str, output_path: str) -> str:
    """Usa FFmpeg para combinar imágenes + audio en un MP4 vertical."""
    print(f"🎬 Ensamblando video...")
    
    # Obtener duración del audio
    probe_cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", audio_path
    ]
    result = subprocess.run(probe_cmd, capture_output=True, text=True)
    audio_duration = float(result.stdout.strip())
    
    # Duración por imagen
    img_duration = audio_duration / len(image_paths)
    
    print(f"  ⏱️  Audio: {audio_duration:.1f}s → {img_duration:.1f}s por slide")
    
    # Crear archivo de lista para FFmpeg (concat demuxer)
    concat_file = os.path.join(os.path.dirname(output_path), "concat.txt")
    with open(concat_file, "w") as f:
        for img_path in image_paths:
            f.write(f"file '{img_path}'\n")
            f.write(f"duration {img_duration:.2f}\n")
        # Repetir última imagen para evitar corte brusco
        f.write(f"file '{image_paths[-1]}'\n")
    
    # Comando FFmpeg
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", concat_file,
        "-i", audio_path,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p",
        "-vf", f"scale={VIDEO_W}:{VIDEO_H}:force_original_aspect_ratio=increase,crop={VIDEO_W}:{VIDEO_H}",
        "-shortest",
        "-movflags", "+faststart",
        output_path
    ]
    
    subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
    
    # Limpiar archivos temporales
    os.remove(concat_file)
    
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✅ Video ensamblado: {output_path} ({size_mb:.1f} MB)")
    return output_path


# ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Genera video desde script de texto")
    parser.add_argument("--script", required=True, help="Texto del guión")
    parser.add_argument("--topic", default="contenido", help="Tema del video")
    parser.add_argument("--style", default="motivacional", choices=["motivacional", "tecnologia", "gaming"])
    parser.add_argument("--output-dir", default="/app/videos", help="Carpeta de salida")
    parser.add_argument("--filename", default="video_output", help="Nombre del archivo (sin extensión)")
    args = parser.parse_args()
    
    # Crear directorios de trabajo
    work_dir = os.path.join(args.output_dir, "tmp_" + args.filename)
    os.makedirs(work_dir, exist_ok=True)
    os.makedirs(args.output_dir, exist_ok=True)
    
    print(f"\n🚀 Iniciando pipeline de video")
    print(f"   Tema: {args.topic}")
    print(f"   Estilo: {args.style}")
    print(f"   Salida: {args.output_dir}\n")
    
    try:
        # PASO 1: Generar audio
        audio_path = os.path.join(work_dir, "narration.mp3")
        text_to_speech(args.script, audio_path)
        
        # PASO 2: Generar imágenes
        image_paths = generate_slide_images(args.script, args.topic, args.style, work_dir)
        
        # PASO 3: Ensamblar video
        output_path = os.path.join(args.output_dir, f"{args.filename}.mp4")
        assemble_video(image_paths, audio_path, output_path)
        
        # Output JSON para que n8n lo lea
        result = {
            "success": True,
            "video_path": output_path,
            "filename": f"{args.filename}.mp4",
            "topic": args.topic,
            "style": args.style,
            "slides": len(image_paths),
        }
        print(f"\n📦 RESULTADO:")
        print(json.dumps(result, indent=2))
        
        # Limpiar temporales
        import shutil
        shutil.rmtree(work_dir, ignore_errors=True)
        
    except Exception as e:
        result = {"success": False, "error": str(e)}
        print(json.dumps(result, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
