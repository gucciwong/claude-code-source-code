import { app } from 'electron'
import { spawn, ChildProcess, execSync } from 'child_process'
import { join, resolve } from 'path'
import { existsSync, mkdirSync } from 'fs'
import * as net from 'net'
import { is } from '@electron-toolkit/utils'

const SERVICES = [
  { name: 'voice-service',             path: 'services/voice-service',             port: 8000 },
  { name: 'training-service',          path: 'services/training-service',          port: 8001 },
  { name: 'model-manager',             path: 'services/model-manager',             port: 8002 },
  { name: 'knowledge-service',         path: 'services/knowledge-service',         port: 8003 },
  { name: 'enterprise-data-service',   path: 'services/enterprise-data-service',   port: 8004 },
  { name: 'execution-trace-service',   path: 'services/execution-trace-service',   port: 8005 },
  { name: 'orchestration-service',     path: 'services/orchestration-service',     port: 8006 },
  { name: 'code-completion-service',   path: 'services/code-completion-service',   port: 8007 },
  { name: 'federation-service',        path: 'services/federation-service',        port: 8008 },
  { name: 'analytics-service',         path: 'services/analytics-service',         port: 8009 },
  { name: 'memory-service',            path: 'services/memory-service',            port: 8010 },
  { name: 'award-service',             path: 'services/award-service',             port: 8011 },
  { name: 'messaging-bridge-service',  path: 'services/messaging-bridge-service',  port: 8012 },
  { name: 'org-intelligence-service',  path: 'services/org-intelligence-service',  port: 8013 },
  { name: 'persona-council-service',   path: 'services/persona-council-service',   port: 8014 },
  { name: 'plugin-registry-service',   path: 'services/plugin-registry-service',   port: 8015 },
  { name: 'pr-review-service',         path: 'services/pr-review-service',         port: 8016 },
  { name: 'semantic-search-service',   path: 'services/semantic-search-service',   port: 8017 },
]

function resolveRepoRoot(): string {
  if (is.dev) {
    // In dev: app.getAppPath() is apps/desktop; services live two levels up at repo root
    return resolve(app.getAppPath(), '../..')
  }
  // In production: services are copied as extraResources next to the app
  return process.resourcesPath
}

/**
 * Per-service persistent SQLite DB path overrides.
 *
 * Three services (memory / federation / plugin-registry) ship a SQLite
 * backend that only activates when its `*_DB_PATH` env var is set —
 * otherwise the registry falls back to in-memory, and the user's data
 * vanishes on the next service restart (Codex review, PR #1).
 *
 * The Python registries intentionally keep the env-unset → in-memory
 * behaviour so pytest stays hermetic; the *product* run is made
 * persistent here, by pointing each service at a file under Electron's
 * per-user `userData` directory. The dir is created lazily so a fresh
 * install doesn't trip over a missing folder.
 */
function persistenceEnvFor(serviceName: string): Record<string, string> {
  const dataDir = join(app.getPath('userData'), 'service-data')
  const map: Record<string, string> = {
    'memory-service': 'MEMORY_DB_PATH',
    'federation-service': 'FED_PEER_DB_PATH',
    'plugin-registry-service': 'PLUGIN_REGISTRY_DB_PATH',
  }
  const envKey = map[serviceName]
  if (!envKey) return {}
  try {
    mkdirSync(dataDir, { recursive: true })
  } catch {
    // Non-fatal: if the dir can't be created the service falls back to
    // in-memory (same as before this fix) rather than crashing.
    return {}
  }
  return { [envKey]: join(dataDir, `${serviceName}.db`) }
}

function findPythonInPath(): string | null {
  try {
    // Use 'where' on Windows to find python in PATH
    const out = execSync('where python', { windowsHide: true }).toString().trim()
    // 'where' can return multiple paths; take the first one that exists and isn't a WindowsApps stub
    const paths = out.split('\n').map((p: string) => p.trim())
    for (const p of paths) {
      if (p.includes('WindowsApps')) continue // skip WindowsApps stubs
      if (existsSync(p)) return p
    }
    return paths[0] || null // fallback to first result if none pass the WindowsApps check
  } catch {
    return null
  }
}

function resolvePython(root: string): string {
  const candidates = [
    join(root, '.venv', 'Scripts', 'python.exe'), // Windows venv
    join(root, '.venv', 'bin', 'python3'),         // Unix venv
    join(root, '.venv', 'bin', 'python'),          // Unix venv fallback
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  // No venv found — try to find python in PATH, avoiding WindowsApps stubs
  const pathPython = findPythonInPath()
  if (pathPython) return pathPython
  return 'python3' // final fallback
}

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(true))
    server.once('listening', () => { server.close(); resolve(false) })
    server.listen(port, '127.0.0.1')
  })
}

const runningProcesses: ChildProcess[] = []

export async function startAllServices(): Promise<void> {
  // W7-T19: Playwright e2e launches the packaged app to test the renderer
  // only — spawning 18 Python services on every test would be heavy and
  // unreliable in CI. The e2e workflow sets this flag and stubs the
  // relevant fetches via `page.route()` in apps/desktop/e2e/helpers.ts.
  if (process.env.SOVEREIGN_E2E_SKIP_SERVICES === '1') {
    console.log('[ServiceManager] SOVEREIGN_E2E_SKIP_SERVICES=1 — skipping service spawn (e2e mode)')
    return
  }

  const root = resolveRepoRoot()
  const python = resolvePython(root)

  console.log('[ServiceManager] Repo root:', root)
  console.log('[ServiceManager] Python:', python)

  for (const svc of SERVICES) {
    const svcDir = join(root, svc.path)

    if (!existsSync(join(svcDir, 'main.py'))) {
      console.warn(`[ServiceManager] SKIP ${svc.name}: main.py not found`)
      continue
    }

    const inUse = await isPortInUse(svc.port)
    if (inUse) {
      console.log(`[ServiceManager] SKIP ${svc.name}: port ${svc.port} already in use`)
      continue
    }

    const proc = spawn(
      python,
      ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(svc.port), '--log-level', 'warning'],
      {
        cwd: svcDir,
        stdio: 'ignore',
        detached: false,
        // Inherit the parent env (so SOVEREIGN_LOCAL_TOKEN etc. propagate)
        // and layer the per-service persistent DB path on top.
        env: { ...process.env, ...persistenceEnvFor(svc.name) },
      }
    )

    proc.on('error', (err) => console.error(`[ServiceManager] ${svc.name} error: ${err.message}`))
    proc.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.warn(`[ServiceManager] ${svc.name} exited with code ${code}`)
      }
    })

    runningProcesses.push(proc)
    console.log(`[ServiceManager] Started ${svc.name} on port ${svc.port} (pid ${proc.pid})`)
  }
}

export function stopAllServices(): void {
  console.log(`[ServiceManager] Stopping ${runningProcesses.length} service(s)...`)
  for (const proc of runningProcesses) {
    try {
      proc.kill()
    } catch {
      // process already gone
    }
  }
  runningProcesses.length = 0
}
