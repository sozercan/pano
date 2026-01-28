import { createFileRoute } from '@tanstack/react-router'
import { useDashboardGroups } from '@frontend/hooks/useTestGridApi'
import { QueryError } from '@frontend/components/ErrorBoundary'
import { useSubscriptionCount } from '@frontend/stores/subscriptionStore'
import { formatRelativeTime } from '@frontend/lib/date'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data, isLoading, error, isError, refetch, isRefetching, dataUpdatedAt } = useDashboardGroups()
  const groupCount = data?.dashboard_groups?.length ?? 0
  const subscriptionCount = useSubscriptionCount()

  if (isError) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <QueryError
            error={error}
            title="Failed to load dashboard groups"
            onRetry={() => refetch()}
            isRetrying={isRefetching}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Welcome to Pano</h1>
        <p className="text-[hsl(var(--muted-foreground))] mb-8">
          A modern viewer for TestGrid dashboards
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Dashboard Groups"
            value={isLoading ? '...' : groupCount.toString()}
            description="Available for browsing"
          />
          <StatsCard
            title="Subscriptions"
            value={subscriptionCount.toString()}
            description="Tracked items"
          />
          <StatsCard
            title="Last Updated"
            value={dataUpdatedAt ? formatRelativeTime(new Date(dataUpdatedAt)) : '...'}
            description="Refreshes every 5 min"
          />
        </div>

        <div className="mt-8 rounded-lg border border-[hsl(var(--border))] p-6">
          <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
          <ul className="space-y-2 text-[hsl(var(--muted-foreground))]">
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--foreground))]">1.</span>
              <span>Expand a dashboard group in the sidebar to see available dashboards</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--foreground))]">2.</span>
              <span>Click a dashboard to view its tab summaries and overall status</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--foreground))]">3.</span>
              <span>Select a tab to see the full test results grid</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--foreground))]">4.</span>
              <span>Use <kbd className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-xs font-mono">⌘K</kbd> to search across all dashboards and tests</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-sm text-[hsl(var(--muted-foreground))]">
          <p>Status indicators:
            <span className="inline-flex items-center gap-1 ml-2">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Passing
            </span>
            <span className="inline-flex items-center gap-1 ml-3">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Failing
            </span>
            <span className="inline-flex items-center gap-1 ml-3">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> Flaky
            </span>
            <span className="inline-flex items-center gap-1 ml-3">
              <span className="h-2 w-2 rounded-full bg-gray-500" /> Stale
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

function StatsCard({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
    </div>
  )
}
