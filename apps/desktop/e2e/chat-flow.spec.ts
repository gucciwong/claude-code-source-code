/**
 * W7-T19 — Chat happy-path e2e.
 *
 * Scope: app launches, the chat screen renders, the model picker offers
 * the CAMR "Auto" option (W5-T15), and the input box accepts text.
 *
 * Not covered here (separate spec / not yet stable in CI):
 *   - actually streaming a token (requires a real Ollama or model-manager)
 *   - the assistant bubble appearing (same dep)
 *
 * Both of the above are exercised by manual smoke tests during release.
 */
import { test, expect } from '@playwright/test'
import { launchApp, stubModelManager } from './helpers'

test('app launches and chat screen is reachable', async () => {
  const { app, page } = await launchApp()
  await stubModelManager(page)

  try {
    // The sidebar always renders the "Chat" nav button.
    await expect(page.getByRole('button', { name: /^Chat$/ })).toBeVisible()
    await page.getByRole('button', { name: /^Chat$/ }).click()

    // Chat screen marker (data-testid="screen-chat").
    await expect(page.locator('[data-testid="screen-chat"]')).toBeVisible()
  } finally {
    await app.close()
  }
})

test('chat shows the CAMR Auto model option', async () => {
  const { app, page } = await launchApp()
  await stubModelManager(page)

  try {
    await page.getByRole('button', { name: /^Chat$/ }).click()
    const selector = page.getByRole('combobox', { name: /select model/i })
    await expect(selector).toBeVisible()

    const optionTexts = await selector.locator('option').allTextContents()
    expect(optionTexts.some((t) => /Auto.*CAMR/i.test(t))).toBe(true)
  } finally {
    await app.close()
  }
})

test('chat input accepts text', async () => {
  const { app, page } = await launchApp()
  await stubModelManager(page)

  try {
    await page.getByRole('button', { name: /^Chat$/ }).click()
    const input = page.getByRole('textbox').first()
    await input.fill('hello sovereign')
    await expect(input).toHaveValue('hello sovereign')
  } finally {
    await app.close()
  }
})
