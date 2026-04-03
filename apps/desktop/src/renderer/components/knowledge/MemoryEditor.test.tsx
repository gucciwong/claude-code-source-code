import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryEditor } from './MemoryEditor'

describe('MemoryEditor', () => {
  it('renders the Memory Markdown label', () => {
    render(<MemoryEditor value="" onChange={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByText('Memory Markdown')).toBeInTheDocument()
  })

  it('renders textarea with placeholder', () => {
    render(<MemoryEditor value="" onChange={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByPlaceholderText(/Write notes that will be injected/)).toBeInTheDocument()
  })

  it('displays the current value', () => {
    render(<MemoryEditor value="# My Notes" onChange={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByDisplayValue('# My Notes')).toBeInTheDocument()
  })

  it('calls onChange when typing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MemoryEditor value="" onChange={onChange} onSave={vi.fn()} />)
    await user.type(screen.getByRole('textbox'), 'hello')
    expect(onChange).toHaveBeenCalled()
  })

  it('renders Save Memory button', () => {
    render(<MemoryEditor value="" onChange={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Save Memory/i })).toBeInTheDocument()
  })

  it('calls onSave when Save Memory is clicked', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<MemoryEditor value="some content" onChange={vi.fn()} onSave={onSave} />)
    await user.click(screen.getByRole('button', { name: /Save Memory/i }))
    expect(onSave).toHaveBeenCalled()
  })
})
