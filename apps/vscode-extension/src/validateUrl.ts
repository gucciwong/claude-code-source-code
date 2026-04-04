/**
 * Validates that a user-provided URL is safe to use as an Ollama endpoint.
 * Blocks non-HTTP(S) schemes and cloud metadata endpoints.
 */
export function validateOllamaUrl(raw: string): string {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error(`Invalid Ollama URL: ${raw}`)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Ollama URL must use http or https, got ${parsed.protocol}`)
  }

  // Block AWS/GCP/Azure metadata endpoints (common SSRF targets)
  const blockedHosts = ['169.254.169.254', 'metadata.google.internal']
  if (blockedHosts.includes(parsed.hostname)) {
    throw new Error(`Ollama URL hostname is blocked: ${parsed.hostname}`)
  }

  // Return the origin (scheme + host + port) to prevent path traversal in base URL
  return parsed.origin
}
