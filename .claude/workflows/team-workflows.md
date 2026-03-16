# 🔄 WORKFLOWS DEL EQUIPO — Flujos de Trabajo por Tipo de Proyecto

---

## WORKFLOW 1: SAAS DESDE CERO

### Fase 0 — Discovery (Sesión 1)
```
CLAUDE.md (PM) → recibe idea del usuario
    │
    ├── AN-1 (Product) → produce PRODUCT BRIEF en 30 min
    ├── AN-3 (Security) → produce THREAT MODEL inicial
    └── TL-1 (Arqui) → produce ARCHITECTURE OVERVIEW
    
Output de Fase 0:
├── product-brief.md
├── threat-model-inicial.md
└── architecture-overview.md
```

### Fase 1 — Fundamentos (Sesiones 2-3)
```
TL-1 → produce:
  ├── ERD (diagrama de base de datos)
  ├── API contract (OpenAPI spec)
  └── ADR de decisiones clave

TL-2 → produce:
  ├── Monorepo setup (Turborepo)
  ├── CI/CD pipeline base
  └── Docker configs
  
DevOps → produce:
  ├── AWS infrastructure base (Terraform)
  └── Ambientes: dev / staging / prod
  
QA-1 → produce:
  └── Test plan completo
```

### Fase 2 — MVP Backend (Sesiones 4-6)
```
FS-B1 → implementa:
  ├── Auth (registro, login, refresh, logout)
  ├── Módulos de negocio core
  └── Tests unitarios e integración

AWS-1 → configura:
  ├── RDS PostgreSQL
  ├── ElastiCache Redis
  └── ECS service

QA-2 → ejecuta:
  └── Security testing de endpoints
```

### Fase 3 — MVP Frontend (Sesiones 7-10)
```
FS-F1 → implementa:
  ├── Auth flows (login, registro, recuperar password)
  ├── Dashboard principal
  └── Features core del SaaS

FS-2 → implementa (si aplica):
  ├── Integración de pagos (Stripe)
  └── Emails transaccionales

QA-1 → ejecuta:
  └── E2E tests de flujos críticos
```

### Fase 4 — Go Live (Sesión 11-12)
```
DevOps → configuración producción:
  ├── SSL / dominio
  ├── CloudFront
  └── Alertas y monitoring

AN-2 → setup analytics:
  ├── Tracking de eventos
  └── Dashboards iniciales

AN-3 → security review final
QA-3 → accessibility + cross-browser check
```

---

## WORKFLOW 2: API / MICROSERVICIO

### Sesión 1 — Diseño
```
TL-1 → API Contract completo (OpenAPI)
AN-3 → Security requirements
QA-1 → Test cases from contract
```

### Sesión 2-3 — Implementación
```
FS-B1 → implementación completa con tests
TL-1 → code review
QA-2 → performance + security testing
```

### Sesión 4 — Deploy
```
DevOps → pipeline + ECS/Lambda deploy
AWS-1 → infra y network config
AWS-2 → security review de IAM y configuración
```

---

## WORKFLOW 3: DEVOPS / INFRA SETUP

### Sesión 1 — Arquitectura Cloud
```
AWS-1 → diagrama de arquitectura + costos estimados
AWS-2 → security baseline + compliance checklist
TL-1 → valida que la infra soporta los requerimientos
```

### Sesión 2 — IaC
```
AWS-1 → módulos Terraform principales (VPC, ECS, RDS)
AWS-2 → IAM policies + Secrets Manager + KMS
DevOps → CI/CD pipeline + Docker configs
```

### Sesión 3 — Observability
```
DevOps → CloudWatch dashboards + alertas
TL-2 → OpenTelemetry en las apps
AN-2 → dashboards de negocio
```

---

## WORKFLOW 4: PWA / APP MÓVIL

### Sesión 1 — Diseño y arquitectura
```
AN-1 → user flows y wireframes textuales
TL-1 → arquitectura shared code web + mobile
FS-F1 → plan de componentes y system de diseño
```

### Sesión 2-4 — Implementación
```
FS-F1 → web (Next.js PWA)
FS-3 → mobile (Expo)
FS-B1 → API que sirve a ambos
QA-3 → testing mobile + accesibilidad
```

---

## 📅 ESTRUCTURA DE SESIÓN TIPO

Cada sesión de trabajo con Claude Code sigue este formato:

```markdown
### INICIO DE SESIÓN
1. PM (CLAUDE.md) pregunta contexto:
   - Proyecto activo
   - Qué se completó
   - Foco de hoy
   
2. Roles activos cargan contexto del proyecto

### DURANTE LA SESIÓN
- Un rol trabaja a la vez (o se coordina explícitamente)
- Commits frecuentes con conventional commits
- Cualquier decisión de arquitectura se documenta en decisiones.md

### CIERRE DE SESIÓN
- Resumen de qué se completó
- Próximos pasos documentados
- Cualquier deuda técnica registrada
```

---

## 🚦 DEFINICIÓN DE DONE — GLOBAL

Un feature está DONE cuando:
```markdown
[ ] Código implementado según la arquitectura definida
[ ] Tests escritos y pasando (unit + integración según aplique)
[ ] Code review aprobado por TL-1 o TL-2
[ ] No rompe ningún test existente
[ ] Documentación actualizada (API, README, ADR si hay decisión nueva)
[ ] Security review para features con auth/datos sensibles
[ ] QA sign-off para features de usuario final
[ ] Performance: no regresiones
[ ] Deploy a staging exitoso
[ ] PM (CLAUDE.md) marca como completo en el roadmap
```
