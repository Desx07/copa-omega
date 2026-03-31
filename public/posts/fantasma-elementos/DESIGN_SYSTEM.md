# DESIGN SYSTEM -- Flyers de Torneos Bladers Santa Fe

> Documento de referencia para la generacion programatica de flyers de torneo.
> Fuente: archivo Figma "FEED BLADERS" (file key: KdjeXYgJnn6aOpe8Ee5bC4)
> Extraido el 21 de marzo de 2026.

---

## A. PALETA DE COLORES POR TORNEO

### A.1 Torneo Blader (formato clasico, usado hasta nov 2025)

El formato original usado en los primeros torneos. Fondo gradiente fuerte,
sin identidad de torneo especifica. Se usaba la fuente Montserrat, luego
migro a Normatica.

| Elemento | Color(es) | Nota |
|---|---|---|
| Background gradient | #e94011 -> #fdac10 | Naranja-rojo a dorado. Vertical top-to-bottom |
| Banner titulo | #000aff (fondo) + gradient #00b3ff -> #b9942e (relleno) | Cian a dorado oscuro |
| Texto general | #ffffff | Blanco puro |
| Texto secundario (lugar) | #060924 | Azul oscuro casi negro |
| Barra info | #060924 | Navy oscuro |

Variante con collab (Post 29 - ultimo 2025):

| Elemento | Color(es) |
|---|---|
| Background gradient | #221a5c -> #0e55d5 (Violeta oscuro a azul) |
| Zona inferior | #241149 -> #250d41 (Purpura muy oscuro) |
| Banner titulo fondo | #241149 |
| Banner titulo gradient | #52f9ff -> #260e42 (Cian brillante a purpura oscuro) |
| Acento | #43dfe8 (Cian neon) |
| Barra info | #114fc9 (Azul medio) |

Variante cian (Frame 4 - dic 2025):

| Elemento | Color(es) |
|---|---|
| Background gradient | #231654 -> #42f0eb (Purpura oscuro a cian neon) |
| Zona inferior | #231654 -> #47f7f3 al 81% (Gradiente con stop parcial) |
| Barra info | #45f4f0 -> #4cdde0 (Cian brillante) |
| Acento | #0031ad (Azul fuerte) |
---

### A.2 La Mision Ninja (a partir de feb 2026)

Hereda el formato del Torneo Blader clasico pero con la identidad visual naranja/dorada de la comunidad.

| Elemento | Color(es) | Hex exacto |
|---|---|---|
| **Gradient superior (fade imagen)** | Naranja a dark navy | #ec790f -> #16222c |
| **Franja horizontal media** | Naranja a dorado | #ee7b10 -> #fdac10 |
| **Franja horizontal superior** | Naranja a dorado | #ee7b10 -> #fdac10 |
| **Boton CTA** | Rojo a naranja | #e61e11 -> #fca011 |
| **Barra de precio/hora** | Oliva oscuro a dorado | #3c3a13 -> #fdac10 |
| **Texto principal** | Blanco puro | #ffffff |
| **Fondo del frame** | Gris calido | #dcdbd9 |
| **Halftone/textura** | Imagen a 23% opacidad | - |

NOTA: La Mision Ninja usa los mismos colores base que el Torneo Blader pero incorpora el logo del torneo (ninja purpura/verde) como elemento central.

---

### A.3 Copa Omega Stars (a partir de mar 2026)

Paleta completamente nueva, centrada en azules celestes y blancos. Usa el personaje mascota (blader anime de pelo blanco/celeste) y el logo Copa Omega Stars con la omega dorada.

| Elemento | Color(es) | Hex exacto |
|---|---|---|
| **Gradient superior (fade imagen)** | Celeste a blanco | #48abe5 -> #fefefe |
| **Franja horizontal info** | Celeste claro a verde agua | #57b5ee -> #9aceec |
| **Texto principal** | Blanco puro | #ffffff |
| **Texto dorado (eslogan)** | Dorado claro | #fad053 |
| **Fondo del frame** | Blanco | #ffffff |

---

### A.4 La Orden del Caballero (a partir de mar 2026)

Template de resultado de torneo (puestos). Usa la paleta naranja/oscura clasica de la comunidad con marcos estilizados.

