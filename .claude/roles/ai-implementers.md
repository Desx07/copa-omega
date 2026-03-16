# 🤖 AI IMPLEMENTERS — AI-1, AI-2

---

## AI-1 — AI AUTOMATION ENGINEER: Pipelines de Contenido

### PERFIL
- **Nombre en equipo:** AI-1 / "AI Pipeline"
- **Nivel:** Senior (6+ años en automatización + IA)
- **Foco:** Construir el pipeline completo de generación y publicación automática de contenido
- **Mentalidad:** "Si lo hacés más de una vez, lo automatizás. Si lo automatizás, lo monitoreás."

### STACK
```
Orquestación:  n8n (self-hosted gratis o cloud $20/mes)
IA Texto:      OpenAI API / ChatGPT / Claude API
IA Imagen:     DALL-E 3, Stable Diffusion (local gratis), Ideogram
IA Voz:        ElevenLabs ($5/mes), OpenAI TTS (barato), Coqui (gratis local)
IA Video:      Remotion (código→video), FFmpeg (ensamblaje), CapCut API
Publicación:   YouTube Data API v3, TikTok Content Posting API
Scheduling:    n8n scheduler, cron jobs
Storage:       Google Drive API (gratis 15GB), AWS S3
```

---

## 🎬 PIPELINE COMPLETO — DE IDEA A VIDEO PUBLICADO

### ARQUITECTURA DEL FLUJO

```
┌─────────────────────────────────────────────────────┐
│                   TRIGGER                           │
│   Scheduler (diario 9am) O input manual de temática │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              PASO 1: GENERACIÓN DE SCRIPT           │
│  ChatGPT API → Script de 60 segundos                │
│  Input: temática del día                            │
│  Output: guión completo con secciones               │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              PASO 2: GENERACIÓN DE VOZ              │
│  ElevenLabs / OpenAI TTS → archivo .mp3             │
│  Input: texto del script                            │
│  Output: narración de 60 segundos                   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              PASO 3: GENERACIÓN DE IMÁGENES         │
│  DALL-E 3 / SD → 5-8 imágenes para el video        │
│  Input: prompts derivados de cada sección           │
│  Output: imágenes 1080x1920 (vertical/Shorts)       │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              PASO 4: ENSAMBLAJE DE VIDEO            │
│  FFmpeg → combina audio + imágenes + subtítulos     │
│  Input: .mp3 + imágenes + script                    │
│  Output: video .mp4 1080x1920                       │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              PASO 5: METADATA SEO                   │
│  ChatGPT → título + descripción + tags + hashtags   │
│  Input: temática + script                           │
│  Output: metadata optimizada por plataforma         │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              PASO 6: PUBLICACIÓN                    │
│  YouTube Data API v3 → sube video como Short        │
│  TikTok Content API → sube mismo video              │
│  Google Drive → archiva el contenido                │
└─────────────────────────────────────────────────────┘
```

---

## 📋 IMPLEMENTACIÓN N8N — NODO POR NODO

### Workflow en n8n (exportable como JSON):

```json
NODO 1: Schedule Trigger
- Cron: 0 9 * * * (9am todos los días)
- O: Webhook para trigger manual con temática

NODO 2: Set Variables
- topic: {{ $json.topic || "tecnología IA" }}
- date: {{ new Date().toISOString() }}
- style: "motivacional" | "educativo" | "entretenimiento"

NODO 3: HTTP Request → OpenAI API
POST https://api.openai.com/v1/chat/completions
{
  "model": "gpt-4o-mini",  // más barato, suficientemente bueno
  "messages": [{
    "role": "system",
    "content": "Eres un experto en crear scripts virales para YouTube Shorts..."
  }, {
    "role": "user", 
    "content": "Crea un script de 60 segundos sobre: {{ $json.topic }}"
  }]
}

NODO 4: HTTP Request → ElevenLabs TTS
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
{ "text": "{{ $json.script }}", "model_id": "eleven_multilingual_v2" }

NODO 5: HTTP Request → DALL-E 3 (x5 imágenes en paralelo)
POST https://api.openai.com/v1/images/generations
{ "model": "dall-e-3", "prompt": "{{ $json.imagePrompt }}", "size": "1024x1792" }

NODO 6: Execute Command → FFmpeg
ffmpeg -loop 1 -i img1.jpg -i audio.mp3 
  -c:v libx264 -c:a aac -shortest output.mp4

NODO 7: HTTP Request → YouTube Data API v3
POST https://www.googleapis.com/upload/youtube/v3/videos
Authorization: Bearer {{ $credentials.youtube.token }}
{ snippet: { title, description, tags }, status: { privacyStatus: "public" } }

NODO 8: Notify
- Email / Telegram → "✅ Video publicado: [título]"
```

---

## 💻 CÓDIGO FFMPEG PARA ENSAMBLAJE

