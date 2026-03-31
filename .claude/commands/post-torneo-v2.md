# /post-torneo

Genera flyer + copy de Instagram y WhatsApp para un evento de Bladers Santa Fe.
Usa Figma para los templates y Nano Banana para generar la imagen final.

---

## Paso 1 — Pedir datos del evento

Preguntar al usuario:

1. **Nombre del torneo** (ej: "Dominio Salvaje", "Copa Omega Star")
2. **Fecha** (ej: "Domingo 1 de marzo")
3. **Hora** (ej: "16:00 hs")
4. **Lugar** — por defecto "Parque Federal", preguntar solo si es otro
5. **¿Hay invitado especial?** (ej: @yomotsu.blader) — opcional
6. **¿Tiene inscripción paga?** ¿Cuánto?
7. **¿Es fecha de Copa Omega Star?** (para mencionar el ranking y el link de la app)
8. **Link de inscripción** si hay (Google Form)
9. **¿Querés imagen nueva o usamos un template de Figma?**

---

## Paso 2 — Generar imagen del flyer

### Opción A — Template de Figma
Abrir el archivo de Figma:
`https://www.figma.com/design/KdjeXYgJnn6aOpe8Ee5bC4/FEED-BLADERS`

Mostrar los templates disponibles y preguntar cuál usar.
Actualizar los textos con los datos del evento y exportar como PNG.

### Opción B — Generar con Nano Banana
Si el usuario quiere imagen nueva, usar el MCP de Nano Banana con este prompt base:

```
Flyer para torneo de Beyblade X en Argentina. Estilo anime japonés moderno.
Colores: [según el torneo — verde/dorado para Dominio Salvaje, azul/dorado para Copa Omega Star].
Incluir en el diseño:
- Nombre del torneo: [NOMBRE] en tipografía bold impactante
- Fecha: [FECHA] y hora: [HORA]
- Lugar: Parque Federal
- Logo "Bladers Santa Fe" en esquina inferior
- Fondo dinámico con efectos de beyblades girando
- Formato vertical 1080x1350px (Instagram feed)
Estilo de referencia: cartel de torneo competitivo tipo esports, energético y juvenil.
```

Guardar la imagen generada en: `C:\Users\ariel\Desktop\go\copa-omega\public\posts\`

---

## Paso 3 — Generar copy de WhatsApp

```
🔥 ¡ATENCIÓN BLADERS!
Práctica + TORNEO en el Parque Federal 🔥
Beyblade Generación X

🗓 [DÍA Y FECHA]
📍 Parque Federal
⏰ [HORA] hs

[Si hay invitado:]
Esta fecha es especial… 👀
Contamos con la presencia de 👉 @[INVITADO]

[Si es Copa Omega Star:]
Esta jornada es parte de la COPA OMEGA STAR ⭐
Una competencia donde los Bladers suman estrellas en el ranking mediante desafíos y combates.

⚡ La práctica sigue siendo 100% GRATIS
🌀 Si no tenés Beyblade, te prestamos para que puedas jugar igual 🙌🏻

🌀 Modalidades de la jornada:
🔹 Mini torneos de práctica
🔹 Rey de la Montaña (el ganador se mantiene hasta completar la ronda)
[Si es Copa Omega: 🔹 Desafíos por ⭐ estrellas de ranking]

🏆 Torneo oficial: [NOMBRE DEL TORNEO]
[Si tiene costo: 💰 Inscripción: $[MONTO]]

[Si es Copa Omega:]
⚠️ Para participar del torneo crearte una cuenta en:
👉 https://bladers-sf.vercel.app

[Si hay link de inscripción:]
⚡ Inscripción [NOMBRE]:
[LINK]

🎒 Recordá traer:
• Agua / teres / mate 💧
• Gorra 🧢
• OFF o repelente 🦟
• Paraguas (en caso de lluvia)
• ¡Ganas de competir y girar fuerte!

⚠️ En caso de lluvias fuertes se avisará si se cancela.

LET IT RIP! 🌀🔥
```

---

## Paso 4 — Generar copy de Instagram

Versión corta — máximo 8 líneas antes del "ver más":

```
🔥 [NOMBRE TORNEO] — Parque Federal

🗓 [FECHA] | ⏰ [HORA] hs
📍 Santa Fe, Argentina

[1 línea del highlight — invitado, Copa Omega, o lo más importante del evento]

⚡ Práctica GRATIS · 🌀 Te prestamos beyblade
🏆 Torneo oficial[Si tiene costo: · Inscripción $[MONTO]]

LET IT RIP! 🌀🔥

#BeybladeSantaFe #BladersSantaFe #BeybladeX #LetItRip #CopaOmegaStar #TorneoBeyblade #BeybladeArgentina
```

---

## Paso 5 — Entregar todo junto

Al terminar, mostrar al usuario:

1. ✅ Imagen del flyer generada (path o preview)
2. ✅ Copy de WhatsApp — listo para copiar
3. ✅ Copy de Instagram — listo para copiar
4. ✅ Recordar mencionar a @bladers.sfe en IG si aplica

---

## Notas

- Tono siempre energético, emojis, castellano argentino
- Nunca "usted" ni lenguaje formal
- La práctica siempre es gratis — mencionarlo siempre
- Copa Omega Star → siempre incluir link de la app
- Instagram oficial: @bladers.sfe
- Cuenta de Beyblade oficial: @yomotsu.blader (para menciones)
