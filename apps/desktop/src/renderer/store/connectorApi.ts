/** Calls the local model-manager service to validate connector credentials. */

export interface ConnectorTestResult {
  ok: boolean
  error?: string
}

export async function testConnector(
  connectorId: string,
  credentials: Record<string, string>,
): Promise<ConnectorTestResult> {
  try {
    const res = await fetch(`http://127.0.0.1:8002/api/v1/connectors/${connectorId}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentials }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`)
      return { ok: false, error: text }
    }

    const json = await res.json()
    return { ok: Boolean(json.ok), error: json.error ?? undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Could not reach model-manager (${msg})` }
  }
}
