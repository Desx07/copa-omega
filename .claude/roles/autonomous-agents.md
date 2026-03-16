# 🤖 AGENTES AUTÓNOMOS — Ciclo Completo de Contenido

---

## AGENTE-1: TRENDING TOPICS — "El Radar"

### ROL
Detecta cada mañana qué temas son virales en tu nicho y alimenta al generador de contenido con ideas calientes. Sin este agente, publicás en el vacío. Con él, subís a la ola antes que los demás.

### FUENTES QUE MONITOREA (todas gratuitas)
```
Google Trends API     → qué busca la gente hoy en tu país
YouTube Trending      → videos con más velocidad de views en las últimas 6hs
Reddit (r/technology, r/gaming, r/artificial) → conversaciones virales
Twitter/X API básica  → hashtags en tendencia por nicho
RSS de medios tech    → TechCrunch, The Verge, Genbeta (español)
```

### IMPLEMENTACIÓN EN N8N
```javascript
// Nodo Code — corre cada mañana antes que el generador de videos

// 1. Consultar Google Trends (via SerpAPI gratis tier o scraping)
const trendsUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=AR`;

// 2. Puntuar cada tema según criterios
function scoreTopic(topic) {
  return {
    topic: topic.title,
    score: (
      topic.searchVolume * 0.4 +    // Volumen de búsqueda
      topic.growthRate * 0.4 +      // Velocidad de crecimiento
      topic.relevanceToNiche * 0.2  // Relevancia al nicho
    ),
    estimatedViews: topic.searchVolume * 0.003, // Estimación conservadora
  };
}

// 3. Elegir el tema con mayor score
// 4. Pasarlo al siguiente nodo como input del generador
return topics.sort((a,b) => b.score - a.score)[0];
```

### OUTPUT QUE PRODUCE
```json
{
  "topic": "ChatGPT-5 lanzamiento",
  "trending_score": 94,
  "search_volume_today": 85000,
  "why_trending": "Anuncio oficial hace 3 horas",
  "content_angle": "Qué cambia para el usuario común",
  "urgency": "ALTA - publicar antes de 6hs",
  "related_hashtags": ["#ChatGPT5", "#IA", "#tecnologia"],
  "competitor_videos": 12,
  "opportunity_window": "4-8 horas"
}
```

### REGLAS DE DECISIÓN AUTÓNOMA
```
SI trending_score > 80 → publicar HOY (máxima prioridad)
SI trending_score 50-80 → publicar mañana
SI trending_score < 50  → guardar en banco de ideas para la semana
SI tema ya cubierto hace < 14 días → descartarlo automáticamente
SI tema es controversial/político → descartarlo (riesgo de restricción)
```

---

## AGENTE-2: THUMBNAIL — "El Gancho Visual"

### ROL
Genera la miniatura del video optimizada para CTR. El thumbnail decide si alguien hace click o no. Un buen thumbnail puede triplicar las vistas del mismo video.

### FÓRMULAS DE THUMBNAIL QUE MEJOR CONVIERTEN
```
FÓRMULA A — Contraste + Número:
[Fondo de color vibrante] + [Número grande] + [Texto 3 palabras max]
Ejemplo: Fondo rojo | "7" | "ERRORES DE IA"
CTR promedio: 8-12%

FÓRMULA B — Cara de reacción + Texto:
[Expresión de sorpresa/curiosidad] + [Texto explicativo]
(Para canales con cara visible)
CTR promedio: 10-15%

FÓRMULA C — Antes/Después:
[Estado malo] → [Estado bueno] con flecha
CTR promedio: 7-10%

FÓRMULA D — Pregunta provocadora:
[Imagen relevante] + [Pregunta que genera curiosidad]
"¿Esto reemplaza tu trabajo?"
CTR promedio: 6-9%
```

### IMPLEMENTACIÓN
```python
# thumbnail_generator.py
from PIL import Image, ImageDraw, ImageFont
import requests
from openai import OpenAI

