export async function getCompletion(
  baseUrl: string,
  model: string,
  prompt: string,
  maxTokens: number,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { num_predict: maxTokens },
      }),
      signal,
    })

    if (!response.ok) {
      return ''
    }

    const data = await response.json() as { response: string }
    return data.response ?? ''
  } catch {
    return ''
  }
}

export async function checkOllamaOnline(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}
