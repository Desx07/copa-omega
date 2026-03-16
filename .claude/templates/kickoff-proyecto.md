# 🚀 TEMPLATE: KICKOFF DE PROYECTO NUEVO

> Copiá este archivo como `/tu-proyecto/.context/kickoff.md` y completalo.
> El PM (CLAUDE.md) usa esto para activar el equipo correcto.

---

## 📋 INFORMACIÓN BÁSICA

```
Nombre del proyecto:    [NOMBRE]
Fecha de inicio:        [FECHA]
Tipo:                   [ ] SaaS  [ ] API  [ ] DevOps  [ ] PWA/Mobile  [ ] Híbrido
Urgencia del MVP:       [ ] ASAP  [ ] 2-4 semanas  [ ] 1-3 meses  [ ] Sin fecha fija
```

---

## 💡 LA IDEA (en tus palabras)

```
[Describí el proyecto como se te ocurrió. No importa si está desordenado.
El equipo va a estructurarlo. Mientras más contexto, mejor.]
```

---

## 🎯 OBJETIVO PRINCIPAL

```
¿Qué problema resuelve este proyecto?

¿Para quién?

¿Cuál es el resultado esperado del MVP?
```

---

## 👥 ROLES ACTIVADOS (el PM los determina)

```
El PM (CLAUDE.md) completa esta sección:

[ ] TL-1 (Arquitectura)         → Requerido: siempre
[ ] TL-2 (Plataforma)           → Requerido si: proyecto nuevo desde cero
[ ] FS-B1 (Backend)             → Requerido si: hay API o lógica de servidor
[ ] FS-F1 (Frontend)            → Requerido si: hay interfaz de usuario
[ ] FS-2 (Integraciones)        → Requerido si: pagos, auth social, IA, real-time
[ ] FS-3 (Mobile)               → Requerido si: app móvil o PWA avanzada
[ ] FS-4 (Data/Perf)            → Requerido si: analytics heavy o performance crítica
[ ] DevOps                      → Requerido si: infra nueva o CI/CD
[ ] AWS-1 (Cloud Arch)          → Requerido si: AWS infra
[ ] AWS-2 (Security/Data)       → Requerido si: compliance o data engineering
[ ] QA-1 (Lead)                 → Requerido: siempre
[ ] QA-2 (Perf/Security)        → Requerido si: app pública o datos sensibles
[ ] QA-3 (Mobile/A11y)          → Requerido si: mobile o accesibilidad crítica
[ ] AN-1 (Product)              → Requerido si: proyecto nuevo o cambio de scope
[ ] AN-2 (Data)                 → Requerido si: analytics o tracking
[ ] AN-3 (Security)             → Requerido: siempre (threat modeling)
```

---

## 🏗️ CONTEXTO TÉCNICO (si ya tenés algo)

```
Stack existente (si hay):       [o "greenfield"]
Repositorio:                    [URL o "por crear"]
Ambiente de producción actual:  [o "por crear"]
Integraciones conocidas:        [Stripe, Auth0, etc. o "ninguna aún"]
Restricciones técnicas:         [lenguaje obligatorio, proveedor cloud, etc.]
```

---

## 📊 REFERENCIAS Y BENCHMARKS

```
¿Hay algún producto similar que sirva de referencia?
[Nombre del producto / URL]

¿Qué tiene ese producto que querés? ¿Qué haría diferente?
```

---

## ✅ OUTPUT ESPERADO DE ESTA SESIÓN

El PM (CLAUDE.md) define qué produce el equipo en la sesión de kickoff:

```markdown
1. [ ] AN-1 → Product Brief completo
2. [ ] TL-1 → Architecture Overview + decisiones iniciales
3. [ ] AN-3 → Threat Model inicial
4. [ ] TL-2 → Estructura de proyecto y setup inicial
5. [ ] QA-1 → Test Plan borrador
6. [ ] DevOps → Plan de infra
7. [ ] PM    → Roadmap de sesiones estimado
```

---

## 📁 ARCHIVOS QUE SE CREAN EN KICKOFF

```
.context/
├── kickoff.md          ← Este archivo (completado)
├── product-brief.md    ← AN-1 produce esto
├── arquitectura.md     ← TL-1 produce esto
├── threat-model.md     ← AN-3 produce esto
├── decisiones.md       ← ADR log (todos contribuyen)
├── roadmap.md          ← PM mantiene esto
└── deuda-tecnica.md    ← Registro de TODOs técnicos
```
