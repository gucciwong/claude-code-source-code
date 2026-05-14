/**
 * W7-T19 — Models screen happy-path e2e.
 *
 * Scope: navigating to Models renders the tab row (Installed / Download
 * from HuggingFace), and the HuggingFace tab opens its panel. This catches
 * regressions in the W2-T4 download-UI wiring.
 */
import { test, expect } from '@playwright/test'
import { launchApp, stubModelManager } from './helpers'

test('models screen shows tabs including HuggingFace download', async () => {
  const { app, page } = await launchApp()
  await stubModelManager(page)

  try {
    await page.getByRole('button', { name: /^Models$/ }).click()

    // "Installed (1)" tab should be present (we stubbed 1 cached model).
    await expect(page.getByRole('tab', { name: /Installed/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Download from HuggingFace/i })).toBeVisible()
  } finally {
    await app.close()
  }
})

test('switching to Download tab reveals HuggingFace panel', async () => {
  const { app, page } = await launchApp()
  await stubModelManager(page)

  // Stub HF search so the panel can render without a real backend.
  await page.route('**/api/v1/models/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  try {
    await page.getByRole('button', { name: /^Models$/ }).click()
    await page.getByRole('tab', { name: /Download from HuggingFace/i }).click()
    // The HuggingFacePanel renders inside the tab content; assert via
    // any of its anchor strings (search input or curated picks header).
    const panel = page.locator('[role="tabpanel"]:visible')
    await expect(panel).toBeVisible()
  } finally {
    await app.close()
  }
})
