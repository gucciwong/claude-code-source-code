/**
 * Telemetry Envelope — KPI spec §3.1
 * All telemetry events must carry these 11 common fields.
 * Populated automatically; callers only supply event-specific fields.
 */

export const TELEMETRY_VERSION = '1.0'

/** Lazy session ID: one UUID per browser/app session */
function getOrCreateSessionId(): string {
  const KEY = 'sc_session_id'
  const existing = sessionStorage.getItem(KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem(KEY, id)
  return id
}

/** Lazy installation-scoped hash: one UUID per device installation */
function getInstallationIdHash(): string {
  const KEY = 'sc_installation_id_hash'
  const existing = localStorage.getItem(KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(KEY, id)
  return id
}

/** §3.1 Common envelope present on every telemetry event */
export interface TelemetryEnvelope {
  event_name: string
  event_version: string
  timestamp_utc: string
  session_id: string
  installation_id_hash: string
  project_id_hash: string
  client_version: string
  platform: string
  runtime_backend: string
  model_id: string
  correlation_id: string
}

/**
 * Build a fully-populated 11-field envelope.
 * A new correlation_id is generated per call so callers can link
 * related events by sharing a pre-generated ID.
 */
export function buildEnvelope(
  eventName: string,
  modelId: string,
  runtimeBackend = 'ollama',
  projectIdHash = 'local',
  correlationId?: string,
): TelemetryEnvelope {
  return {
    event_name: eventName,
    event_version: TELEMETRY_VERSION,
    timestamp_utc: new Date().toISOString(),
    session_id: getOrCreateSessionId(),
    installation_id_hash: getInstallationIdHash(),
    project_id_hash: projectIdHash,
    client_version: (import.meta.env as Record<string, string>).VITE_APP_VERSION ?? '0.8.0',
    platform: navigator.platform || 'unknown',
    runtime_backend: runtimeBackend,
    model_id: modelId,
    correlation_id: correlationId ?? crypto.randomUUID(),
  }
}