def generate_thumbnail(title: str, topic: str, formula: str = "A") -> str:
    client = OpenAI()
    
    # 1. Generar prompt de imagen para DALL-E según fórmula
    prompt_map = {
        "A": f"Fondo de color vibrante y llamativo para thumbnail YouTube sobre {topic}. Sin texto. Abstracto, moderno, colores saturados.",
        "C": f"Imagen dividida antes/después sobre {topic}. Sin texto. Cinematográfico.",
        "D": f"Imagen impactante relacionada con {topic}. Sin texto. Alta calidad.",
    }
    
    # 2. Generar fondo con DALL-E 3
    img_response = client.images.generate(
        model="dall-e-3",
        prompt=prompt_map.get(formula, prompt_map["A"]),
        size="1792x1024",  # Proporción 16:9 para YouTube
        quality="standard"
    )
    
    # 3. Descargar imagen base
    bg = Image.open(requests.get(img_response.data[0].url, stream=True).raw)
    bg = bg.resize((1280, 720))
    
    # 4. Agregar overlay y texto optimizado
    draw = ImageDraw.Draw(bg)
    
    # Texto en máximo 3 palabras, fuente enorme
    short_title = " ".join(title.upper().split()[:3])
    
    # Sombra + texto blanco centrado
    for offset in [(4,4),(-4,-4),(4,-4),(-4,4)]:
        draw.text((640+offset[0], 360+offset[1]), short_title, 
                  fill="black", anchor="mm", font_size=120)
    draw.text((640, 360), short_title, fill="white", anchor="mm", font_size=120)
    
    # 5. Guardar
    output = f"/app/videos/thumb_{topic[:20]}.jpg"
    bg.save(output, "JPEG", quality=95)
    return output
```

### A/B TESTING AUTOMÁTICO
```javascript
// El agente genera 2 thumbnails por video
// Publica con thumbnail A la primera semana
// Si CTR < 4% después de 500 impresiones → cambia a thumbnail B automáticamente
// Registra qué fórmula ganó para aprender

const abTest = {
  video_id: "xxx",
  thumbnail_a: { formula: "A", ctr: 3.2, impressions: 800 },
  thumbnail_b: { formula: "D", ctr: 7.8, impressions: 200 },
  winner: "B",
  learning: "Fórmula D funciona mejor para tema: tecnología"
};
```

---

## AGENTE-3: ANALYTICS — "El Cerebro"

### ROL
Lee las métricas reales de YouTube/TikTok cada semana y ajusta automáticamente qué tipo de contenido produce el pipeline. Es el agente que hace que el sistema aprenda y mejore solo.

### MÉTRICAS QUE LEE (YouTube Analytics API — gratis)
```
Por video:
- Views totales y velocidad (views/hora en primeras 48hs)
- CTR (Click-Through Rate del thumbnail)
- Retention rate (% promedio visto)
- Likes/Comments ratio
- Traffic source (búsqueda, sugeridos, externos)

Por canal:
- Subscribers ganados/perdidos por período
- Revenue (cuando estés monetizado)
- Best performing topics
- Best performing publishing times
```

### IMPLEMENTACIÓN N8N — CORRE CADA LUNES
```javascript
// Análisis semanal automático

async function analyzePerformance(videos) {
  const insights = {
    top_performers: [],
    poor_performers: [],
    best_topic: null,
    best_style: null,
    best_publish_time: null,
    recommendations: []
  };
  
  // Clasificar videos
  videos.forEach(video => {
    const score = (
      video.ctr * 0.3 +           // CTR del thumbnail
      video.retention * 0.4 +     // Retención promedio
      video.view_velocity * 0.3   // Velocidad de views en 48hs
    );
    
    if (score > 70) insights.top_performers.push(video);
    if (score < 30) insights.poor_performers.push(video);
  });
  
  // Detectar patrones en top performers
  insights.best_topic = getMostCommonTopic(insights.top_performers);
  insights.best_style = getMostCommonStyle(insights.top_performers);
  insights.best_publish_time = getBestTime(insights.top_performers);
  
  // Generar recomendaciones con GPT
  const prompt = `
    Analizo un canal de YouTube. Estos son mis videos más exitosos:
    ${JSON.stringify(insights.top_performers)}
    
    Y estos fallaron:
    ${JSON.stringify(insights.poor_performers)}
    
    Dame 3 recomendaciones concretas para la próxima semana.
    Responde en JSON: { recommendations: ["...", "...", "..."] }
  `;
  
  // Las recomendaciones se escriben automáticamente
  // en el nodo de Configuración del pipeline
  return insights;
}
```

### AJUSTES AUTOMÁTICOS QUE HACE
```
SI retention < 40% → el script es muy largo, reducir a 45 segundos
SI CTR < 3%        → cambiar fórmula de thumbnail esta semana
SI topic X tuvo 3x más views → duplicar frecuencia de ese topic
SI publicar a las 9am rinde menos que 18hs → cambiar el cron trigger
SI estilo "motivacional" supera a "tecnologia" → cambiar estilo por defecto
```

### REPORTE SEMANAL QUE GENERA
```markdown
## 📊 REPORTE SEMANA [N] — Canal [Nombre]

