# ⚡ SETUP COMPLETO — Paso a paso exacto

## Lo que vas a tener al final:
- n8n corre el pipeline automático a las 9am
- Python genera audio con gTTS (voz Google, GRATIS)
- FFmpeg ensambla el video automáticamente
- El video queda guardado en tu carpeta `videos/`
- Metadata SEO lista para copiar y pegar en YouTube

---

## PASO 1: Crear la carpeta del proyecto

Abrí una terminal (CMD o PowerShell en Windows, Terminal en Mac/Linux):

```bash
# Crear carpeta principal
mkdir content-pipeline
cd content-pipeline

# Crear subcarpetas
mkdir videos
mkdir scripts
```

Copiá estos archivos que te generé adentro:
```
content-pipeline/
├── docker-compose.yml       ← copialo acá
├── scripts/
│   └── generate_video.py   ← copialo acá
└── videos/                  ← acá van a aparecer los videos
```

---

## PASO 2: Parar tu n8n actual y levantar el nuevo

**Si ya tenés n8n corriendo con Docker, primero:**
```bash
# Ver qué containers tenés corriendo
docker ps

# Parar el n8n viejo (reemplazá "n8n" por el nombre que veas)
docker stop n8n
docker rm n8n
```

**Levantar el nuevo stack completo:**
```bash
# Estás dentro de la carpeta content-pipeline/
docker-compose up -d

# Verificar que ambos containers están corriendo
docker ps
```

Deberías ver DOS containers:
- `n8n` → en puerto 5678 (tu interfaz web)
- `python-worker` → el que genera videos

**Verificar que Python tiene todo instalado:**
```bash
docker exec python-worker python -c "import gtts, PIL; print('✅ Todo OK')"
docker exec python-worker ffmpeg -version | head -1
```

Si ves `✅ Todo OK` y la versión de FFmpeg, estás listo.

---

## PASO 3: Conseguir tu API Key de OpenAI (GRATIS)

1. Ir a: **platform.openai.com** (diferente a chat.openai.com)
2. Crear cuenta nueva (o loguear con tu Google)
3. Ir a: **API Keys** en el menú izquierdo
4. Click **"Create new secret key"**
5. Copiar la key (empieza con `sk-...`) — guardala, la ves una sola vez

> ✅ OpenAI da **$5 de crédito gratis** al crear cuenta API
> Con gpt-4o-mini cada video cuesta ~$0.01 → son 500 videos gratis

---

## PASO 4: Configurar la API Key en n8n

1. Abrí **http://localhost:5678**
2. Ir a: **Settings** (engranaje abajo a la izquierda) → **Credentials**
3. Click **"Add Credential"**
4. Buscar: **"Header Auth"**
5. Completar:
   - **Name:** `OpenAI API Key`
   - **Name (del header):** `Authorization`
   - **Value:** `Bearer sk-TUAPIKEY` (con "Bearer " adelante)
6. Click **Save**

---

## PASO 5: Importar el workflow en n8n

1. En n8n, ir a **Workflows** → click **"+"** → **"Import from file"**
2. Seleccionar el archivo `n8n-workflow.json`
3. El workflow aparece con todos los nodos conectados

---

## PASO 6: Primer test manual

1. En el workflow, click en el nodo **"⚙️ Configuración del Video"**
2. Cambiá `topic` por la temática que querés (ej: "gaming en 2025")
3. Cambiá `style` según el tema: `motivacional`, `tecnologia`, o `gaming`
4. Click **Save**

5. Click en **"Test workflow"** (botón arriba a la derecha)
6. Mirá los nodos ejecutarse uno por uno (se ponen verdes)
7. En el último nodo "📊 Resumen Final" vas a ver el resultado

**Tiempo total:** 2-4 minutos por video

---

## PASO 7: Ver el video generado

```bash
# En tu computadora, ir a la carpeta videos/
# En Windows: abrís el Explorer y navegás a content-pipeline/videos/
# En Mac/Linux:
open content-pipeline/videos/    # Mac
xdg-open content-pipeline/videos/ # Linux
```

Vas a ver el archivo `video_FECHA.mp4` listo para subir.

---

## PASO 8: Subir a YouTube (por ahora manual, luego automático)

1. Ir a **studio.youtube.com**
2. Click **"Crear"** → **"Subir video"**
3. Seleccionar el `.mp4` de tu carpeta `videos/`
4. En el nodo **"📊 Resumen Final"** de n8n, copiás:
   - El **título** generado
   - La **descripción** con hashtags
5. En YouTube Studio:
   - Marcá como **"No está hecho para niños"**
   - Agregá el título y descripción
   - En **"Más opciones"** → agregá los tags
6. Click **Publicar**

---

## AUTOMATIZAR LA SUBIDA A YOUTUBE (fase siguiente)

Cuando el pipeline manual funcione bien (1-2 semanas), agregamos el nodo de YouTube API:

```
Lo que necesitás en ese momento:
✅ Canal con al menos 1 video publicado
✅ Google Cloud Console → habilitar YouTube Data API v3 (gratis)
✅ OAuth2 credentials de Google

Costo de la YouTube API: $0 (completamente gratis)
Límite: sube hasta 50 videos por día
```

---

## CAMBIAR TEMÁTICA CADA DÍA

Para variar el contenido automáticamente, editá el nodo **"⚙️ Configuración del Video"**:

```javascript
// Podés rotar temas automáticamente con este código
// (reemplazá el nodo Set por un nodo Code):

const topics = [
  { topic: "inteligencia artificial", style: "tecnologia" },
  { topic: "gaming en 2025", style: "gaming" },
  { topic: "productividad con IA", style: "motivacional" },
  { topic: "curiosidades de tecnología", style: "tecnologia" },
  { topic: "mindset para el éxito", style: "motivacional" },
];

const dayOfWeek = new Date().getDay();
const selected = topics[dayOfWeek % topics.length];

return selected;
```

---

## SOLUCIÓN DE PROBLEMAS COMUNES

**Error: "python-worker no existe"**
```bash
docker-compose down
docker-compose up -d
docker ps  # verificar que ambos containers aparecen
```

**Error: "gTTS failed" o "no internet"**
```bash
# El container necesita internet para gTTS
docker exec python-worker curl -s https://google.com | head -5
# Si no responde, revisar configuración de red de Docker
```

**El video sale sin audio:**
```bash
docker exec python-worker ffprobe /app/videos/TU_VIDEO.mp4
# Verificar que tiene stream de audio
```

**Error de API Key inválida:**
- Verificar que la credencial en n8n tiene exactamente: `Bearer sk-xxxxx`
- El espacio después de "Bearer" es importante

---

## COSTOS REALES DEL PIPELINE

```
gTTS (voz Google):     GRATIS - sin límites
FFmpeg (video):        GRATIS - sin límites
n8n (local):           GRATIS
YouTube upload:        GRATIS

OpenAI gpt-4o-mini:
  Script (500 tokens): $0.0003
  Metadata (300 tok):  $0.0002
  TOTAL POR VIDEO:     $0.0005 (~$0.05 centavos)

Con los $5 gratis de OpenAI:
→ 10.000 videos antes de pagar
→ A 1 video/día = 27 AÑOS de contenido gratis
```
