import { test, expect, type Page, type Locator } from "@playwright/test";

// ============================================================================
// E2E del SANDBOX de Ascenso (100% en memoria, sin DB).
// URL: /dev-preview/ascenso-sandbox
// Reglas de negocio verificadas:
//   - Roster de 8 jugadores, todos rango F, 0/100 pts, 0 habilitados, sin estrellas.
//   - Solo los jugadores habilitados aparecen en los <select> de "Crear partida".
//   - Partida normal suma puntos al ganador hasta llenar el ticket (100 en F).
//   - Cola de combate ordenada por LLEGADA (FIFO), no por puntos.
//   - Combate de ascenso: el ganador sube de rango y ambos reinician el ticket.
//   - Cambio de rango manual (admin) actualiza rango y reinicia el ticket.
//
// El estado es en memoria: se reinicia al recargar la página (beforeEach).
// Los ids del roster son fijos (orden de INITIAL en la página):
//   p1=Valt p2=Shu p3=Aiger p4=Free p5=Lui p6=Dante p7=Hyuga p8=Rantaro
// ============================================================================

const URL = "/dev-preview/ascenso-sandbox";

// Fila del roster para un alias dado. Cada fila es el único `div.flex.items-center`
// que contiene el alias; adentro tiene un <select> de rango y un botón ON/OFF.
const playerRow = (page: Page, alias: string): Locator =>
  page.locator("div.flex.items-center").filter({ hasText: alias });

// Tarjeta "Crear partida" y sus dos <select> de jugador.
const matchCard = (page: Page): Locator =>
  page.locator(".omega-card").filter({ hasText: "Crear partida" });

// Habilita (toggle OFF→ON) al jugador tocando su botón de fila.
async function enable(page: Page, alias: string) {
  await playerRow(page, alias).getByRole("button").click();
}

// Selecciona a ambos jugadores en la tarjeta de partida (por id de roster).
async function pickMatch(page: Page, id1: string, id2: string) {
  const card = matchCard(page);
  await card.locator("select").nth(0).selectOption(id1);
  await card.locator("select").nth(1).selectOption(id2);
}