### Resumen
Videos publicados: 7
Views totales: 12,430
Subscribers ganados: +47
Mejor video: "5 usos de IA que no conocías" (3,200 views)

### Lo que funcionó
- Thumbnails fórmula A: CTR promedio 7.2%
- Topic "herramientas de IA gratis": 3x más views
- Hora de publicación 18hs: 40% más views que 9am

### Ajustes para próxima semana
1. Cambiar trigger de 9am a 18hs
2. Priorizar topics de "herramientas gratis"
3. Mantener thumbnails fórmula A

### Proyección
A este ritmo: 1000 subs en ~3 semanas
```

---

## AGENTE-4: RE-EDICIÓN — "El Rescatador"

### ROL
Detecta videos con bajo rendimiento en las primeras 48 horas y los mejora automáticamente sin republicarlos desde cero.

### CRITERIOS PARA ACTIVARSE
```
SI después de 48hs:
  views < 50  Y  CTR < 2%  → problema de thumbnail → genera thumbnail nuevo
  views < 50  Y  CTR > 5%  → problema de retención → script muy largo
  views > 200 Y  retention < 30% → hook débil → reeditar primeros 5 segundos
```

### QUÉ PUEDE CAMBIAR AUTOMÁTICAMENTE
```
✅ Thumbnail (sin re-subir el video, YouTube permite cambiarlo via API)
✅ Título y descripción (optimización SEO post-publicación)
✅ Tags (agregar tags trending que aparecieron después de publicar)
✅ Horario (si publicaste a las 9am y falló, programa una segunda promoción a las 18hs)

❌ El video en sí (requeriría re-subir, mucho costo)
```

### IMPLEMENTACIÓN
```javascript
// Corre cada 48hs, revisa todos los videos de los últimos 7 días

