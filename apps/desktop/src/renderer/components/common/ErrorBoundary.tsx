import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  label?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', this.props.label ?? 'Unnamed', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
          <AlertTriangle size={40} className="text-red-400" aria-hidden="true" />
          <div>
            <p className="text-text-primary font-semibold text-lg">Something went wrong</p>
            {this.props.label && (
              <p className="text-text-muted text-sm mt-1">{this.props.label}</p>
            )}
            {this.state.error && (
              <p className="text-red-400 text-xs mt-2 font-mono max-w-md break-words">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 text-sm bg-accent-500 hover:bg-accent-400 text-text-primary rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