test.describe("Sandbox Torneo de Ascenso", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await expect(
      page.getByRole("heading", { name: /SANDBOX · Torneo de Ascenso/i })
    ).toBeVisible();
  });

  test("1. Estado inicial: 8 jugadores rango F, 0/100 pts, 0 habilitados, sin estrellas", async ({
    page,
  }) => {
    // Header del roster: 0 de 8 habilitados.
    await expect(page.getByText("Jugadores (0/8 habilitados)")).toBeVisible();

    // Los 8 jugadores del roster están presentes.
    for (const alias of ["Valt", "Shu", "Aiger", "Free", "Lui", "Dante", "Hyuga", "Rantaro"]) {
      await expect(playerRow(page, alias)).toBeVisible();
    }

    // Todos rango F (el <select> de rango refleja p.rank) y ticket 0/100.
    await expect(playerRow(page, "Valt").locator("select")).toHaveValue("F");
    await expect(playerRow(page, "Rantaro").locator("select")).toHaveValue("F");
    // 8 filas mostrando "0/100 pts" (F.ticketTarget = 100).
    await expect(page.getByText("0/100 pts", { exact: false })).toHaveCount(8);

    // Sin estrellas como dato: las filas de jugador no exponen puntaje de estrellas
    // (Copa Omega Star terminó). El único stat visible es W-L y el ticket de puntos.
    // Nota: la copy del subtítulo sí aclara "Sin estrellas", por eso verificamos
    // dentro del roster y no en todo el body.
    const roster = page.locator(".omega-card").filter({ hasText: "Jugadores (" });
    await expect(roster).not.toContainText(/estrella/i);
    await expect(roster).not.toContainText("⭐");

    // Sin cola de combate todavía.
    await expect(page.getByText("Colas de combate (orden de llegada)")).toHaveCount(0);
  });

  test("2. Habilitar jugadores: solo los ON aparecen en los selects de partida", async ({
    page,
  }) => {
    await enable(page, "Valt");
    await enable(page, "Shu");

    await expect(page.getByText("Jugadores (2/8 habilitados)")).toBeVisible();

    const sel1 = matchCard(page).locator("select").nth(0);
    // Valt y Shu (habilitados) aparecen como opción.
    await expect(sel1.getByRole("option", { name: /Valt/ })).toHaveCount(1);
    await expect(sel1.getByRole("option", { name: /Shu/ })).toHaveCount(1);
    // Aiger (NO habilitado) no aparece.
    await expect(sel1.getByRole("option", { name: /Aiger/ })).toHaveCount(0);
    await expect(sel1.getByRole("option", { name: /Free/ })).toHaveCount(0);
  });

  test("3. Sumar EXP hasta llenar el ticket: Valt 50→100/100 y entra a la cola F", async ({
    page,
  }) => {
    await enable(page, "Valt");
    await enable(page, "Shu");
    await pickMatch(page, "p1", "p2"); // Valt vs Shu

    // Puntos al ganador = 50 (default, lo fijamos explícito por robustez).
    await matchCard(page).getByRole("spinbutton").fill("50");

    // Primera victoria de Valt → 50/100.
    await page.getByRole("button", { name: "Gana Valt" }).click();
    await expect(playerRow(page, "Valt")).toContainText("50/100 pts");
    // Todavía no está en cola.
    await expect(page.getByText("Colas de combate (orden de llegada)")).toHaveCount(0);

    // Segunda victoria → 100/100, ticket LLENO.
    await page.getByRole("button", { name: "Gana Valt" }).click();
    await expect(playerRow(page, "Valt")).toContainText("100/100 pts");
    await expect(playerRow(page, "Valt")).toContainText("LLENO");

    // Valt aparece en la cola de rango F.
    const queue = page.locator(".omega-card").filter({ hasText: "Colas de combate" });
    await expect(queue).toBeVisible();
    await expect(queue).toContainText("Rango F");
    await expect(queue.locator("ol li")).toHaveText(["Valt"]);
  });

  test("4. Orden de llegada (FIFO): Valt antes que Shu en la cola F", async ({ page }) => {
    await enable(page, "Valt");
    await enable(page, "Shu");
    await enable(page, "Aiger"); // 3ro habilitado
    await pickMatch(page, "p1", "p2"); // Valt vs Shu
    await matchCard(page).getByRole("spinbutton").fill("50");

    // Valt llena PRIMERO (2 x 50 = 100).
    await page.getByRole("button", { name: "Gana Valt" }).click();
    await page.getByRole("button", { name: "Gana Valt" }).click();
    await expect(playerRow(page, "Valt")).toContainText("100/100 pts");

    // Shu llena DESPUÉS.
    await page.getByRole("button", { name: "Gana Shu" }).click();
    await page.getByRole("button", { name: "Gana Shu" }).click();
    await expect(playerRow(page, "Shu")).toContainText("100/100 pts");

    // La cola F respeta el orden de llegada: Valt (1º), Shu (2º).
    const queue = page.locator(".omega-card").filter({ hasText: "Colas de combate" });
    const items = queue.locator("ol li");
    await expect(items).toHaveText(["Valt", "Shu"]);
  });

  test("5. Combate de ascenso: Valt sube a rango E y ambos reinician el ticket", async ({
    page,
  }) => {
    await enable(page, "Valt");
    await enable(page, "Shu");
    await pickMatch(page, "p1", "p2");
    await matchCard(page).getByRole("spinbutton").fill("50");

    // Ambos llenan su ticket en F.
    await page.getByRole("button", { name: "Gana Valt" }).click();
    await page.getByRole("button", { name: "Gana Valt" }).click();
    await page.getByRole("button", { name: "Gana Shu" }).click();
    await page.getByRole("button", { name: "Gana Shu" }).click();
    await expect(playerRow(page, "Valt")).toContainText("100/100 pts");
    await expect(playerRow(page, "Shu")).toContainText("100/100 pts");

    // Cambiar a modo Combate de ascenso.
    await page.getByRole("button", { name: "Combate de ascenso" }).click();

    // Gana Valt el combate → sube a rango E.
    await page.getByRole("button", { name: "Gana Valt" }).click();

    // Valt ahora rango E (el <select> de rango lo refleja) y ticket reiniciado a 0/150.
    await expect(playerRow(page, "Valt").locator("select")).toHaveValue("E");
    await expect(playerRow(page, "Valt")).toContainText("0/150 pts");

    // Shu (perdedor) sigue en F pero con ticket reiniciado a 0/100.
    await expect(playerRow(page, "Shu").locator("select")).toHaveValue("F");
    await expect(playerRow(page, "Shu")).toContainText("0/100 pts");

    // La cola F quedó vacía (ya no hay tickets llenos en F).
    await expect(page.getByText("Colas de combate (orden de llegada)")).toHaveCount(0);
  });

  test("6. Cambio de rango manual (admin): Aiger F→C reinicia su ticket", async ({ page }) => {
    await enable(page, "Aiger");
    await enable(page, "Valt");
    await pickMatch(page, "p3", "p1"); // Aiger vs Valt
    await matchCard(page).getByRole("spinbutton").fill("50");

    // Le damos puntos a Aiger para demostrar que el cambio de rango reinicia el ticket.
    await page.getByRole("button", { name: "Gana Aiger" }).click();
    await expect(playerRow(page, "Aiger")).toContainText("50/100 pts");

    // Admin cambia el rango de Aiger de F a C mediante su <select>.
    await playerRow(page, "Aiger").locator("select").selectOption("C");

    // Rango actualizado a C y ticket reiniciado (C.ticketTarget = 300 → 0/300).
    await expect(playerRow(page, "Aiger").locator("select")).toHaveValue("C");
    await expect(playerRow(page, "Aiger")).toContainText("0/300 pts");
  });
});
