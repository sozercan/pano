import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
          <div className="max-w-md w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                Something went wrong
              </h1>
            </div>

            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              An unexpected error occurred. This might be a temporary issue.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 rounded-md bg-[hsl(var(--muted))] overflow-auto">
                <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-xs font-mono text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.slice(0, 500)}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={this.handleRetry}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </div>

            <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))] text-center">
              If the problem persists,{' '}
              <button onClick={this.handleReload} className="underline hover:no-underline">
                reload the page
              </button>
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Smaller inline error component for non-critical sections
export function ErrorFallback({
  error,
  resetError,
}: {
  error?: Error
  resetError?: () => void
}) {
  return (
    <div
      className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Failed to load this section
          </h3>
          {error && (
            <p className="mt-1 text-sm text-red-700 dark:text-red-300 truncate">
              {error.message}
            </p>
          )}
          {resetError && (
            <button
              onClick={resetError}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Query error component with retry support for TanStack Query
export function QueryError({
  error,
  onRetry,
  isRetrying = false,
  title = 'Failed to load data',
}: {
  error: Error | null
  onRetry?: () => void
  isRetrying?: boolean
  title?: string
}) {
  const isOffline = !navigator.onLine
  const errorMessage = isOffline
    ? "You appear to be offline. Please check your internet connection."
    : error?.message || 'An unexpected error occurred'

  return (
    <div
      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center"
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" aria-hidden="true" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 max-w-md mx-auto">
        {errorMessage}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} aria-hidden="true" />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </div>
  )
}
