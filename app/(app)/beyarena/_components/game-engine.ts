// ═══════════════════════════════════════════════════════════════
// BeyArena — Motor de juego pixel art para batallas de beyblades
// ═══════════════════════════════════════════════════════════════

// ── Constantes del juego ──────────────────────────────────────

const PIXEL_SCALE = 3; // Factor de escala para efecto pixel art
const STADIUM_RADIUS_RATIO = 0.42; // Radio del estadio relativo al canvas
const FRICTION = 0.982; // Friccion por frame (mas deslizamiento)
const SPIN_DECAY = 0.12; // Perdida de stamina por segundo (mas rapido)
const COLLISION_BOUNCE = 1.1; // Coeficiente de rebote (mas fuerte)
const DASH_COST = 10; // Costo de stamina del X-Dash
const DASH_BOOST = 9; // Velocidad extra del dash (mas potente)
const DASH_COOLDOWN = 1.0; // Segundos entre dashes (mas seguido)
const NUDGE_FORCE = 0.5; // Fuerza de movimiento del jugador
const MAX_SPEED = 12; // Velocidad maxima (mas rapido)
const RAIL_RADIUS_RATIO = 0.28; // Radio del Xtreme Line
const RAIL_BOOST = 2.5; // Multiplicador de velocidad en el rail (MUCHO mas fuerte)
const SPARK_LIFETIME = 0.4; // Duracion de particulas en segundos
const AI_REACTION_DELAY = 0.3; // Segundos de retraso del AI

// ── Colores del tema omega ────────────────────────────────────

export const COLORS = {
  bg: "#0a0a0f",
  stadiumFloor: "#101018",
  stadiumBorder: "#3d3d5c",
  stadiumInner: "#16162b",
  rail: "#7b2ff7",
  railGlow: "#9d4edd",
  player: "#00b4d8",
  playerGlow: "#0096c7",
  opponent: "#ff4757",
  opponentGlow: "#c0392b",
  spark: "#ffd60a",
  sparkAlt: "#ff4757",
  text: "#e8e8f0",
  muted: "#8888aa",
  gold: "#ffd60a",
  green: "#2ed573",
  red: "#ff4757",
  purple: "#7b2ff7",
  blue: "#00b4d8",
  surface: "#1e1e38",
  dark: "#101018",
};

// ── Tipos ─────────────────────────────────────────────────────

export type GamePhase = "menu" | "playing" | "result";
export type GameMode = "practice" | "quick";

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  dash: boolean;
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// ── Entidad Beyblade ──────────────────────────────────────────

export class BeybladeEntity {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  spin: number; // Rotacion visual (radianes)
  spinSpeed: number; // Velocidad de rotacion visual
  stamina: number; // 0-100
  radius: number;
  color: string;
  glowColor: string;
  name: string;
  dashCooldown = 0;
  isOut = false;
  knockbackMultiplier = 1;

  constructor(
    x: number,
    y: number,
    radius: number,
    color: string,
    glowColor: string,
    name: string
  ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.glowColor = glowColor;
    this.name = name;
    this.spin = 0;
    this.spinSpeed = 12; // rad/s
    this.stamina = 100;
  }

  get speed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  get momentum(): number {
    return this.speed * (this.stamina / 100);
  }

  update(dt: number): void {
    // Movimiento
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    // Friccion
    this.vx *= FRICTION;
    this.vy *= FRICTION;

    // Limitar velocidad
    const spd = this.speed;
    if (spd > MAX_SPEED) {
      this.vx = (this.vx / spd) * MAX_SPEED;
      this.vy = (this.vy / spd) * MAX_SPEED;
    }

    // Rotacion visual (mas lenta a menor stamina)
    this.spinSpeed = 4 + (this.stamina / 100) * 14;
    this.spin += this.spinSpeed * dt;

    // Perdida de stamina
    this.stamina = Math.max(0, this.stamina - SPIN_DECAY * dt * 60);

    // Cooldown del dash
    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    }
  }

  dash(targetX: number, targetY: number): boolean {
    if (this.dashCooldown > 0 || this.stamina < DASH_COST) return false;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return false;

    this.vx += (dx / dist) * DASH_BOOST;
    this.vy += (dy / dist) * DASH_BOOST;
    this.stamina -= DASH_COST;
    this.dashCooldown = DASH_COOLDOWN;
    return true;
  }

  nudge(dirX: number, dirY: number): void {
    this.vx += dirX * NUDGE_FORCE;
    this.vy += dirY * NUDGE_FORCE;
  }
}

