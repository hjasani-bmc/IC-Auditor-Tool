import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Top-level error boundary (NFR: graceful failure, no white screen). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In v1 (client-side only) we just log; v2 can ship this to a backend.
    console.error('Unhandled error:', error, info)
  }

  handleReset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="card max-w-lg p-8 text-center">
            <h1 className="text-xl font-semibold text-slate-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              The application hit an unexpected error. Your uploaded data is held
              in memory only, so reloading will reset to the demo dataset.
            </p>
            <pre className="mt-4 overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-700">
              {this.state.error.message}
            </pre>
            <button className="btn-primary mt-6" onClick={this.handleReset}>
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