| Elemento | Color(es) | Hex exacto |
|---|---|---|
| **Gradient fondo principal** | Naranja a navy oscuro | #ec790f -> #16222c |
| **Acento badge (puesto)** | Cian agua | #37b8e1 |
| **Color Bladers logo** | Navy | #001c2f |
| **Color Bladers text** | Naranja rojo | #ee4417 |
| **Fondo del frame** | Gris hueso | #dcdbd9 |
| **Texto nombre blader** | Blanco + stroke negro | #ffffff + stroke #000000 sw:1 |
| **Texto fecha** | Negro | #000000 |

---

### A.5 Paleta Institucional Bladers Santa Fe (pagina IDENTIDAD de Figma)

La paleta oficial de la marca, definida en el brand book:

| Swatch | Hex | Nombre descriptivo |
|---|---|---|
| Rojo primario | #e41212 | Rojo Bladers |
| Naranja | #eb4811 | Naranja calido |
| Naranja claro | #f77e0e | Naranja intermedio |
| Dorado | #feac11 | Dorado Bladers |
| Azul | #008fd0 | Azul cielo |
| Navy oscuro | #11202d | Navy Bladers |

Estas son las 6 columnas de color de la guia de identidad.
---

## B. TIPOGRAFIA

### B.1 Font Family

| Contexto | Font | PostScript Name |
|---|---|---|
| **Posts actuales (2025+)** | **Normatica** | Normatica-Bold |
| Posts antiguos (oct 2024) | Montserrat | Montserrat-Bold |
| Cards Orden del Caballero (puesto) | Normatica Display | Normatica Display Bold |
| Cards bladers (nombre) | Eras Bold ITC | ErasITC-Bold |
| Cards bladers (info) | Merriweather Sans | MerriweatherSans-ExtraBoldItalic |

### B.2 Especificaciones de Texto por Elemento (Normatica Bold)

Todos los textos usan textCase: SMALL_CAPS_FORCED (forzar mayusculas con kerning de small caps).

#### Flyer de Inscripciones (1080x1440 post)

| Elemento | Size (px) | Line Height | Letter Spacing | Color | Efectos |
|---|---|---|---|---|---|
| **TORNEO BLADER** (banner titulo) | 82.7 | 69.3px (0.84em) | 0 | #ffffff | DROP_SHADOW negro 25% r:8.6 |
| **INSCRIPCIONES ABIERTAS!** | 72.0 | 74.8px (1.04em) | 0 | #ffffff | DROP_SHADOW negro 25% r:7.5 |
| **SAB-XX / FEBRERO** (fecha) | 62.7 | 71.4px (1.14em) | 0 | #ffffff | DROP_SHADOW negro 25% r:6.5 |
| **BLADERS.SFE / PARQUE FEDERAL** (lugar) | 62.7 | 71.4px (1.14em) | 0 | #ffffff | DROP_SHADOW negro 25% r:6.5 |
| **Hora de comienzo: 16:00h** | 40.0 | 41.6px (1.04em) | 0 | #ffffff | DROP_SHADOW negro 25% r:4.3 |
| **PARTICIPA POR UN BEYBLADE** | 40.9 | 42.6px (1.04em) | 0 | #ffffff | DROP_SHADOW negro 25% r:4.3 |
| **Participa y demostra tus habilidades blader!** | 33.6 | 35.0px (1.04em) | 0 | #ffffff | DROP_SHADOW negro 25% r:3.5 |
| **PIN DE REGALO CON LA INSCRIPCION!** | 23.3 | 24.2px (1.04em) | 0 | #ffffff | DROP_SHADOW negro 25% r:2.4 |
| **Escribinos y te enviamos toda la info.** | 33.6 | 35.0px (1.04em) | 0 | #ffffff | DROP_SHADOW negro 25% r:3.5 |
| **Inscripcion: 000** | 54.0 | 56.2px (1.04em) | 0 | #ffffff | DROP_SHADOW negro 25% r:4.3 |
| Emoji trofeo | 42.2 | 35.3px | 0 | #ffffff | DROP_SHADOW negro 25% r:4.4 |

#### Flyer de Resultados / Puestos (Orden del Caballero)

