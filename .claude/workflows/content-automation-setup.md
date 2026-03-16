# 🚀 GUÍA COMPLETA: DE CERO A PIPELINE AUTOMATIZADO

## Solo tenés ChatGPT Plus → así arrancás sin gastar más

---

## FASE 0: LO QUE PODÉS HACER HOY GRATIS

### Stack gratuito al 100%:
```
✅ Script del video → ChatGPT (ya lo tenés)
✅ Imagen de fondo → Ideogram.ai (gratis, mejor que DALL-E para texto en imagen)
✅ Voz → ElevenLabs (3 minutos/mes gratis) o ttsmaker.com (gratis)
✅ Ensamblaje video → CapCut web (gratis) o Canva video (gratis)
✅ Thumbnail → Canva (gratis)
✅ Subida → YouTube Studio manual por ahora
✅ Automatización básica → n8n en tu computadora (gratis)
```

### Flujo manual semi-automatizado (sin pagar nada extra):
```
1. Le decís a ChatGPT: "Genera un script de 60 segundos sobre [tema]
   para YouTube Shorts. Incluí hook, 3 puntos clave y CTA."
   
2. Pegás el texto en ElevenLabs → descargás el audio

3. En Ideogram.ai pedís 5 imágenes con prompts del script

4. En CapCut: importás imágenes + audio → auto-captions → exportás

5. Subís a YouTube Studio → pegás título/desc que ChatGPT generó

Tiempo total: 20-30 minutos por video
```

---

## FASE 1: SEMI-AUTOMÁTICO CON N8N LOCAL (gratis)

### Instalar n8n en tu computadora:
```bash
# Necesitás Node.js instalado primero (nodejs.org)

# Instalar n8n
npm install -g n8n

# Ejecutar
n8n start

# Abrir en el browser: http://localhost:5678
```

### Workflow básico en n8n que armás:
```
Trigger Manual (vos ponés la temática)
    ↓
HTTP Request → OpenAI API (genera script)
    ↓
HTTP Request → OpenAI API (genera prompts de imagen)
    ↓
HTTP Request → OpenAI API / DALL-E (genera imágenes)
    ↓
HTTP Request → ElevenLabs (genera audio)
    ↓
[Manual] → FFmpeg en tu PC ensambla el video
    ↓
HTTP Request → YouTube API (sube el video)
    ↓
Telegram/Email → "✅ Video subido: [título]"
```

**Costo: $0** (solo usás tu PC mientras estás trabajando)

---

## FASE 2: TOTALMENTE AUTOMÁTICO (inversión mínima)

### Stack recomendado (~$30/mes total):
```
OpenAI API:    $10/mes → ~45 videos completos (script + imágenes)
ElevenLabs:    $5/mes  → 30 minutos de audio (30 videos)
VPS Hetzner:   $4/mes  → server que corre n8n 24/7
n8n self-host: gratis  → en el VPS

TOTAL: $19/mes para 30 videos/mes
Si monetizás con afiliados desde video 1 → puede ser gratis neto
```

### Setup del VPS (una sola vez):
```bash
# En Hetzner Cloud (hetzner.com) → servidor más barato €3.29/mes

# Conectarte al server
ssh root@tu-ip-del-server

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar n8n con Docker (persistente)
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=tupassword \
  -v ~/.n8n:/home/node/.n8n \
  --restart unless-stopped \
  n8nio/n8n

# n8n ya está corriendo 24/7 en http://tu-ip:5678
```

---

## FLUJO N8N COMPLETO — JSON IMPORTABLE

