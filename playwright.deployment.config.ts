import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/deployment",
  workers: 1,
  timeout: 120000,
  reporter: [
    ["list"],
    ["json", { outputFile: "docs/deployment-e2e-results.json" }],
  ],
  use: {
    baseURL: process.env.DEPLOYMENT_URL,
    trace: "off",
    screenshot: "only-on-failure",
  },
});
