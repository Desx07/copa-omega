import { test, expect, type Page, type Locator } from "@playwright/test";

// ============================================================================
// E2E del SANDBOX de Ascenso (100% en memoria, sin DB).
// URL: /dev-preview/ascenso-sandbox
// Progresión estilo Pokémon Z-A (por peleas):
//   - Cada victoria da 10 pts fijos (POINTS_PER_WIN). El perdedor no suma.
//   - Subir de rango: F 30 peleas (300 pts) · E 40 (400) · D 50 (500) ·
//     C 60 (600) · B 70 (700) · A 80 (800). S = rango máximo.
//   - Cola de combate por LLEGADA (FIFO), no por puntos.
//   - Combate de ascenso: ganador sube y ambos reinician el ticket.
//   - Cambio de rango manual (admin) reinicia el ticket.
// Estado en memoria: se reinicia al recargar (beforeEach).
// ids del roster: p1=Valt p2=Shu p3=Aiger p4=Free p5=Lui p6=Dante p7=Hyuga p8=Rantaro
// ============================================================================

const URL = "/dev-preview/ascenso-sandbox";
const POINTS_PER_WIN = 10;
const F_TARGET = 300; // 30 peleas
const WINS_TO_FILL_F = F_TARGET / POINTS_PER_WIN; // 30

const playerRow = (page: Page, alias: string): Locator =>
  page.locator("div.flex.items-center").filter({ hasText: alias });

const matchCard = (page: Page): Locator =>
  page.locator(".omega-card").filter({ hasText: "Crear partida" });

async function enable(page: Page, alias: string) {
  await playerRow(page, alias).getByRole("button").click();
}

async function pickMatch(page: Page, id1: string, id2: string) {
  const card = matchCard(page);
  await card.locator("select").nth(0).selectOption(id1);
  await card.locator("select").nth(1).selectOption(id2);
}

// Gana `n` peleas seguidas el jugador `alias` (cada una suma 10 pts a su ticket).
async function winTimes(page: Page, alias: string, n: number) {
  const btn = page.getByRole("button", { name: `Gana ${alias}` });
  for (let i = 0; i < n; i++) await btn.click();
}