async function rescueUnderperformers(videos) {
  for (const video of videos) {
    const age_hours = (Date.now() - video.published_at) / 3600000;
    
    if (age_hours < 48) continue; // Muy pronto para juzgar
    if (age_hours > 168) continue; // Más de 7 días, ya pasó el momento
    
    // Diagnóstico
    if (video.ctr < 2) {
      // Problema: nadie hace click → thumbnail malo
      await generateNewThumbnail(video);
      await updateYouTubeThumbnail(video.id, newThumbnail);
      await logAction(video.id, "thumbnail_replaced", { old_ctr: video.ctr });
    }
    
    if (video.ctr > 5 && video.retention < 35) {
      // Problema: hacen click pero no se quedan → contenido débil
      // Optimizar título para atraer audiencia más específica
      const newTitle = await generateBetterTitle(video.title, video.topic);
      await updateYouTubeMetadata(video.id, { title: newTitle });
    }
  }
}
```

---

## AGENTE-5: COMENTARIOS — "El Community"

### ROL
Responde comentarios automáticamente para aumentar el engagement. YouTube premia canales donde el creador interactúa. Más engagement = más distribución del algoritmo.

### TIPOS DE RESPUESTA AUTOMÁTICA
```javascript
const responseTemplates = {
  
  pregunta_tecnica: {
    detector: /cómo|qué es|dónde|cuándo|por qué/i,
    respuesta: async (comment, topic) => {
      // GPT genera respuesta útil y corta
      return await gpt(`Responde brevemente esta pregunta sobre ${topic}: "${comment}". 
                        Max 2 oraciones. Amigable. Termina invitando a ver más videos.`);
    }
  },
  
  comentario_positivo: {
    detector: /gracias|excelente|genial|me gustó|súper|buenísimo/i,
    respuesta: [
      "¡Gracias! Hay más contenido así cada semana 🙌",
      "¡Me alegra que te haya servido! Seguí por más 👀",
      "¡Exacto! Y la próxima semana viene algo mejor aún 🔥"
    ]
    // Elige aleatoriamente para no parecer bot
  },
  
  critica_constructiva: {
    detector: /mejorar|faltó|podrías|sugiero/i,
    respuesta: async (comment) => {
      return await gpt(`Responde agradeciendo esta crítica constructiva: "${comment}". 
                        Sé genuino, no defensivo. Max 2 oraciones.`);
    }
  },
  
  spam_o_negativo: {
    detector: /suscríbete|follow|check my|sub4sub/i,
    accion: "ignorar" // No responde, no reporta, solo ignora
  }
};
```

### LÍMITES PARA NO PARECER BOT
```
Máximo 20 respuestas por día (YouTube penaliza actividad masiva)
Delay random entre respuestas: 15-90 minutos
Nunca responder al 100% de comentarios (75% máximo)
Variar frases, nunca repetir exactamente la misma respuesta
```

---

## AGENTE-6: MONETIZACIÓN — "El Contador"

### ROL
Trackea todos los ingresos del canal, compara con los costos del pipeline y optimiza qué contenido genera más dinero por video.

### LO QUE TRACKEA
```javascript
const revenueTracker = {
  
  // Fuentes de ingreso
  youtube_adsense: {
    rpm: 0,           // Revenue per mille (por cada 1000 views)
    total_views: 0,
    estimated_revenue: 0,
    // Disponible en YouTube Analytics API cuando estés monetizado
  },
  
  tiktok_creator_fund: {
    views: 0,
    rate_per_1000: 0.03, // $0.02-0.04 promedio
    estimated_revenue: 0,
  },
  
  affiliate_links: {
    // Trackeable con UTM params en cada link de descripción
    clicks: 0,
    conversions: 0,
    commission_earned: 0,
    best_performing_product: null,
  },
  
  // Costos del pipeline
  costs: {
    openai_api: 0,        // Leer de OpenAI usage dashboard
    elevenlabs: 0,        // Cuando lo agregues
    vps_hosting: 0,       // Fijo mensual
    total: 0,
  },
  
  // Métricas clave
  roi: 0,                 // (ingresos - costos) / costos * 100
  revenue_per_video: 0,   // ingresos totales / videos publicados
  best_revenue_topic: null // Qué tema genera más plata
};
```

### DECISIONES AUTOMÁTICAS QUE TOMA
```
SI affiliate_link X tiene CTR > 5% → agregar ese link a TODOS los videos futuros de ese tema
SI topic "IA" genera 3x más RPM que "gaming" → aumentar ratio de videos de IA
SI costo por video > $0.10 → optimizar prompts para reducir tokens
SI revenue_per_video > $1 → duplicar frecuencia de publicación (más es más)
SI ROI < 0 después de 60 días → alertar al usuario para revisar estrategia
```

### REPORTE MENSUAL AUTOMÁTICO
```markdown
## 💰 REPORTE FINANCIERO — [Mes/Año]

### Ingresos
YouTube AdSense:      $XX.XX
TikTok Creator Fund:  $XX.XX
Afiliados Amazon:     $XX.XX
Afiliados ClickBank:  $XX.XX
TOTAL INGRESOS:       $XX.XX

### Costos
OpenAI API:           $X.XX
VPS Hetzner:          $3.29
TOTAL COSTOS:         $X.XX

### Resultado
GANANCIA NETA:        $XX.XX
ROI:                  XXX%
Costo por video:      $0.0X
Ingreso por video:    $X.XX

### Top 3 videos más rentables
1. [Título] → $X.XX (topic: IA, thumbnail: fórmula A)
2. [Título] → $X.XX
3. [Título] → $X.XX

### Recomendación del agente
"Producir más contenido sobre [topic] con thumbnail fórmula A
publicado a las 18hs. Potencial de 2x los ingresos actuales."
```

---

## 🔄 CÓMO SE CONECTAN LOS 6 AGENTES

```
CADA MAÑANA (6am):
  AGENTE-1 (Trending) detecta tema del día
        ↓
  AGENTE-2 (Thumbnail) genera miniatura optimizada
        ↓
  Pipeline principal genera video + audio
        ↓
  Publica en YouTube + TikTok

CADA 48HS:
  AGENTE-4 (Re-edición) revisa videos recientes
  → Si fallan: cambia thumbnail/título automáticamente

  AGENTE-5 (Comentarios) responde engagement
  → Máximo 20 respuestas/día con delays random

CADA LUNES (8am):
  AGENTE-3 (Analytics) analiza la semana
  → Ajusta configuración del pipeline para la semana siguiente

CADA 1RO DEL MES:
  AGENTE-6 (Monetización) genera reporte financiero
  → Ajusta qué contenido priorizar según ingresos reales
```