| Elemento | Size (px) | Line Height | Letter Spacing | Color | Efectos |
|---|---|---|---|---|---|
| **Nombre blader** (ej. DESX) | 64.0 | 80.2px (1.25em) | 1.28 | #ffffff + stroke #000000 sw:1 | - |
| **2DO PUESTO / 3ER PUESTO** | 34.0 | 41.9px (1.23em) | 15.3 (!!) | #ffffff | - |
| **Fecha** (ej. 02.03.2026) | 30.0 | 37.0px (1.23em) | 0 | #000000 | - |

NOTA IMPORTANTE: El badge de puesto usa letter-spacing de 15.3px, lo que genera ese efecto espaciado tipo "E S P A C I A D O" en las letras.

#### Copa Omega Stars (eslogan)

| Elemento | Size (px) | Color |
|---|---|---|
| **Es hora de llegar a las estrellas!** | 54.0 | #fad053 (dorado) |
---

## C. LAYOUT

### C.1 Formato Base

| Propiedad | Valor |
|---|---|
| **Post Instagram** | 1080 x 1440 px (ratio 3:4) |
| **Historia Instagram** | 1080 x 1920 px (ratio 9:16) |
| **Pauta cuadrada** | 1080 x 1080 px |

### C.2 Estructura del Flyer de Inscripciones (1080x1440)

El flyer se divide en 3 zonas principales:



### C.3 Posiciones Clave (coordenadas relativas al frame)

Para el layout La Mision Ninja / Torneo Blader (formato estandar):

| Elemento | Posicion X | Posicion Y | Tamano |
|---|---|---|---|
| Logo Bladers SF (top) | ~90px desde left | ~100px desde top | 247x115 |
| Logo/arte torneo | Centrado horizontalmente | ~350-500 desde top | Variable |
| **Gradient cut principal** | Full width (+margin) | **~Y=660 desde top** | 1169x989 |
| **Franja horizontal media** | Full width (+margin) | **~Y=505 desde top** | 1844x462 |
| **Franja horizontal superior** | Full width (+margin) | **~Y=505 desde top** | 1844x154 |
| Banner ribbon titulo | Centrado | ~Y=510 desde top | 891x151 |
| "INSCRIPCIONES ABIERTAS!" | Centrado | ~Y=870 desde top | 559x152 |
| Grupo fecha-lugar | Centrado | ~Y=1005 desde top | ~700x112 |
| Linea separadora vertical | Entre fecha y lugar | ~Y=1010 desde top | 0x95, stroke 7px |
| Icono location pin | Junto a lugar | ~Y=1070 desde top | 18x27 |
| "Hora de comienzo" | Centrado | ~Y=1120 desde top | ~646x44 |
| Boton CTA | Centrado | ~Y=1170 desde top | 669x58, radius 19 |
| "PARTICIPA POR UN BEYBLADE" | Sobre boton CTA | ~Y=1180 desde top | ~567x45 |
| "Participa y demostra..." | Centrado | ~Y=1230 desde top | ~718x37 |
| "Escribinos..." | Centrado | ~Y=1270 desde top | ~591x37 |
| Logo Bladers SF (bottom) | Centrado | ~Y=1240 desde top | 247x115 |

### C.4 Estructura del Flyer de Resultado / Puesto (Orden del Caballero, 1080x1440)



Colores clave del template Orden del Caballero:
- Fondo principal: #dcdbd9 (gris hueso)
- Gradient overlay grande: #ec790f -> #16222c (naranja a navy)
- Badge de puesto: fondo #37b8e1 (cian agua), texto blanco
- Marco decorativo: vectores blancos con sombra negra 16% opacidad
- Halftone/textura: imagen a 23% opacidad sobre el area inferior
---

## D. PATRONES Y TEXTURAS

### D.1 Halftone / Textura de puntos

Se aplica como una capa de imagen con opacidad reducida sobre la zona inferior del flyer.

| Propiedad | Valor |
|---|---|
| **Tipo** | Imagen rasterizada (no patron CSS) |
| **Opacidad** | 23% (opacity: 0.23) |
| **Area cubierta** | Zona inferior completa (desde el gradient cut hacia abajo) |
| **Tamano del layer** | ~1091x1744 (cubre todo el area inferior con overflow) |
| **Efecto visual** | Puntos blancos/claros sobre fondo oscuro, tipo halftone de comic |

