/**
 * Shared helpers for W7-T19 Playwright specs.
 *
 * The desktop app spawns 18 backend services on launch (`serviceManager.ts`).
 * That's heavy for an e2e test — most of our tests only care about the
 * renderer behavior. We set `SOVEREIGN_E2E_SKIP_SERVICES=1` so the main
 * process leaves them off, and the test stubs out renderer fetches via
 * `page.route()` instead.
 */
import { _electron as electron, ElectronApplication, Page } from '@playwright/test'
import { join } from 'node:path'

/**
 * Launches the packaged Electron app from `out/`. Caller must have run
 * `npm run build` first (CI workflow handles this).
 */
export async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const repoRoot = join(__dirname, '..')
  const app = await electron.launch({
    args: [join(repoRoot, 'out/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SOVEREIGN_E2E_SKIP_SERVICES: '1', // serviceManager.ts honors this flag
      // Force the test renderer to load from disk, not the dev URL.
      ELECTRON_RENDERER_URL: '',
    },
    timeout: 30_000,
  })
  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  return { app, page }
}

/**
 * Stub the model-manager `/api/v1/models` call so the renderer doesn't
 * burn time waiting for a real service. Returns a small synthetic list.
 */
export async function stubModelManager(page: Page): Promise<void> {
  await page.route('**/api/v1/models', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        cached_models: [
          {
            id: 'qwen2.5-coder-7b',
            name: 'qwen2.5-coder-7b',
            size_bytes: 4_400_000_000,
            cached: true,
            local_path: '/fake',
            format: 'gguf',
            source: 'huggingface',
            status: 'ready',
          },
        ],
        active_model: 'qwen2.5-coder-7b',
      }),
    })
  })

  await page.route('**/api/v1/mirror', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current_mirror: 'huggingface',
        is_china_mirror: false,
        huggingface_endpoint: 'https://huggingface.co',
        api_endpoint: 'https://huggingface.co/api',
        available_mirrors: [
          { name: 'huggingface', display: 'HuggingFace', endpoint: '', api_endpoint: '' },
          { name: 'hf-mirror', display: 'China Mirror', endpoint: '', api_endpoint: '' },
        ],
      }),
    })
  })
}
