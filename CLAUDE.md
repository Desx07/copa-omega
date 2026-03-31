# CLAUDE.md — Copa Omega Star

> Leer este archivo AL INICIO de cada sesión antes de hacer cualquier cosa.
> Contiene reglas aprendidas de la experiencia real trabajando con Ariel.

---

## 👤 Contexto del usuario

**Ariel** — Founder de Bladers Santa Fe. Maneja Copa Omega y PawGo simultáneamente.
- La comunidad juega **UNA VEZ por semana**. Todo el diseño gira alrededor del ciclo semanal de torneo.
- PawGo es la referencia de calidad. Leer código de `C:\Users\ariel\Desktop\go\pawgo` antes de cualquier decisión de UI.

---

## 🚨 REGLAS CRÍTICAS (nunca ignorar)

### Deploy
- **NUNCA pushear a prod sin aprobación explícita del usuario.**
- Siempre trabajar en localhost primero → mostrar resultado → esperar "ok" antes de `vercel --prod`.
- Después de cada `git push origin master`, verificar que Vercel deployó:
  ```bash
  gh api repos/Desx07/copa-omega/deployments --jq '.[0] | {sha: .sha[0:7], created_at: .created_at}'
  ```
- Comparar el SHA con el HEAD local. Si no coinciden → alertar y ofrecer `npx vercel --prod` como alternativa.
- **Nunca decir "pusheado a prod" sin verificar el deploy.** (En marzo 2026 Vercel dejó de detectar pushes silenciosamente — se perdieron 10+ cambios.)

### Agentes
- **SIEMPRE usar múltiples agentes en paralelo.** Nunca trabajar solo en diseño/UI.
- Para cualquier tarea de UI/diseño: invocar `ux-designer`, `ui-shared`, `tournament-ui` o el agente correspondiente simultáneamente.
- El agente `devops` maneja todo lo de infra — no mezclarlo con otros agentes.

### Cambios
- **Cambios pequeños y revisables.** Un cambio a la vez, el usuario revisa, se itera.
- Commits frecuentes después de cada conjunto significativo de cambios.
- No hacer rewrites masivos — producen resultados peores y el usuario no puede trackear qué cambió.

### Datos
- **NUNCA crear datos de prueba en la DB de producción.** Usar entorno separado.

### Xciclopedia
- El contenido debe ser **detallado y respetuoso**. Nunca hacer resúmenes apresurados de beyblades o jugadores.

---

## 🏗️ Stack confirmado

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind |
| Backend | Next.js API Routes |
| Base de datos | Supabase cloud (proyecto: `dceypgpgxusebiaofwpb`, nombre: `copa-omega-star`) |
| Auth | Supabase Auth |
| Storage | Supabase buckets: `avatars`, `products`, `payments`, `media` |
| Deploy | Vercel — URL prod: https://bladers-sf.vercel.app |
| Servicios | Groq (chat), Resend (email), Web Push (VAPID) |
| Testing | Playwright (E2E) |
| Scripts | Python (`parse_battles.py`) |
| CLI | GitHub CLI (`gh`), Supabase CLI |
| Canvas | Node Canvas con fuentes custom |

---

## 🤖 Agentes disponibles (`.claude/agents/`)

| Agente | Responsabilidad |
|---|---|
| `tournament-ui` | Brackets, fixtures, resultados de torneo |
| `player-ui` | Perfiles, stats, historial de jugadores |
| `admin-ui` | Panel de administración |
| `auth-ui` | Login, sesiones, permisos, middleware |
| `ui-shared` | Componentes compartidos, design system |
| `ux-designer` | Flujos, accesibilidad, consistencia visual |
| `backend-dev` | API routes, lógica de negocio, Supabase |
| `db-architect` | Esquema, migraciones SQL, queries |
| `devops` | Vercel, CI/CD, variables de entorno, Supabase remote |
| `qa-tester` | Playwright E2E, tests, cobertura |
| `error-monitor` | Diagnóstico de errores en runtime |
| `perf-auditor` | Core Web Vitals, bundle size |
| `code-reviewer` | Code review, deuda técnica |
| `investigador` | Research técnico, exploración |
| `marketing` | Copy, contenido, promoción |
| `comunicador` | Changelogs, documentación interna |

---

## 🛠️ Skills disponibles (`.claude/skills/`)

20 skills disponibles. Las más relevantes:

| Skill | Cuándo usarla |
|---|---|
| `canvas-design/` | Brackets visuales, cards de jugadores, gráficos del torneo |
| `brainstorming/` | Diseño de features, exploración |
| `react-best-practices/` | Performance, patrones React/Next.js |
| `senior-architect/` | Decisiones de arquitectura complejas |
| `senior-frontend/` | Optimización Next.js, patrones avanzados |
| `senior-backend/` | API design, seguridad, DB |
| `ui-ux-pro-max/` | Diseño de interfaces de alto nivel |
| `theme-factory/` | Temas visuales (midnight-galaxy, tech-innovation, etc.) |
| `code-reviewer/` | Checklist de revisión, anti-patterns |
| `webapp-testing/` | Testing de aplicaciones web |
| `mcp-builder/` | Construcción de MCPs custom |

---

