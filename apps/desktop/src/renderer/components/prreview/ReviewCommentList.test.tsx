import { render, screen } from '@testing-library/react'
import { ReviewCommentList } from './ReviewCommentList'
import type { ReviewComment } from '../../../shared/prReview'

const comments: ReviewComment[] = [
  { file_path: 'src/auth.ts', line: 10, severity: 'error', rule: 'no-unsafe-any', message: 'Variable is typed as any' },
  { file_path: 'src/utils.ts', line: 42, severity: 'warning', rule: 'no-unused-vars', message: 'Unused variable x' },
  { file_path: 'src/index.ts', line: 1, severity: 'info', rule: 'prefer-const', message: 'Use const instead of let' },
]

describe('ReviewCommentList', () => {
  it('shows empty state message when no comments', () => {
    render(<ReviewCommentList comments={[]} />)
    expect(screen.getByText('No comments — looking clean!')).toBeInTheDocument()
  })

  it('renders file path and line for each comment', () => {
    render(<ReviewCommentList comments={comments} />)
    expect(screen.getByText('src/auth.ts:10')).toBeInTheDocument()
    expect(screen.getByText('src/utils.ts:42')).toBeInTheDocument()
  })

  it('renders rule for each comment', () => {
    render(<ReviewCommentList comments={comments} />)
    expect(screen.getByText('no-unsafe-any')).toBeInTheDocument()
    expect(screen.getByText('no-unused-vars')).toBeInTheDocument()
  })

  it('renders message for each comment', () => {
    render(<ReviewCommentList comments={comments} />)
    expect(screen.getByText('Variable is typed as any')).toBeInTheDocument()
    expect(screen.getByText('Unused variable x')).toBeInTheDocument()
  })

  it('applies red border class for error severity', () => {
    const { container } = render(<ReviewCommentList comments={[comments[0]]} />)
    const card = container.querySelector('.border-red-400')
    expect(card).toBeInTheDocument()
  })

  it('applies yellow border class for warning severity', () => {
    const { container } = render(<ReviewCommentList comments={[comments[1]]} />)
    const card = container.querySelector('.border-yellow-400')
    expect(card).toBeInTheDocument()
  })
})
