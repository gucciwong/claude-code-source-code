import { app } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import { join, resolve } from 'path'
import { existsSync } from 'fs'
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

function resolvePython(root: string): string {
  const candidates = [
    join(root, '.venv', 'Scripts', 'python.exe'), // Windows venv
    join(root, '.venv', 'bin', 'python3'),         // Unix venv
    join(root, '.venv', 'bin', 'python'),          // Unix venv fallback
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return 'python3' // system fallback
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
      { cwd: svcDir, stdio: 'ignore', detached: false }
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
