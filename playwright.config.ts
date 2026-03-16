import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Run sequentially for data dependencies
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Sequential for shared test data
  reporter: [["html"], ["list"]],
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /setup\.spec\.ts/,
    },
    {
      name: "tests",
      testMatch: /^(?!.*(?:setup|cleanup)).*\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "cleanup",
      testMatch: /cleanup\.spec\.ts/,
      dependencies: ["tests"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
