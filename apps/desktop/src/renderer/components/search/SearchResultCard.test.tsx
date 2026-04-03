import { render, screen } from '@testing-library/react'
import { SearchResultCard } from './SearchResultCard'
import type { CodeSnippet } from '../../../shared/semanticSearch'

const result: CodeSnippet = {
  file_path: 'src/auth/handler.ts',
  chunk_text: 'function handleAuth(token: string) { return validateToken(token) }',
  start_line: 42,
  end_line: 50,
  score: 0.85,
  language: 'typescript',
}

describe('SearchResultCard', () => {
  it('renders rank', () => {
    render(<SearchResultCard result={result} rank={1} />)
    expect(screen.getByText('#1')).toBeInTheDocument()
  })

  it('renders file path', () => {
    render(<SearchResultCard result={result} rank={1} />)
    expect(screen.getByText('src/auth/handler.ts')).toBeInTheDocument()
  })

  it('renders line range', () => {
    render(<SearchResultCard result={result} rank={1} />)
    expect(screen.getByText('L42–50')).toBeInTheDocument()
  })

  it('renders language badge', () => {
    render(<SearchResultCard result={result} rank={1} />)
    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('renders score as percentage', () => {
    render(<SearchResultCard result={result} rank={1} />)
    expect(screen.getByText('85% match')).toBeInTheDocument()
  })

  it('renders code chunk text', () => {
    render(<SearchResultCard result={result} rank={1} />)
    expect(screen.getByText(/handleAuth/)).toBeInTheDocument()
  })

  it('truncates chunk text longer than 300 chars', () => {
    const longText = 'x'.repeat(400)
    render(<SearchResultCard result={{ ...result, chunk_text: longText }} rank={1} />)
    expect(screen.getByText(/…/)).toBeInTheDocument()
  })
})