test.describe("Sandbox Torneo de Ascenso", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await expect(
      page.getByRole("heading", { name: /SANDBOX · Torneo de Ascenso/i })
    ).toBeVisible();
  });

  test("1. Estado inicial: 8 jugadores rango F, 0/300 pts, 0 habilitados, sin estrellas", async ({
    page,
  }) => {
    await expect(page.getByText("Jugadores (0/8 habilitados)")).toBeVisible();

    for (const alias of ["Valt", "Shu", "Aiger", "Free", "Lui", "Dante", "Hyuga", "Rantaro"]) {
      await expect(playerRow(page, alias)).toBeVisible();
    }

    // Todos rango F y ticket 0/300 (F = 30 peleas × 10 pts).
    await expect(playerRow(page, "Valt").locator("select")).toHaveValue("F");
    await expect(playerRow(page, "Rantaro").locator("select")).toHaveValue("F");
    await expect(page.getByText("0/300 pts", { exact: false })).toHaveCount(8);

    // Sin estrellas como stat en el roster (Copa Omega Star terminó).
    const roster = page.locator(".omega-card").filter({ hasText: "Jugadores (" });
    await expect(roster).not.toContainText(/estrella/i);
    await expect(roster).not.toContainText("⭐");

    await expect(page.getByText("Colas de combate (orden de llegada)")).toHaveCount(0);
  });

  test("2. Habilitar jugadores: solo los ON aparecen en los selects de partida", async ({
    page,
  }) => {
    await enable(page, "Valt");
    await enable(page, "Shu");

    await expect(page.getByText("Jugadores (2/8 habilitados)")).toBeVisible();

    const sel1 = matchCard(page).locator("select").nth(0);
    await expect(sel1.getByRole("option", { name: /Valt/ })).toHaveCount(1);
    await expect(sel1.getByRole("option", { name: /Shu/ })).toHaveCount(1);
    await expect(sel1.getByRole("option", { name: /Aiger/ })).toHaveCount(0);
    await expect(sel1.getByRole("option", { name: /Free/ })).toHaveCount(0);
  });

  test("3. Sumar EXP: cada victoria da 10 pts; 30 peleas llenan el ticket F y entra a la cola", async ({
    page,
  }) => {
    await enable(page, "Valt");
    await enable(page, "Shu");
    await pickMatch(page, "p1", "p2"); // Valt vs Shu

    // Una victoria = 10 pts.
    await winTimes(page, "Valt", 1);
    await expect(playerRow(page, "Valt")).toContainText(`${POINTS_PER_WIN}/300 pts`);
    await expect(page.getByText("Colas de combate (orden de llegada)")).toHaveCount(0);

    // Completar las 30 peleas (faltan 29) → 300/300, ticket LLENO.
    await winTimes(page, "Valt", WINS_TO_FILL_F - 1);
    await expect(playerRow(page, "Valt")).toContainText("300/300 pts");
    await expect(playerRow(page, "Valt")).toContainText("LLENO");

    const queue = page.locator(".omega-card").filter({ hasText: "Colas de combate" });
    await expect(queue).toBeVisible();
    await expect(queue).toContainText("Rango F");
    await expect(queue.locator("ol li")).toHaveText(["Valt"]);
  });

  test("4. Orden de llegada (FIFO): Valt antes que Shu en la cola F", async ({ page }) => {
    await enable(page, "Valt");
    await enable(page, "Shu");
    await enable(page, "Aiger");
    await pickMatch(page, "p1", "p2");

    // Valt llena PRIMERO (30 peleas).
    await winTimes(page, "Valt", WINS_TO_FILL_F);
    await expect(playerRow(page, "Valt")).toContainText("300/300 pts");

    // Shu llena DESPUÉS.
    await winTimes(page, "Shu", WINS_TO_FILL_F);
    await expect(playerRow(page, "Shu")).toContainText("300/300 pts");

    // Cola F por orden de llegada: Valt (1º), Shu (2º).
    const queue = page.locator(".omega-card").filter({ hasText: "Colas de combate" });
    await expect(queue.locator("ol li")).toHaveText(["Valt", "Shu"]);
  });

  test("5. Combate de ascenso: Valt sube a rango E y ambos reinician el ticket", async ({
    page,
  }) => {
    await enable(page, "Valt");
    await enable(page, "Shu");
    await pickMatch(page, "p1", "p2");

    // Ambos llenan su ticket en F.
    await winTimes(page, "Valt", WINS_TO_FILL_F);
    await winTimes(page, "Shu", WINS_TO_FILL_F);
    await expect(playerRow(page, "Valt")).toContainText("300/300 pts");
    await expect(playerRow(page, "Shu")).toContainText("300/300 pts");

    // Modo combate de ascenso.
    await page.getByRole("button", { name: "Combate de ascenso" }).click();
    await page.getByRole("button", { name: "Gana Valt" }).click();

    // Valt sube a E, ticket reiniciado a 0/400 (E = 40 peleas).
    await expect(playerRow(page, "Valt").locator("select")).toHaveValue("E");
    await expect(playerRow(page, "Valt")).toContainText("0/400 pts");

    // Shu (perdedor) sigue en F con ticket reiniciado a 0/300.
    await expect(playerRow(page, "Shu").locator("select")).toHaveValue("F");
    await expect(playerRow(page, "Shu")).toContainText("0/300 pts");

    await expect(page.getByText("Colas de combate (orden de llegada)")).toHaveCount(0);
  });

  test("6. Cambio de rango manual (admin): Aiger F→C reinicia su ticket", async ({ page }) => {
    await enable(page, "Aiger");
    await enable(page, "Valt");
    await pickMatch(page, "p3", "p1"); // Aiger vs Valt

    // Aiger gana una pelea (10 pts) para demostrar el reinicio al cambiar rango.
    await winTimes(page, "Aiger", 1);
    await expect(playerRow(page, "Aiger")).toContainText(`${POINTS_PER_WIN}/300 pts`);

    // Admin cambia el rango de Aiger de F a C.
    await playerRow(page, "Aiger").locator("select").selectOption("C");

    // Rango C y ticket reiniciado (C = 60 peleas → 0/600).
    await expect(playerRow(page, "Aiger").locator("select")).toHaveValue("C");
    await expect(playerRow(page, "Aiger")).toContainText("0/600 pts");
  });
});