// ── Fisicas del estadio ───────────────────────────────────────

export class StadiumPhysics {
  centerX: number;
  centerY: number;
  radius: number;
  railRadius: number;

  constructor(centerX: number, centerY: number, radius: number) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.railRadius = radius * (RAIL_RADIUS_RATIO / STADIUM_RADIUS_RATIO);
  }

  // Mantener beyblade dentro del estadio, devuelve true si salio
  containBey(bey: BeybladeEntity): boolean {
    const dx = bey.x - this.centerX;
    const dy = bey.y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this.radius - bey.radius;

    if (dist > maxDist) {
      const speed = Math.sqrt(bey.vx * bey.vx + bey.vy * bey.vy);

      // KNOCKOUT: si pasa el borde con velocidad alta O tiene poca stamina
      if (dist > this.radius - bey.radius * 0.5 && (speed > 4 || bey.stamina < 15)) {
        bey.isOut = true;
        return true;
      }

      // Rebotar contra el borde
      const nx = dx / dist;
      const ny = dy / dist;

      // Reposicionar
      bey.x = this.centerX + nx * maxDist;
      bey.y = this.centerY + ny * maxDist;

      // Reflejar velocidad (pierde mas energia en el rebote)
      const dot = bey.vx * nx + bey.vy * ny;
      bey.vx -= 2 * dot * nx * COLLISION_BOUNCE * 0.7;
      bey.vy -= 2 * dot * ny * COLLISION_BOUNCE * 0.7;

      // Perdida extra de stamina al golpear el borde (mas fuerte)
      bey.stamina = Math.max(0, bey.stamina - 3);
    }

    // XTREME DASH: Boost masivo en el rail (como en la serie)
    const railDist = Math.abs(dist - this.railRadius);
    if (railDist < bey.radius * 2.5) {
      // Tangente al circulo
      const tangentX = -dy / (dist || 1);
      const tangentY = dx / (dist || 1);

      // Proyectar velocidad en tangente
      const tangentSpeed = bey.vx * tangentX + bey.vy * tangentY;

      if (Math.abs(tangentSpeed) > 0.3) {
        const sign = tangentSpeed > 0 ? 1 : -1;
        // Boost fuerte en el rail — se siente como el Xtreme Dash real
        bey.vx += tangentX * sign * 0.25 * RAIL_BOOST;
        bey.vy += tangentY * sign * 0.25 * RAIL_BOOST;
        // Recupera un poco de stamina al usar el rail (como en la serie)
        bey.stamina = Math.min(100, bey.stamina + 0.1);
      }
    }

    return false;
  }

  // Colision entre dos beyblades
  collideBeys(a: BeybladeEntity, b: BeybladeEntity): Spark[] {
    const sparks: Spark[] = [];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = a.radius + b.radius;

    if (dist < minDist && dist > 0) {
      // Normal de colision
      const nx = dx / dist;
      const ny = dy / dist;

      // Separar
      const overlap = minDist - dist;
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      // Velocidades relativas
      const dvx = a.vx - b.vx;
      const dvy = a.vy - b.vy;
      const dvn = dvx * nx + dvy * ny;

      if (dvn > 0) {
        // Impulso basado en momentum
        const momentumA = a.momentum;
        const momentumB = b.momentum;
        const totalMomentum = momentumA + momentumB || 1;
        const ratioA = momentumB / totalMomentum;
        const ratioB = momentumA / totalMomentum;

        const impulse = dvn * COLLISION_BOUNCE;

        a.vx -= impulse * nx * ratioA * a.knockbackMultiplier;
        a.vy -= impulse * ny * ratioA * a.knockbackMultiplier;
        b.vx += impulse * nx * ratioB * b.knockbackMultiplier;
        b.vy += impulse * ny * ratioB * b.knockbackMultiplier;

        // Perdida de stamina proporcional al impacto
        const impactForce = Math.abs(dvn) * 0.8;
        a.stamina = Math.max(0, a.stamina - impactForce * ratioA);
        b.stamina = Math.max(0, b.stamina - impactForce * ratioB);

        // Generar chispas pixel
        const hitX = (a.x + b.x) / 2;
        const hitY = (a.y + b.y) / 2;
        const sparkCount = Math.min(12, Math.floor(Math.abs(dvn) * 3) + 3);

        for (let i = 0; i < sparkCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 4;
          sparks.push({
            x: hitX + (Math.random() - 0.5) * 6,
            y: hitY + (Math.random() - 0.5) * 6,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: SPARK_LIFETIME,
            maxLife: SPARK_LIFETIME,
            color: Math.random() > 0.5 ? COLORS.spark : COLORS.sparkAlt,
            size: 2 + Math.random() * 3,
          });
        }
      }
    }

    return sparks;
  }
}