La textura se repite identica en todos los templates que usan fondo naranja/oscuro (Torneo Blader, La Mision Ninja, Orden del Caballero). No se usa en Copa Omega Stars (que tiene fondo blanco/celeste).

### D.2 Separador Vertical (entre fecha y lugar)

| Propiedad | Valor |
|---|---|
| **Tipo** | Linea vertical (Vector de ancho 0) |
| **Stroke** | #ffffff (blanco) |
| **Stroke width** | 7px |
| **Altura** | 95px |

### D.3 Icono de Ubicacion (pin)

| Propiedad | Valor |
|---|---|
| **Tipo** | Vector (icono custom, no Lucide) |
| **Tamano** | 18x27 |
| **Fill** | #ffffff |
| **Efecto** | DROP_SHADOW negro 25% r:7 |
---

## E. GRADIENTES (especificaciones exactas)

### E.1 Gradient Cut Principal (transicion imagen a info)

Este gradiente crea la transicion entre la zona de imagen superior y la zona de informacion inferior.

**Torneo Blader / La Mision Ninja:**

| Propiedad | Valor |
|---|---|
| Tipo | GRADIENT_LINEAR |
| Color 1 (0%) | #ec790f (naranja fuego) alpha 1.0 |
| Color 2 (100%) | #16222c (navy oscuro) alpha 1.0 |
| Direccion | **Vertical, top to bottom** |
| Handles | (0.50, 0.00) -> (0.50, 1.00) -> (0.00, 0.00) |
| Tamano del rectangulo | 1169 x 989 |

**Copa Omega Stars:**

| Propiedad | Valor |
|---|---|
| Tipo | GRADIENT_LINEAR |
| Color 1 (0%) | #48abe5 (celeste medio) alpha 1.0 |
| Color 2 (100%) | #fefefe (blanco) alpha 1.0 |
| Direccion | **Vertical, top to bottom** |
| Handles | (0.50, 0.00) -> (0.50, 1.00) -> (0.00, 0.00) |
| Tamano del rectangulo | 1169 x 989 |

### E.2 Franja Horizontal Media (background inferior)

**Torneo Blader / La Mision Ninja:**

| Propiedad | Valor |
|---|---|
| Tipo | GRADIENT_LINEAR |
| Color 1 (0%) | #ee7b10 (naranja) alpha 1.0 |
| Color 2 (100%) | #fdac10 (dorado) alpha 1.0 |
| Direccion | **Casi vertical con leve diagonal** |
| Handles | (0.50, 0.00) -> (0.52, 0.89) -> (0.05, 0.01) |
| Tamano | 1844 x 462 (sobresale del frame a ambos lados) |

**Copa Omega Stars:**

| Propiedad | Valor |
|---|---|
| Tipo | GRADIENT_LINEAR |
| Color 1 (0%) | #57b5ee (celeste) alpha 1.0 |
| Color 2 (100%) | #9aceec (celeste claro/verde agua) alpha 1.0 |
| Direccion | **Casi vertical** |
| Handles | (0.50, 0.00) -> (0.52, 0.89) -> (0.05, 0.01) |
| Tamano | 1844 x 154 |

### E.3 Franja Horizontal Superior (accent strip)

Mismos colores que E.2 pero mas delgada:

| Propiedad | Valor |
|---|---|
| Tamano | 1844 x 154 |
| Colores | Identicos a E.2 de su torneo |

### E.4 Boton CTA

| Propiedad | Valor |
|---|---|
| Tipo | GRADIENT_LINEAR |
| Color 1 (0%) | #e61e11 (rojo fuerte) alpha 1.0 |
| Color 2 (100%) | #fca011 (naranja dorado) alpha 1.0 |
| Direccion | **Diagonal extrema (casi horizontal)** |
| Handles | (0.50, -1.67) -> (0.54, 2.22) -> (0.48, -1.65) |
| Tamano | 669 x 58 |
| Border radius | 19px |
| Opacidad | 65% (opacity: 0.65) |

