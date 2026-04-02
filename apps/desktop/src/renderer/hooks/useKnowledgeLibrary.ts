import { useState, useCallback } from 'react'

const KNOWLEDGE_SERVICE_URL = 'http://localhost:8003'

interface EmbedResponse {
  embedding: number[]
  dim: number
}

interface SnippetVector {
  id: string
  embedding: number[]
}

interface SearchHit {
  id: string
  score: number
}

interface SearchResponse {
  results: SearchHit[]
}

interface HealthResponse {
  status: string
  version: string
  model_loaded: boolean
}

interface UseKnowledgeLibraryReturn {
  embed: (text: string) => Promise<number[]>
  search: (
    queryEmbedding: number[],
    snippets: SnippetVector[],
    topK?: number,
    threshold?: number,
  ) => Promise<SearchHit[]>
  health: () => Promise<HealthResponse>
  isLoading: boolean
  error: string | null
}

export function useKnowledgeLibrary(): UseKnowledgeLibraryReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const embed = useCallback(async (text: string): Promise<number[]> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${KNOWLEDGE_SERVICE_URL}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!response.ok) {
        const detail = (await response.json().catch(() => ({}))).detail ?? response.statusText
        setError(`Embed failed: ${detail}`)
        return []
      }
      const data = (await response.json()) as EmbedResponse
      return data.embedding
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Embed error: ${message}`)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const search = useCallback(
    async (
      queryEmbedding: number[],
      snippets: SnippetVector[],
      topK: number = 5,
      threshold: number = 0.0,
    ): Promise<SearchHit[]> => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`${KNOWLEDGE_SERVICE_URL}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query_embedding: queryEmbedding,
            snippets,
            top_k: topK,
            threshold,
          }),
        })
        if (!response.ok) {
          const detail = (await response.json().catch(() => ({}))).detail ?? response.statusText
          setError(`Search failed: ${detail}`)
          return []
        }
        const data = (await response.json()) as SearchResponse
        return data.results
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(`Search error: ${message}`)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const health = useCallback(async (): Promise<HealthResponse> => {
    const response = await fetch(`${KNOWLEDGE_SERVICE_URL}/health`)
    return (await response.json()) as HealthResponse
  }, [])

  return { embed, search, health, isLoading, error }
}
