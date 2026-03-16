import { test } from "@playwright/test";
import { cleanupTestData } from "./helpers/auth";

test.describe("Cleanup", () => {
  test("cleanup test data", async () => {
    await cleanupTestData();
  });
});
