/**
 * Calls Ollama's /api/embeddings endpoint to get a vector embedding for the given text.
 * Returns null if the request fails for any reason (network error, model not found, etc.)
 */
export async function getEmbedding(
  baseUrl: string,
  model: string,
  text: string,
  signal?: AbortSignal,
): Promise<number[] | null> {
  try {
    const response = await fetch(`${baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: text }),
      signal,
    })

    if (!response.ok) return null

    const data = await response.json() as { embedding?: number[] }
    return data.embedding ?? null
  } catch {
    return null
  }
}
