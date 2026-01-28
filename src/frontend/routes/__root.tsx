import { createRootRouteWithContext } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import { AppShell } from '@frontend/components/layout/AppShell'
import { SearchModal } from '@frontend/components/search/SearchModal'
import { ErrorBoundary } from '@frontend/components/ErrorBoundary'
import { OfflineBanner } from '@frontend/components/OfflineBanner'

// Lazy load devtools in development
const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null
    : lazy(() =>
        import('@tanstack/router-devtools').then((mod) => ({
          default: mod.TanStackRouterDevtools,
        }))
      )

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ErrorBoundary>
      {/* Skip link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-[hsl(var(--primary))] focus:text-[hsl(var(--primary-foreground))] focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <OfflineBanner />
      <AppShell />
      <SearchModal />
      <Suspense>
        <TanStackRouterDevtools position="bottom-right" />
      </Suspense>
    </ErrorBoundary>
  )
}