```json
{
  "name": "Content Automation Pipeline",
  "nodes": [
    {
      "name": "Daily Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "cronExpression": "0 9 * * *"
      }
    },
    {
      "name": "Get Topic of Day",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            { "name": "topic", "value": "inteligencia artificial" },
            { "name": "style", "value": "motivacional" },
            { "name": "platform", "value": "youtube_shorts" }
          ]
        }
      }
    },
    {
      "name": "Generate Script",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.openai.com/v1/chat/completions",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{ $credentials.openai }}"
        },
        "body": {
          "model": "gpt-4o-mini",
          "messages": [{
            "role": "system",
            "content": "Eres experto en crear scripts virales para YouTube Shorts en español. Creas contenido educativo, motivacional y entretenido. Siempre incluís hook poderoso en los primeros 3 segundos."
          }, {
            "role": "user",
            "content": "Crea un script de 60 segundos sobre {{ $json.topic }} en estilo {{ $json.style }}. Formato: HOOK (3 seg) | DESARROLLO (50 seg, 3 puntos) | CTA (7 seg). Solo el guión, sin acotaciones."
          }]
        }
      }
    },
    {
      "name": "Generate Metadata",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.openai.com/v1/chat/completions",
        "body": {
          "model": "gpt-4o-mini",
          "messages": [{
            "role": "user",
            "content": "Para este script de YouTube Shorts genera: 1) Título atractivo SEO (max 70 chars) 2) Descripción (150 chars) 3) 10 tags relevantes. Responde en JSON: {title, description, tags}"
          }]
        }
      }
    },
    {
      "name": "Generate Voice",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB",
        "method": "POST",
        "headers": {
          "xi-api-key": "{{ $credentials.elevenlabs }}"
        },
        "body": {
          "text": "{{ $json.script }}",
          "model_id": "eleven_multilingual_v2",
          "voice_settings": { "stability": 0.5, "similarity_boost": 0.8 }
        },
        "responseFormat": "file"
      }
    },
    {
      "name": "Upload to YouTube",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status",
        "method": "POST",
        "authentication": "oAuth2",
        "body": {
          "snippet": {
            "title": "{{ $json.metadata.title }}",
            "description": "{{ $json.metadata.description }}",
            "tags": "{{ $json.metadata.tags }}",
            "categoryId": "22"
          },
          "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": false
          }
        }
      }
    }
  ]
}
```

---

## 📊 PROYECCIÓN REALISTA DE INGRESOS

```markdown
### Mes 1-2 (construyendo audiencia)
Videos publicados: 30-60 Shorts
Subs esperados: 50-200
Ingresos directos: $0 (aún no calificás para monetización)
Ingresos afiliados: $5-50 (si mencionás productos relevantes)

### Mes 3-4
Videos acumulados: 90-180
Subs esperados: 200-800
TikTok Creator Fund: $2-20/mes (si llegás a 10K views)
Ingresos afiliados: $20-100/mes

### Mes 5-6 (si el algoritmo te favorece)
Subs: 1000+ → Calificás para YouTube Partner Program
YouTube AdSense: $30-200/mes según nicho y views
TikTok: $10-50/mes
Afiliados: $50-300/mes
TOTAL: $90-550/mes

### El nicho importa MUCHO para CPM:
Tecnología/IA: CPM $8-15 (el mejor)
Finanzas: CPM $12-20 (excelente)
Gaming: CPM $2-5 (volumen alto)
Motivación general: CPM $3-8 (medio)
```

---

## 🎯 PLAN DE ACCIÓN: SEMANA 1

```
DÍA 1: Crear canal de YouTube + cuenta TikTok con temática clara
DÍA 2: Producir primer video manualmente (aprende el proceso)
DÍA 3: Publicar + optimizar metadata con ChatGPT
DÍA 4: Instalar n8n local, configurar workflow básico
DÍA 5: Automatizar la generación de script + metadata
DÍA 6: Publicar 2 videos (uno manual, uno semi-auto)
DÍA 7: Analizar métricas, ajustar temática según engagement

META SEMANA 1: 3-5 videos publicados + pipeline funcionando
```

---

## ❓ PREGUNTAS FRECUENTES

**¿Necesito mostrar mi cara?**
No. Los canales de "faceless" (sin cara) funcionan muy bien con IA. 
Ejemplos exitosos: canales de frases motivacionales, curiosidades, tech news.

**¿Puedo usar el mismo video en YouTube y TikTok?**
Sí. Mismo archivo .mp4, misma narración. Solo cambiás la metadata por plataforma.
YouTube prefiere sin marca de agua. TikTok igual.

**¿YouTube detecta contenido generado por IA?**
Actualmente debés declararlo en YouTube Studio si el contenido es "realista" 
(ej: cara de persona generada por IA). Para imágenes abstractas/animadas no es obligatorio.
Siempre agregá algo de valor humano: tu perspectiva, tu selección de tema.

**¿Cuánto tarda en monetizar?**
YouTube Partner Program: mínimo 3-6 meses realistas para alcanzar los requisitos.
TikTok: más rápido pero menos dinero por view.
Afiliados: desde el primer video si tenés el link en la descripción.
```