// ── Controlador AI ────────────────────────────────────────────

export class AIController {
  reactionTimer = 0;
  targetX = 0;
  targetY = 0;
  dashTimer = 0;
  difficulty: number; // 0 = facil, 1 = dificil

  constructor(difficulty = 0.5) {
    this.difficulty = difficulty;
  }

  update(
    dt: number,
    self: BeybladeEntity,
    opponent: BeybladeEntity,
    stadium: StadiumPhysics
  ): void {
    this.reactionTimer -= dt;
    this.dashTimer -= dt;

    if (this.reactionTimer <= 0) {
      this.reactionTimer = AI_REACTION_DELAY * (1.5 - this.difficulty);

      // Estrategia basica: perseguir al oponente si tiene mas stamina,
      // escapar si tiene menos
      const staminaAdvantage = self.stamina - opponent.stamina;

      if (staminaAdvantage > 10 || self.stamina > 60) {
        // Modo agresivo: ir hacia el oponente
        this.targetX = opponent.x;
        this.targetY = opponent.y;
      } else {
        // Modo defensivo: alejarse, orbitar el centro
        const angle = Math.atan2(
          self.y - stadium.centerY,
          self.x - stadium.centerX
        );
        const orbitAngle = angle + Math.PI * 0.3;
        this.targetX =
          stadium.centerX + Math.cos(orbitAngle) * stadium.railRadius;
        this.targetY =
          stadium.centerY + Math.sin(orbitAngle) * stadium.railRadius;
      }

      // Añadir algo de aleatoriedad
      this.targetX += (Math.random() - 0.5) * 30 * (1 - this.difficulty);
      this.targetY += (Math.random() - 0.5) * 30 * (1 - this.difficulty);
    }

    // Moverse hacia el objetivo
    const dx = this.targetX - self.x;
    const dy = this.targetY - self.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const force = NUDGE_FORCE * (0.5 + this.difficulty * 0.5);
      self.vx += (dx / dist) * force;
      self.vy += (dy / dist) * force;
    }

    // Dash agresivo cuando esta cerca del oponente
    if (
      this.dashTimer <= 0 &&
      self.stamina > 40 &&
      this.difficulty > 0.3
    ) {
      const distToOpponent = Math.sqrt(
        (self.x - opponent.x) ** 2 + (self.y - opponent.y) ** 2
      );
      if (
        distToOpponent < stadium.radius * 0.5 &&
        Math.random() < this.difficulty * 0.3
      ) {
        self.dash(opponent.x, opponent.y);
        this.dashTimer = 2;
      }
    }
  }
}

// ── Renderer Pixel Art ────────────────────────────────────────

