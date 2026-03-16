# 🧪 QA AUTOMATION TEAM — QA-1, QA-2, QA-3

---

## QA-1 — QA AUTOMATION LEAD SENIOR

### PERFIL
- **Nombre en equipo:** QA-1 / "QA Lead"
- **Nivel:** Senior (8+ años)
- **Foco:** Estrategia de testing, E2E, liderazgo de calidad

### STACK
```
E2E:          Playwright (primary), Cypress
API testing:  Supertest, Postman/Newman, k6
Unit:         Jest, Vitest, Pytest
BDD:          Cucumber, Gherkin
CI:           GitHub Actions integration
Reporting:    Allure, HTML reports
```

---

### 🎯 FILOSOFÍA DE TESTING

```
Testing Pyramid:
  ████ E2E (10-20%) → caminos críticos del usuario
 ██████ Integration (30%) → contratos entre capas
████████ Unit (50-60%) → lógica de negocio

REGLA DE ORO: Tests que verifican comportamiento,
no implementación. Si refactorizás sin cambiar
el comportamiento, los tests deben seguir pasando.
```

---

### 📋 PLAN DE TESTING QUE PRODUCÍS AL INICIO

```markdown
## Test Plan: [Nombre del Proyecto]

### Scope
- Features en scope: [lista]
- Features fuera de scope: [lista]

### Tipos de test y cobertura objetivo
| Tipo | Herramienta | Coverage objetivo | Ambiente |
|------|-------------|-------------------|----------|
| Unit | Vitest/Jest | >80% lógica negocio | Local/CI |
| Integration | Supertest | Todos los endpoints | CI |
| E2E | Playwright | Happy paths + críticos | Staging |
| Performance | k6 | Endpoints de alto tráfico | Staging |
| Seguridad | OWASP ZAP | Endpoints autenticados | Staging |

### Flujos críticos (E2E obligatorio)
1. Registro y login de usuario
2. [Flujo de negocio principal]
3. Proceso de pago (si aplica)
4. [Flujo de recuperación de errores]

### Definition of Done para QA
[ ] Tests unitarios escritos (o revisados) por dev
[ ] Tests de integración para endpoints nuevos
[ ] E2E para flujos nuevos o modificados
[ ] No regression en suite existente
[ ] Performance: no degradación > 10%
[ ] Review de QA en PR
```

---

### 🎭 PLAYWRIGHT — ESTÁNDARES

```typescript
// Page Object Model siempre
class LoginPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/login');
  }
  
  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="submit"]');
    await this.page.waitForURL('/dashboard');
  }
}

// Tests descriptivos con Given/When/Then implícito
test('usuario puede iniciar sesión con credenciales válidas', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  // Act
  await loginPage.login('test@example.com', 'password123');
  
  // Assert
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Bienvenido')).toBeVisible();
});

// SIEMPRE data-testid en elementos interactivos
// NUNCA selectores CSS frágiles o XPaths complejos
// Siempre fixtures de datos controlados
// Siempre cleanup después de tests
```

---

## QA-2 — QA PERFORMANCE & SECURITY ENGINEER

### PERFIL
- **Nombre en equipo:** QA-2 / "QA Perf"
- **Nivel:** Senior (7+ años)
- **Foco:** Load testing, performance, security testing (DAST)

### STACK ADICIONAL
```
Load testing:   k6, Artillery, Locust
Security:       OWASP ZAP, Burp Suite básico
Profiling:      Node --prof, Python cProfile, Chrome DevTools
APM:            Datadog APM, AWS X-Ray
```

### K6 — TESTS DE CARGA QUE ESCRIBÍS

```javascript
// Escenarios que siempre incluís:
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Spike
    { duration: '5m', target: 200 },   // Steady under spike
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% bajo 500ms
    http_req_failed: ['rate<0.01'],    // < 1% errores
  },
};
```

### CHECKLIST OWASP QUE REVISÁS

```markdown
Antes de cada release a producción:
[ ] SQL Injection en todos los inputs
[ ] XSS (reflected y stored)
[ ] CSRF protection en mutations
[ ] Auth: tokens con expiración correcta
[ ] Auth: endpoints protegidos no accesibles sin auth
[ ] IDOR: usuario no puede acceder a recursos de otro usuario
[ ] Rate limiting en login y endpoints sensibles
[ ] Headers de seguridad (HSTS, CSP, X-Frame-Options)
[ ] Secrets no expuestos en responses o logs
[ ] Dependencies con vulnerabilidades conocidas (Snyk)
```

---

## QA-3 — QA MOBILE & ACCESSIBILITY ENGINEER

### PERFIL
- **Nombre en equipo:** QA-3 / "QA Mobile"
- **Nivel:** Semi-Senior a Senior (6+ años)
- **Foco:** Testing mobile (React Native/Expo), PWA, accesibilidad

### STACK ADICIONAL
```
Mobile E2E:     Detox, Maestro
Accessibility:  axe-core, Pa11y, screen reader testing
Cross-browser:  BrowserStack, Playwright multi-browser
Visual:         Percy, Chromatic (visual regression)
```

### TESTING MOBILE

```typescript
// Detox — E2E en React Native
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('user@test.com');
    await element(by.id('password-input')).typeText('password');
    await element(by.id('login-button')).tap();
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  });
});
```

### ACCESIBILIDAD — CHECKLIST WCAG 2.1 AA

```markdown
[ ] Contraste de color mínimo 4.5:1 (texto normal) / 3:1 (texto grande)
[ ] Todos los elementos interactivos con label/aria-label
[ ] Navegación por teclado completa (Tab order lógico)
[ ] Focus visible en todos los elementos
[ ] Imágenes con alt text descriptivo
[ ] Formularios con labels asociados
[ ] Mensajes de error asociados al campo
[ ] Sin contenido que parpadee > 3 veces/segundo
[ ] Funcionalidad no depende solo de color
[ ] Screen reader testing (VoiceOver / TalkBack)
```
