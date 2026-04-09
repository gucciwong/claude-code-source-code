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

  // Block AWS/GCP/Azure metadata endpoints and private/loopback addresses (SSRF)
  const blockedHosts = [
    '169.254.169.254',         // AWS/Azure IMDS
    'metadata.google.internal', // GCP metadata
    '100.100.100.200',          // Alibaba Cloud metadata
  ]
  if (blockedHosts.includes(parsed.hostname)) {
    throw new Error(`Ollama URL hostname is blocked: ${parsed.hostname}`)
  }

  // Block loopback and RFC-1918 private ranges when the user provides an https URL
  // (localhost is valid for dev use with http, but block it for https to avoid confusion)
  const hostWithoutBrackets = parsed.hostname.replace(/^\[|\]$/g, '') // strip IPv6 brackets
  const privatePattern =
    /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc[0-9a-f][0-9a-f]:|fd)/i
  if (privatePattern.test(hostWithoutBrackets) && parsed.protocol === 'https:') {
    throw new Error(`Ollama URL must not use https for a private/loopback address: ${parsed.hostname}`)
  }

  // Return the origin (scheme + host + port) to prevent path traversal in base URL
  return parsed.origin
}
