export interface CodeSnippet {
  file_path: string
  chunk_text: string
  start_line: number
  end_line: number
  score: number
  language: string
}

export interface IndexStatus {
  total_chunks: number
  indexed_files: number
  status: 'empty' | 'ready' | 'indexing'
}

export interface IndexRequest {
  content: string
  file_path: string
  language: string
  metadata: Record<string, string>
}
