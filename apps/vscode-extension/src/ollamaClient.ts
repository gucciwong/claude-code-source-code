import { validateOllamaUrl } from './validateUrl'

export async function getCompletion(
  baseUrl: string,
  model: string,
  prompt: string,
  maxTokens: number,
  signal?: AbortSignal,
): Promise<string> {
  baseUrl = validateOllamaUrl(baseUrl)
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
  baseUrl = validateOllamaUrl(baseUrl)
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function* streamChatResponse(
  baseUrl: string,
  model: string,
  messages: { role: string; content: string }[],
  signal?: AbortSignal
): AsyncGenerator<string> {
  baseUrl = validateOllamaUrl(baseUrl)
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  })
  if (!res.ok || !res.body) return
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    for (const line of text.split('\n')) {
      if (!line.trim()) continue
      try {
        const json = JSON.parse(line)
        if (json.message?.content) yield json.message.content
      } catch { /* skip malformed lines */ }
    }
  }
}

export async function listModels(baseUrl: string): Promise<string[]> {
  baseUrl = validateOllamaUrl(baseUrl)
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const data = await res.json() as { models?: { name: string }[] }
    return data.models?.map(m => m.name) ?? []
  } catch {
    return []
  }
}
