export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

const BASE = 'http://localhost:11434'

export const ollamaClient = {
  async getModels(): Promise<OllamaModel[]> {
    try {
      const res = await fetch(`${BASE}/api/tags`)
      if (!res.ok) return []
      const data = await res.json() as { models?: OllamaModel[] }
      return data.models ?? []
    } catch {
      return []
    }
  },

  async isOnline(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      })
      return res.ok
    } catch {
      return false
    }
  },

  async *streamChat(
    model: string,
    messages: { role: string; content: string }[]
  ): AsyncGenerator<string> {
    const res = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
    })
    if (!res.body) return
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
        try {
          const json = JSON.parse(line.slice(6)) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const delta = json.choices?.[0]?.delta?.content
          if (delta) yield delta
        } catch {
          // skip malformed lines
        }
      }
    }
  },
}