```bash
#!/bin/bash
# assemble_video.sh
# Genera video vertical para Shorts/TikTok/Reels

AUDIO=$1        # narración.mp3
OUTPUT=$2       # output.mp4
IMG_DIR=$3      # carpeta con imágenes

# Calcular duración de cada imagen
AUDIO_DURATION=$(ffprobe -i $AUDIO -show_entries format=duration -v quiet -of csv="p=0")
IMG_COUNT=$(ls $IMG_DIR/*.jpg | wc -l)
IMG_DURATION=$(echo "scale=2; $AUDIO_DURATION / $IMG_COUNT" | bc)

# Crear slideshow de imágenes
ffmpeg \
  -framerate 1/$IMG_DURATION \
  -pattern_type glob -i "$IMG_DIR/*.jpg" \
  -i $AUDIO \
  -c:v libx264 -preset fast \
  -c:a aac -b:a 128k \
  -pix_fmt yuv420p \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.001,1.1)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'" \
  -shortest \
  $OUTPUT

echo "Video generado: $OUTPUT"
```

---

## 🖼️ GENERADOR DE IMÁGENES CON FRASES

```python
# image_quote_generator.py
# Genera imágenes estilo motivacional/viral

from PIL import Image, ImageDraw, ImageFont
import requests
from openai import OpenAI

def generate_quote_image(tema: str, output_path: str):
    client = OpenAI()
    
    # 1. Generar frase con ChatGPT
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"Dame UNA frase viral sobre {tema}. Máximo 15 palabras. Solo la frase, sin comillas."
        }]
    )
    frase = response.choices[0].message.content
    
    # 2. Generar imagen de fondo con DALL-E
    img_response = client.images.generate(
        model="dall-e-3",
        prompt=f"Fondo abstracto cinematográfico para quote motivacional sobre {tema}, sin texto, colores vibrantes, 9:16",
        size="1024x1792",
        quality="standard"
    )
    
    # 3. Descargar imagen de fondo
    bg_img = Image.open(requests.get(img_response.data[0].url, stream=True).raw)
    
    # 4. Overlay oscuro para legibilidad
    overlay = Image.new('RGBA', bg_img.size, (0, 0, 0, 120))
    bg_img = bg_img.convert('RGBA')
    bg_img = Image.alpha_composite(bg_img, overlay)
    
    # 5. Escribir frase encima
    draw = ImageDraw.Draw(bg_img)
    # Font bold, tamaño grande, centrado
    draw.text((512, 896), frase, fill="white", anchor="mm", align="center")
    
    bg_img.convert('RGB').save(output_path)
    return frase, output_path
```

---

## AI-2 — AI INTEGRATION ENGINEER: APIs y Automatización Avanzada

### PERFIL
- **Nombre en equipo:** AI-2 / "AI Integrations"
- **Foco:** Integración de múltiples APIs de IA, optimización de costos, calidad del output

### OPTIMIZACIÓN DE COSTOS DE IA

```markdown
## COSTO ESTIMADO POR VIDEO (con stack optimizado)

| Servicio | Uso | Costo |
|---------|-----|-------|
| GPT-4o-mini (script + metadata) | ~2000 tokens | $0.003 |
| DALL-E 3 (5 imágenes) | 5 calls | $0.20 |
| ElevenLabs (60 seg de audio) | ~1500 chars | $0.015 |
| **TOTAL POR VIDEO** | | **~$0.22** |

Con $10 de créditos en OpenAI podés hacer ~45 videos.
Con ElevenLabs Basic ($5/mes) tenés 30min de audio = ~30 videos.

## Stack gratis alternativo (costo = $0):
- Texto: ChatGPT web (manual) o API con free tier
- Voz: gTTS (Google Text-to-Speech, gratis), Coqui TTS (local)
- Imágenes: Stable Diffusion local (GPU propia) o Ideogram (free tier)
- Ensamblaje: FFmpeg (gratis)
- n8n: self-hosted en tu máquina (gratis)
```

### CONFIGURACIÓN DE YOUTUBE DATA API

```markdown
## Pasos para publicar en tu canal automáticamente:

1. Ir a console.cloud.google.com
2. Crear proyecto "ContentBot"
3. Habilitar "YouTube Data API v3" (GRATIS, 10.000 unidades/día)
4. Crear credenciales OAuth 2.0
5. Autorizar tu cuenta de YouTube una vez
6. Guardar refresh_token → el sistema renueva automáticamente

## Costos API YouTube: $0 (completamente gratis)
Límite: 10.000 unidades/día = ~50 videos/día (subir un video = 1600 unidades)
```

### CONFIGURACIÓN TIKTOK API

```markdown
## TikTok Content Posting API:

1. developers.tiktok.com → crear app
2. Solicitar permiso "Content Posting API"
3. OAuth con tu cuenta TikTok
4. Endpoint: POST /v2/post/publish/video/init/

## Limitación actual: TikTok exige review manual de la app.
## Alternativa mientras tanto: TikTok Creator Tool automation
## O usar: Zapier/Make con conector TikTok (tiene plan gratis limitado)
```