## 🎭 Roles disponibles (`.claude/roles/`)

38 roles. Los más usados:
- Arquitectura → `tech-leader-1` / `tech-leader-2`
- Feature full stack → `dev-fullstack-frontend` + `dev-fullstack-backend`
- Diseño → `ux-ui-designers`
- Testing → `qa-automation`
- Reglas Beyblade → `game-developers`
- Analítica → `analysts`
- Seguridad → `cybersecurity`

---

## 🎨 Estándares de diseño

- **Referencia de estilos:** Copa Omega tiene su propia identidad visual definida en el código. No hay referencia externa. Siempre leer `C:\Users\ariel\Desktop\go\pawgo` antes de tomar decisiones de UI.
- Seguir los patrones de cards, botones, layouts y navegación de PawGo documentados en `.claude/memory/design_patterns.md`.
- Para componentes nuevos → pasar siempre por `ui-shared` primero.
- Tono visual Copa Omega: competitivo, dinámico — energía de torneo.
- Accesibilidad mínima: contraste WCAG AA, labels en inputs, navegación por teclado.

---

## 🔄 Parseo de batallas

- Script: `parse_battles.py`
- Archivos tmp: `tmp_bits.txt`, `tmp_excel.txt`, `tmp_fundamentals.txt`, `tmp_ratchets.txt`
- Imágenes de piezas: `tmp_blades_img/pieces/` — no mover, referenciar por nombre.
- Cambios en el formato de salida → coordinar con `tournament-ui`.

---

## 🏗️ Flujo de trabajo

### Al iniciar una sesión
1. Leer la sección **Lecciones aprendidas** al pie de este archivo.
2. Leer `.claude/memory/MEMORY.md` para contexto adicional.
3. Identificar el agente/rol para la tarea.
4. Si la tarea cruza múltiples áreas → planificar con subagentes en paralelo.

### Antes de cualquier cambio
1. Modo plan — qué se va a cambiar y por qué.
2. Confirmar agente y rol.
3. Definir cómo se verifica en localhost antes de subir.

### Durante el desarrollo
- Cambiar solo lo necesario.
- No mezclar refactors con features.
- TypeScript estricto — sin `any`, sin `// @ts-ignore`.
- Queries Supabase siempre con manejo de errores.

### Antes de cerrar la tarea
1. `npx playwright test`
2. `npx tsc --noEmit`
3. Mostrar en localhost y esperar aprobación.
4. Solo si hay aprobación → `git push origin master` → verificar deploy con `gh api`.

---

## 🐛 Bugs y errores

- Bug reportado → arreglarlo directamente sin pedir más contexto.
- `error-monitor` diagnostica → `devops` si es infra → `backend-dev` si es lógica.
- Tests Playwright fallando → `qa-tester` los corrige sin esperar instrucciones.
- Error de build en Vercel → revisar logs con `gh api` y resolver.

---

## ⚙️ Comandos DevOps frecuentes

```bash
# Deploy manual si auto-deploy falla
npx vercel --prod

# Verificar último deploy
gh api repos/Desx07/copa-omega/deployments --jq '.[0] | {sha: .sha[0:7], created_at: .created_at}'

# Push migrations a Supabase
npx supabase db push

# Generar tipos TypeScript
npx supabase gen types typescript --project-id dceypgpgxusebiaofwpb > lib/supabase/database.types.ts

# Correr tests
npx playwright test

# Verificar tipos
npx tsc --noEmit
```

---

## ✅ Estándares de calidad

- TypeScript estricto, sin `any`, interfaces definidas.
- Supabase con RLS activado en tablas sensibles.
- UI componentes reutilizables via `ui-shared`.
- Imágenes via Next.js `<Image>`, lazy loading.
- Tests Playwright antes de mergear features nuevas.
- Secrets solo en `.env.local`, nunca en código ni en permisos.
- Comentarios en español en el código.

---

## 🔁 Ciclo de auto-mejora

- Después de cada corrección del usuario → agregar lección abajo.
- Mismo error dos veces → regla explícita aquí.
- Revisar esta sección al inicio de cada sesión.

---

## 📝 Lecciones aprendidas

> Aprendidas de la experiencia real. No ignorar.

- **Deploy silencioso (marzo 2026):** Vercel dejó de detectar pushes a master sin avisar. Siempre verificar con `gh api` después de cada push.
- **Deploys sin aprobación:** No pushear a prod sin que Ariel diga "ok". Siempre mostrar en localhost primero.
- **Agente único:** Usar un solo agente en tareas de UI produce resultados mediocres. Siempre invocar múltiples agentes en paralelo.
- **Rewrites masivos:** Cambios grandes empeoran el resultado y el usuario no puede seguir qué cambió. Cambios pequeños e iterativos.
- **Datos en prod:** Nunca testear con datos reales en producción.
- **Xciclopedia:** El contenido de beyblades y jugadores es serio para la comunidad. Detallado y respetuoso, nunca apurado.
- **Cadencia semanal:** La comunidad juega una vez por semana. Todas las features deben pensar en ese ciclo (torneo del domingo, stats de la semana, etc).
- **PawGo primero:** Antes de cualquier decisión de UI, leer el código de PawGo como referencia.