export class PixelRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;
  private lowResW: number;
  private lowResH: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    // Buffer de baja resolucion para efecto pixelado
    this.lowResW = Math.floor(width / PIXEL_SCALE);
    this.lowResH = Math.floor(height / PIXEL_SCALE);
    this.offscreen = document.createElement("canvas");
    this.offscreen.width = this.lowResW;
    this.offscreen.height = this.lowResH;
    this.offCtx = this.offscreen.getContext("2d")!;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.lowResW = Math.floor(width / PIXEL_SCALE);
    this.lowResH = Math.floor(height / PIXEL_SCALE);
    this.offscreen.width = this.lowResW;
    this.offscreen.height = this.lowResH;
  }

  clear(): void {
    this.offCtx.fillStyle = COLORS.bg;
    this.offCtx.fillRect(0, 0, this.lowResW, this.lowResH);
  }

  // Coordenada real a coordenada pixelada
  private px(v: number): number {
    return Math.floor(v / PIXEL_SCALE);
  }

  drawStadium(stadium: StadiumPhysics, time: number): void {
    const cx = this.px(stadium.centerX);
    const cy = this.px(stadium.centerY);
    const r = this.px(stadium.radius);
    const railR = this.px(stadium.railRadius);
    const ctx = this.offCtx;

    // Fondo del estadio
    ctx.fillStyle = COLORS.stadiumInner;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Borde del estadio
    ctx.strokeStyle = COLORS.stadiumBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Xtreme Line (rail) con brillo animado
    const glowPhase = Math.sin(time * 3) * 0.3 + 0.7;
    ctx.globalAlpha = glowPhase;
    ctx.strokeStyle = COLORS.railGlow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, railR, 0, Math.PI * 2);
    ctx.stroke();

    // Puntos luminosos que orbitan el rail
    const dotCount = 6;
    for (let i = 0; i < dotCount; i++) {
      const angle = (Math.PI * 2 * i) / dotCount + time * 1.5;
      const dotX = cx + Math.cos(angle) * railR;
      const dotY = cy + Math.sin(angle) * railR;
      ctx.fillStyle = COLORS.rail;
      ctx.fillRect(Math.floor(dotX) - 1, Math.floor(dotY) - 1, 2, 2);
    }

    ctx.globalAlpha = 1;

    // Cruz central
    ctx.fillStyle = COLORS.stadiumBorder;
    ctx.fillRect(cx - 1, cy - 4, 2, 8);
    ctx.fillRect(cx - 4, cy - 1, 8, 2);
  }

  drawBeyblade(bey: BeybladeEntity, time: number): void {
    if (bey.isOut) return;

    const cx = this.px(bey.x);
    const cy = this.px(bey.y);
    const r = this.px(bey.radius);
    const ctx = this.offCtx;

    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(cx + 1, cy + 1, r, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo principal
    ctx.fillStyle = bey.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Anillo interior
    ctx.fillStyle = bey.glowColor;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, r - 2), 0, Math.PI * 2);
    ctx.fill();

    // Centro
    ctx.fillStyle = COLORS.text;
    ctx.fillRect(cx - 1, cy - 1, 2, 2);

    // Lineas de rotacion (aspas) — 3 aspas
    const bladeCount = 3;
    for (let i = 0; i < bladeCount; i++) {
      const angle = bey.spin + (Math.PI * 2 * i) / bladeCount;
      const tipX = cx + Math.cos(angle) * (r - 1);
      const tipY = cy + Math.sin(angle) * (r - 1);

      ctx.fillStyle = COLORS.text;
      ctx.fillRect(Math.floor(tipX), Math.floor(tipY), 2, 2);

      // Linea del aspa
      const midX = cx + Math.cos(angle) * (r * 0.5);
      const midY = cy + Math.sin(angle) * (r * 0.5);
      ctx.fillStyle = bey.glowColor;
      ctx.fillRect(Math.floor(midX), Math.floor(midY), 1, 1);
    }

    // Efecto de giro rapido — trail circular
    if (bey.stamina > 50) {
      const trailAlpha = (bey.stamina - 50) / 150;
      ctx.globalAlpha = trailAlpha;
      ctx.strokeStyle = bey.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Indicador de dash listo (brillo)
    if (bey.dashCooldown <= 0 && bey.stamina >= DASH_COST) {
      const pulse = Math.sin(time * 8) * 0.3 + 0.4;
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawSparks(sparks: Spark[]): void {
    const ctx = this.offCtx;
    for (const spark of sparks) {
      const alpha = spark.life / spark.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = spark.color;
      const size = Math.max(1, Math.floor(this.px(spark.size)));
      ctx.fillRect(
        this.px(spark.x) - Math.floor(size / 2),
        this.px(spark.y) - Math.floor(size / 2),
        size,
        size
      );
    }
    ctx.globalAlpha = 1;
  }

  drawStaminaBars(player: BeybladeEntity, opponent: BeybladeEntity): void {
    const ctx = this.offCtx;
    const barW = Math.floor(this.lowResW * 0.35);
    const barH = 4;
    const margin = 6;
    const topY = margin;

    // Barra del jugador (izquierda)
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(margin, topY, barW, barH);
    ctx.fillStyle = player.stamina > 25 ? COLORS.blue : COLORS.red;
    ctx.fillRect(margin, topY, Math.floor(barW * (player.stamina / 100)), barH);
    ctx.fillStyle = COLORS.text;

    // Nombre del jugador
    // (texto pixelado se dibuja en la resolucion baja)

    // Barra del oponente (derecha)
    const rightX = this.lowResW - margin - barW;
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(rightX, topY, barW, barH);
    ctx.fillStyle = opponent.stamina > 25 ? COLORS.red : COLORS.muted;
    ctx.fillRect(
      rightX + barW - Math.floor(barW * (opponent.stamina / 100)),
      topY,
      Math.floor(barW * (opponent.stamina / 100)),
      barH
    );

    // Labels "SPIN" arriba de cada barra
    ctx.fillStyle = COLORS.muted;
    // Usamos rectangulos pixelados para simular texto
    // S
    this.drawPixelChar(margin, topY - 5, "S");
    // %
    const pct = Math.floor(player.stamina);
    this.drawPixelNumber(margin + barW - 12, topY - 5, pct);

    // Oponente
    const opPct = Math.floor(opponent.stamina);
    this.drawPixelNumber(rightX + barW - 12, topY - 5, opPct);
  }

  // Dibujar numeros pixel art 3x5
  drawPixelNumber(x: number, y: number, num: number): void {
    const ctx = this.offCtx;
    ctx.fillStyle = COLORS.text;
    const s = Math.max(0, Math.min(999, num)).toString();
    let offsetX = x;

    for (const ch of s) {
      const glyph = PIXEL_DIGITS[ch as keyof typeof PIXEL_DIGITS];
      if (glyph) {
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 3; col++) {
            if (glyph[row * 3 + col]) {
              ctx.fillRect(offsetX + col, y + row, 1, 1);
            }
          }
        }
      }
      offsetX += 4;
    }
  }

  drawPixelChar(x: number, y: number, ch: string): void {
    const ctx = this.offCtx;
    ctx.fillStyle = COLORS.muted;
    const glyph =
      PIXEL_CHARS[ch as keyof typeof PIXEL_CHARS];
    if (!glyph) return;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (glyph[row * 3 + col]) {
          ctx.fillRect(x + col, y + row, 1, 1);
        }
      }
    }
  }

  drawCountdown(count: number): void {
    const ctx = this.offCtx;
    const cx = Math.floor(this.lowResW / 2);
    const cy = Math.floor(this.lowResH / 2);

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, this.lowResW, this.lowResH);

    // Numero grande pixelado
    ctx.fillStyle = COLORS.gold;
    const text = count > 0 ? count.toString() : "GO!";

    if (count > 0) {
      // Dibujar digito grande (escalado x3)
      const glyph = PIXEL_DIGITS[text as keyof typeof PIXEL_DIGITS];
      if (glyph) {
        const scale = 4;
        const startX = cx - Math.floor((3 * scale) / 2);
        const startY = cy - Math.floor((5 * scale) / 2);
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 3; col++) {
            if (glyph[row * 3 + col]) {
              ctx.fillRect(
                startX + col * scale,
                startY + row * scale,
                scale,
                scale
              );
            }
          }
        }
      }
    } else {
      // "GO!" — dibujado como rectangulos
      ctx.fillStyle = COLORS.green;
      const scale = 3;
      const goGlyphs = [
        PIXEL_CHARS["G"],
        PIXEL_CHARS["O"],
        PIXEL_CHARS["!"],
      ];
      const startX = cx - Math.floor((3 * 3 * scale + 2 * scale) / 2);
      const startY = cy - Math.floor((5 * scale) / 2);

      goGlyphs.forEach((glyph, gi) => {
        if (!glyph) return;
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 3; col++) {
            if (glyph[row * 3 + col]) {
              ctx.fillRect(
                startX + gi * 4 * scale + col * scale,
                startY + row * scale,
                scale,
                scale
              );
            }
          }
        }
      });
    }
  }

  drawDashIndicator(player: BeybladeEntity): void {
    const ctx = this.offCtx;
    const x = 6;
    const y = this.lowResH - 10;

    // Label "DASH"
    ctx.fillStyle =
      player.dashCooldown <= 0 && player.stamina >= DASH_COST
        ? COLORS.gold
        : COLORS.muted;

    const label = ["D", "A", "S", "H"];
    label.forEach((ch, i) => {
      this.drawPixelChar(x + i * 4, y, ch);
    });

    // Barra de cooldown
    const barX = x + 18;
    const barW = 20;
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(barX, y + 1, barW, 3);

    if (player.dashCooldown > 0) {
      ctx.fillStyle = COLORS.muted;
      const fill = Math.floor(
        barW * (1 - player.dashCooldown / DASH_COOLDOWN)
      );
      ctx.fillRect(barX, y + 1, fill, 3);
    } else if (player.stamina >= DASH_COST) {
      ctx.fillStyle = COLORS.gold;
      ctx.fillRect(barX, y + 1, barW, 3);
    }
  }

  // Renderizar buffer a canvas principal con escalado pixelado
  flush(): void {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.offscreen, 0, 0, this.width, this.height);
  }
}

