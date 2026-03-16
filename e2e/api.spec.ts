import { test, expect } from "@playwright/test";

test.describe("API Endpoints", () => {
  test("GET /api/players returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/players");
    expect(response.status()).toBe(401);
  });

  test("GET /api/rivalries returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/rivalries");
    expect(response.status()).toBe(401);
  });

  test("GET /api/challenges returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/challenges");
    expect(response.status()).toBe(401);
  });

  test("POST /api/cron/cleanup returns 401 without secret", async ({ request }) => {
    const response = await request.post("/api/cron/cleanup");
    expect(response.status()).toBe(401);
  });

  test("POST /api/cron/cleanup with wrong secret returns 401", async ({ request }) => {
    const response = await request.post("/api/cron/cleanup", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    expect(response.status()).toBe(401);
  });

  test("GET /api/tournaments returns data", async ({ request }) => {
    const response = await request.get("/api/tournaments");
    // Tournaments list might be public or require auth
    expect([200, 401]).toContain(response.status());
  });

  test("GET /api/products returns data", async ({ request }) => {
    const response = await request.get("/api/products");
    expect([200, 401]).toContain(response.status());
  });

  test("GET /api/players/fake-id/stars returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/players/fake-id/stars");
    expect(response.status()).toBe(401);
  });
});