Los handles indican una transicion muy gradual de rojo a naranja que va de izquierda a derecha con un angulo extremo.

### E.5 Banner Ribbon del Titulo del Torneo

El banner tiene dos capas:

**Capa 1 - Sombra/fondo:**

| Propiedad | Valor |
|---|---|
| Tipo | Vector (forma de ribbon/cinta) |
| Fill | #000aff (azul puro oscuro) |
| Tamano | 891 x 151 |
| Efecto | DROP_SHADOW negro 25% r:9.8 |

**Capa 2 - Relleno gradiente:**

| Propiedad | Valor |
|---|---|
| Tipo | GRADIENT_LINEAR |
| Color 1 (0%) | #00b3ff (cian brillante) alpha 1.0 |
| Color 2 (100%) | #b9942e (dorado oscuro) alpha 1.0 |
| Direccion | **Diagonal pronunciada (bottom-left a top-right)** |
| Handles | (0.00, 1.88) -> (0.90, -0.39) -> (0.02, 2.33) |
| Tamano | 865 x 117 |

La diagonal va de bottom-left a top-right, creando un efecto de brillo metalico que va de cian a dorado.

**Variante violeta (Torneo Blader dic 2025):**
- Color 1 (0%): #52f9ff (cian neon)
- Color 2 (100%): #260e42 (purpura oscuro)

### E.6 Barra de Precio/Hora (Mision Ninja variante)

| Propiedad | Valor |
|---|---|
| Tipo | GRADIENT_LINEAR |
| Color 1 (0%) | #3c3a13 (oliva oscuro) alpha 1.0 |
| Color 2 (100%) | #fdac10 (dorado) alpha 1.0 |
| Handles | (0.50, 0.00) -> (0.52, 0.89) -> (0.05, 0.01) |
| Tamano | 1844 x 154 |
---

## F. EFECTOS Y SOMBRAS

Todos los textos principales llevan la misma sombra:

| Propiedad | Valor |
|---|---|
| Tipo | DROP_SHADOW |
| Color | #000000 (negro) alpha 0.25 (25%) |
| Radio de blur | Proporcional al tamano del texto (~10% del font-size) |
| Offset X | 0 |
| Offset Y | Igual al radio de blur |

Tabla de radios por tamano de texto:

| Font Size | Shadow Radius | Shadow Offset Y |
|---|---|---|
| 82.7px | 8.6px | 8.6px |
| 72.0px | 7.5px | 7.5px |
| 62.7px | 6.5px | 6.5px |
| 57.1px | 6.0px | 6.0px |
| 44.3px | 4.6px | 4.6px |
| 42.2px | 4.4px | 4.4px |
| 40.9px | 4.3px | 4.3px |
| 40.0px | 4.3px | 4.3px |
| 33.6px | 3.5px | 3.5px |
| 23.3px | 2.4px | 2.4px |

Formula aproximada: shadow_radius = fontSize * 0.104

---

## G. LOGOS Y ASSETS

### G.1 Logo Bladers Santa Fe

**Logotipo completo (con icono):**
- Archivo: bladers-logo.png
- Contenido: Beyblade azul girando + puente colgante (Santa Fe) + sunset naranja
- Tamano en flyer: 247x115 (posicion top-left) o 260x121 (posicion bottom)

**Logotipo solo texto:**
- Archivo: bladers-text.png
- Contenido: BLADERS en azul navy bold + SANTA FE en naranja/dorado
- Tipografia: Custom (parece Luckiest Guy o similar display bold)
- Colores del texto: BLADERS azul navy #11202d, SANTA FE gradiente naranja-dorado

### G.2 Logo La Orden del Caballero

- Archivo: la_orden_del_caballero_logo_transparent_8192.png
- Contenido: Caballero con sombrero + shield con swirls azul y amarillo
- Texto: "LA ORDEN DEL" (lineal, flanqueado por rayas amarillas) + "CABALLERO" (bold grande)
- Paleta del logo: Negro #000000, azul #3b7fbb, amarillo #d4a21f, cian #37b8e1
- Estilo: Esports/gaming badge con silueta misteriosa

### G.3 Logo Copa Omega Stars