// ── Motor principal del juego ─────────────────────────────────

export interface GameResult {
  winner: "player" | "opponent" | "draw";
  reason: "knockout" | "stamina" | "timeout";
  playerStamina: number;
  opponentStamina: number;
}

export class BeyArenaGame {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  renderer: PixelRenderer;

  player: BeybladeEntity;
  opponent: BeybladeEntity;
  stadium: StadiumPhysics;
  ai: AIController;

  sparks: Spark[] = [];
  phase: GamePhase = "menu";
  mode: GameMode = "practice";
  input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    dash: false,
  };

  // Touch control state
  touchDirX = 0;
  touchDirY = 0;
  touchActive = false;
  touchDash = false;

  countdown = 3;
  countdownTimer = 0;
  gameTime = 0;
  maxGameTime = 60; // 60 segundos max
  time = 0;
  lastTime = 0;
  animFrame = 0;
  result: GameResult | null = null;

  private onPhaseChange: ((phase: GamePhase) => void) | null = null;
  private onResultChange: ((result: GameResult | null) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    const size = Math.min(canvas.width, canvas.height);
    const stadiumR = size * STADIUM_RADIUS_RATIO;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    this.stadium = new StadiumPhysics(cx, cy, stadiumR);

    const beyR = stadiumR * 0.1;
    this.player = new BeybladeEntity(
      cx - stadiumR * 0.5,
      cy,
      beyR,
      COLORS.player,
      COLORS.playerGlow,
      "TU"
    );
    this.opponent = new BeybladeEntity(
      cx + stadiumR * 0.5,
      cy,
      beyR,
      COLORS.opponent,
      COLORS.opponentGlow,
      "CPU"
    );

    this.ai = new AIController(0.5);
    this.renderer = new PixelRenderer(this.ctx, canvas.width, canvas.height);
  }

  setCallbacks(
    onPhase: (phase: GamePhase) => void,
    onResult: (result: GameResult | null) => void
  ): void {
    this.onPhaseChange = onPhase;
    this.onResultChange = onResult;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;

    const size = Math.min(width, height);
    const stadiumR = size * STADIUM_RADIUS_RATIO;
    const cx = width / 2;
    const cy = height / 2;

    this.stadium = new StadiumPhysics(cx, cy, stadiumR);
    this.renderer.resize(width, height);

    // Reposicionar beyblades si estamos en menu
    if (this.phase === "menu") {
      const beyR = stadiumR * 0.1;
      this.player.radius = beyR;
      this.opponent.radius = beyR;
      this.player.x = cx - stadiumR * 0.5;
      this.player.y = cy;
      this.opponent.x = cx + stadiumR * 0.5;
      this.opponent.y = cy;
    }
  }

  startGame(mode: GameMode): void {
    this.mode = mode;
    this.phase = "playing";
    this.countdown = 3;
    this.countdownTimer = 0;
    this.gameTime = 0;
    this.time = 0;
    this.result = null;
    this.sparks = [];

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const stadiumR = this.stadium.radius;
    const beyR = stadiumR * 0.1;

    this.player = new BeybladeEntity(
      cx - stadiumR * 0.5,
      cy,
      beyR,
      COLORS.player,
      COLORS.playerGlow,
      "TU"
    );
    this.opponent = new BeybladeEntity(
      cx + stadiumR * 0.5,
      cy,
      beyR,
      COLORS.opponent,
      COLORS.opponentGlow,
      "CPU"
    );

    this.ai = new AIController(0.5);
    this.onPhaseChange?.("playing");
    this.onResultChange?.(null);
  }

  endGame(reason: "knockout" | "stamina" | "timeout"): void {
    let winner: "player" | "opponent" | "draw";

    if (this.player.isOut && !this.opponent.isOut) {
      winner = "opponent";
    } else if (this.opponent.isOut && !this.player.isOut) {
      winner = "player";
    } else if (this.player.isOut && this.opponent.isOut) {
      // Ambos salieron — gana el que tenia mas stamina
      winner = this.player.stamina >= this.opponent.stamina ? "player" : "opponent";
    } else if (Math.abs(this.player.stamina - this.opponent.stamina) < 0.5) {
      // Casi igual — gana el que tiene mas velocidad (momentum)
      winner = this.player.momentum >= this.opponent.momentum ? "player" : "opponent";
    } else if (this.player.stamina > this.opponent.stamina) {
      winner = "player";
    } else {
      winner = "opponent";
    }

    this.result = {
      winner,
      reason,
      playerStamina: this.player.stamina,
      opponentStamina: this.opponent.stamina,
    };

    this.phase = "result";
    this.onPhaseChange?.("result");
    this.onResultChange?.(this.result);
  }

  returnToMenu(): void {
    this.phase = "menu";
    this.result = null;
    this.onPhaseChange?.("menu");
    this.onResultChange?.(null);
  }

  // ── Game Loop ───────────────────────────────────────────────

  tick(timestamp: number): void {
    if (this.lastTime === 0) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // Clamp delta
    this.lastTime = timestamp;
    this.time += dt;

    this.update(dt);
    this.render();

    this.animFrame = requestAnimationFrame((t) => this.tick(t));
  }

  start(): void {
    this.lastTime = 0;
    this.animFrame = requestAnimationFrame((t) => this.tick(t));
  }

  stop(): void {
    cancelAnimationFrame(this.animFrame);
  }

  private update(dt: number): void {
    if (this.phase === "menu") {
      // Animacion idle: beyblades giran en su lugar
      this.player.spin += 8 * dt;
      this.opponent.spin += 8 * dt;
      return;
    }

    if (this.phase === "result") {
      // Los beyblades se frenan
      this.player.vx *= 0.95;
      this.player.vy *= 0.95;
      this.opponent.vx *= 0.95;
      this.opponent.vy *= 0.95;
      this.player.spin += 2 * dt;
      this.opponent.spin += 2 * dt;
      this.updateSparks(dt);
      return;
    }

    // ── Countdown ──
    if (this.countdown > 0) {
      this.countdownTimer += dt;
      if (this.countdownTimer >= 1) {
        this.countdownTimer = 0;
        this.countdown--;
      }
      // Beyblades giran pero no se mueven
      this.player.spin += 10 * dt;
      this.opponent.spin += 10 * dt;
      return;
    }

    // ── Tiempo de juego ──
    this.gameTime += dt;
    if (this.gameTime >= this.maxGameTime) {
      this.endGame("timeout");
      return;
    }

    // ── Input del jugador ──
    let dirX = 0;
    let dirY = 0;

    if (this.touchActive) {
      dirX = this.touchDirX;
      dirY = this.touchDirY;
    } else {
      if (this.input.left) dirX -= 1;
      if (this.input.right) dirX += 1;
      if (this.input.up) dirY -= 1;
      if (this.input.down) dirY += 1;
    }

    // Normalizar diagonal
    if (dirX !== 0 && dirY !== 0) {
      const len = Math.sqrt(dirX * dirX + dirY * dirY);
      dirX /= len;
      dirY /= len;
    }

    this.player.nudge(dirX, dirY);

    // X-Dash
    if (this.input.dash || this.touchDash) {
      this.player.dash(this.stadium.centerX, this.stadium.centerY);
      this.touchDash = false;
    }

    // ── AI ──
    this.ai.update(dt, this.opponent, this.player, this.stadium);

    // ── Actualizar entidades ──
    this.player.update(dt);
    this.opponent.update(dt);

    // ── Fisicas ──
    const playerOut = this.stadium.containBey(this.player);
    const opponentOut = this.stadium.containBey(this.opponent);

    // Colision entre beyblades
    const newSparks = this.stadium.collideBeys(this.player, this.opponent);
    this.sparks.push(...newSparks);

    // ── Actualizar particulas ──
    this.updateSparks(dt);

    // ── Condiciones de victoria ──
    if (playerOut || opponentOut) {
      this.endGame("knockout");
      return;
    }

    if (this.player.stamina <= 0 && this.opponent.stamina <= 0) {
      this.endGame("stamina");
      return;
    }

    if (this.player.stamina <= 0 && this.player.speed < 0.3) {
      this.endGame("stamina");
      return;
    }

    if (this.opponent.stamina <= 0 && this.opponent.speed < 0.3) {
      this.endGame("stamina");
      return;
    }
  }

  private updateSparks(dt: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt * 60;
      s.y += s.vy * dt * 60;
      s.vx *= 0.95;
      s.vy *= 0.95;
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawStadium(this.stadium, this.time);
    this.renderer.drawSparks(this.sparks);
    this.renderer.drawBeyblade(this.player, this.time);
    this.renderer.drawBeyblade(this.opponent, this.time);
    this.renderer.drawStaminaBars(this.player, this.opponent);

    if (this.phase === "playing" && this.countdown <= 0) {
      this.renderer.drawDashIndicator(this.player);
    }

    if (this.phase === "playing" && this.countdown > 0) {
      this.renderer.drawCountdown(this.countdown);
    } else if (this.phase === "playing" && this.countdown <= 0 && this.gameTime < 0.5) {
      this.renderer.drawCountdown(0); // "GO!"
    }

    this.renderer.flush();
  }

  // ── Input handlers ──────────────────────────────────────────

  handleKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        this.input.up = true;
        e.preventDefault();
        break;
      case "ArrowDown":
      case "KeyS":
        this.input.down = true;
        e.preventDefault();
        break;
      case "ArrowLeft":
      case "KeyA":
        this.input.left = true;
        e.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        this.input.right = true;
        e.preventDefault();
        break;
      case "Space":
        this.input.dash = true;
        e.preventDefault();
        break;
    }
  }

  handleKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        this.input.up = false;
        break;
      case "ArrowDown":
      case "KeyS":
        this.input.down = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.input.left = false;
        break;
      case "ArrowRight":
      case "KeyD":
        this.input.right = false;
        break;
      case "Space":
        this.input.dash = false;
        break;
    }
  }

  handleTouchStart(x: number, y: number, canvasRect: DOMRect): void {
    this.touchActive = true;
    this.updateTouchDirection(x, y, canvasRect);
  }

  handleTouchMove(x: number, y: number, canvasRect: DOMRect): void {
    if (this.touchActive) {
      this.updateTouchDirection(x, y, canvasRect);
    }
  }

  handleTouchEnd(): void {
    this.touchActive = false;
    this.touchDirX = 0;
    this.touchDirY = 0;
  }

  private updateTouchDirection(
    x: number,
    y: number,
    canvasRect: DOMRect
  ): void {
    // Zona del d-pad (cuadrante inferior izquierdo)
    const dpadCenterX = canvasRect.width * 0.2;
    const dpadCenterY = canvasRect.height * 0.75;

    const touchX = x - canvasRect.left;
    const touchY = y - canvasRect.top;

    // Si toca la zona del dash (cuadrante inferior derecho)
    if (touchX > canvasRect.width * 0.65 && touchY > canvasRect.height * 0.6) {
      this.touchDash = true;
      return;
    }

    const dx = touchX - dpadCenterX;
    const dy = touchY - dpadCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = canvasRect.width * 0.15;

    if (dist > 5) {
      this.touchDirX = Math.max(-1, Math.min(1, dx / maxDist));
      this.touchDirY = Math.max(-1, Math.min(1, dy / maxDist));
    } else {
      this.touchDirX = 0;
      this.touchDirY = 0;
    }
  }
}

// ── Pixel Font Data ───────────────────────────────────────────
// Cada glyph es un array de 15 booleanos (3x5 grid)

const PIXEL_DIGITS: Record<string, number[]> = {
  "0": [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1],
  "1": [0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1],
  "2": [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
  "3": [1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
  "4": [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1],
  "5": [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1],
  "6": [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1],
  "7": [1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  "8": [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
  "9": [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
};

const PIXEL_CHARS: Record<string, number[]> = {
  S: [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1],
  P: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0],
  I: [1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1],
  N: [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  D: [1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0],
  A: [0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  H: [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  G: [1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1],
  O: [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1],
  "!": [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  V: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0],
  W: [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  T: [1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  U: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1],
  E: [1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1],
  R: [1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  C: [1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1],
  K: [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1],
  L: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1],
  X: [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
  Y: [1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  B: [1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0],
  F: [1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0],
  M: [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  J: [0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1],
  Q: [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1],
  Z: [1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1],
};
