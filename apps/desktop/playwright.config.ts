/**
 * W7-T19 — Playwright configuration for cross-OS e2e.
 *
 * The desktop app is Electron; Playwright drives it via `_electron.launch()`.
 * Each spec opens its own Electron instance so failures don't poison the
 * next test. CI uploads videos + traces on failure.
 *
 * Local dev:
 *   cd apps/desktop && npm run build && npm run e2e
 *
 * CI: `.github/workflows/e2e.yml` runs the same command on a matrix of
 * ubuntu / macos / windows runners.
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // Each Electron launch is heavy — generous per-test budget.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,            // Electron processes can collide otherwise
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,                       // one Electron instance at a time
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
})
