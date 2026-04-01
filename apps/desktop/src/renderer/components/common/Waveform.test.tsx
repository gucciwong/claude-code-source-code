import { render } from '@testing-library/react'
import { Waveform } from './Waveform'

test('renders waveform canvas element', () => {
  const { container } = render(<Waveform isRecording={false} />)
  const canvas = container.querySelector('canvas')
  expect(canvas).toBeInTheDocument()
})

test('canvas has correct initial styling classes', () => {
  const { container } = render(<Waveform isRecording={false} className="extra-class" />)
  const canvas = container.querySelector('canvas') as HTMLCanvasElement
  expect(canvas).toHaveClass('w-full', 'bg-bg-base', 'border', 'border-border-default', 'rounded-md', 'extra-class')
})

test('canvas has minimum height inline style', () => {
  const { container } = render(<Waveform isRecording={false} />)
  const canvas = container.querySelector('canvas')
  const style = canvas?.getAttribute('style')
  expect(style).toContain('min-height: 80px')
})

test('renders canvas when not recording', () => {
  const { container } = render(<Waveform isRecording={false} />)
  expect(container.querySelector('canvas')).toBeInTheDocument()
})

test('accepts audioContext and analyser props for recording', () => {
  const mockAudioContext = {} as AudioContext
  const mockAnalyser = {
    frequencyBinCount: 256,
    getByteFrequencyData: (data: Uint8Array) => {},
  } as unknown as AnalyserNode

  const { container } = render(
    <Waveform isRecording={true} audioContext={mockAudioContext} analyser={mockAnalyser} />,
  )

  expect(container.querySelector('canvas')).toBeInTheDocument()
})

test('supports custom className prop', () => {
  const { container } = render(<Waveform isRecording={false} className="custom-class another-class" />)
  const canvas = container.querySelector('canvas')
  expect(canvas).toHaveClass('custom-class', 'another-class')
})