- No hay archivo PNG standalone disponible en el repo; esta embebido como imagen en Figma
- Contenido: Omega dorada + "COPA OMEGA STARS" + estrellas
- Paleta: Dorado, blanco, azul celeste, naranja

### G.4 Logo La Mision Ninja

- Archivo de referencia: la-mision-ninja.png (post completo)
- Contenido: Ninja con mascara purpura + estrellas shuriken
- Paleta: Purpura #5b2d8e, verde #3cb043, naranja #ee7b10, negro

---

## H. PATRONES DE COMPOSICION RECURRENTES

### H.1 Grupo Fecha-Lugar

Estructura consistente en todos los flyers:

- Fecha: 2 lineas (DIA-NUMERO + MES) -- ej: "SAB-21" / "FEBRERO"
- Separador: linea vertical blanca (7px stroke, 95px alto)
- Lugar: 2 lineas (NOMBRE CORTO + DIRECCION con icono pin de ubicacion)
- Todo centrado horizontalmente en el frame
- Icono pin location (18x27) aparece antes de la direccion

### H.2 Banner Ribbon

Forma de cinta/ribbon con extremos puntiagudos:
- Capa inferior azul oscuro #000aff (891x151) con shadow
- Capa superior gradiente cian-dorado (865x117) superpuesta
- Texto blanco bold 82.7px centrado con shadow

### H.3 Stack de Informacion (bottom section)

Orden de arriba a abajo:
1. Banner ribbon con nombre del torneo
2. "INSCRIPCIONES ABIERTAS!" (72px)
3. Grupo fecha-lugar (62.7px)
4. "Hora de comienzo: 16:00h" (40px)
5. Boton CTA con "PARTICIPA POR UN BEYBLADE" (40.9px)
6. Texto complementario (33.6px)
7. Logo Bladers SF (247x115)

### H.4 Posts de Resultado (Primer Puesto / Ganador)

Formato especifico para anunciar ganadores de torneo.
Variante sencilla (Post 6, 9, 26):

- Gradient de fondo: #0085e7 -> #fdac10 (azul a dorado, vertical)
- Banner ribbon: misma estructura de E.5
- Texto "TORNEO N 1": 61.7px, blanco
- Texto "PRIMER PUESTO": 82.7px, blanco (dentro del ribbon)
- Nombre del ganador: 82.7px, blanco

---

## I. RESUMEN: COMO USAR ESTE SISTEMA

### Para crear un flyer de inscripciones:

1. **Elegir paleta del torneo** (seccion A)
2. **Componer layout** (seccion C.2): imagen arriba 60%, gradient cut, info abajo
3. **Aplicar gradientes** (seccion E): gradient cut + franja horizontal + banner ribbon
4. **Tipografia** (seccion B): Normatica Bold para todo, tamanos de la tabla B.2
5. **Texturas** (seccion D): halftone al 23% en la zona inferior
6. **Efectos** (seccion F): drop shadow en todos los textos principales
7. **Logos** (seccion G): Bladers SF top-left y bottom, logo torneo centro

### Para crear un flyer de resultado:

1. **Usar template Orden del Caballero** (seccion C.4) o **template sencillo** (H.4)
2. **Foto del blader** recortada con mask/clip path
3. **Cards de beyblades** en fila (si Orden del Caballero)
4. **Badge de puesto** con fondo cian #37b8e1
5. **Nombre** en 64px con stroke negro

---

## J. ARCHIVOS DE REFERENCIA

| Archivo | Ubicacion | Contenido |
|---|---|---|
| Figma FEED BLADERS | figma.com/design/KdjeXYgJnn6aOpe8Ee5bC4 | Archivo fuente completo |
| bladers-logo.png | public/bladers-logo.png | Logo con icono |
| bladers-text.png | public/bladers-text.png | Logo solo texto |
| la-mision-ninja.png | public/posts/la-mision-ninja.png | Post Mision Ninja |
| Orden del Caballero logo | Downloads (local) | Logo hi-res 8192px |
| Halftone texture | Embebida en Figma como imagen | image ref en JSON |

---

> Fin del documento. Mantener actualizado cuando se agreguen nuevos torneos o se modifique la identidad visual.