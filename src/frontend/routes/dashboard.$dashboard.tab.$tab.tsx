import { createFileRoute, Link } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { useTabSummary, useHeaders, useRows } from '@frontend/hooks/useTestGridApi'
import { StatusBadge } from '@frontend/components/dashboard/StatusBadge'
import { SubscribeButton } from '@frontend/components/subscriptions'
import { ChevronRight, Clock, RefreshCw } from 'lucide-react'
import { cn } from '@frontend/lib/cn'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@frontend/hooks/useTestGridApi'
import { formatRelativeTime } from '@frontend/lib/date'
import { QueryError } from '@frontend/components/ErrorBoundary'

// Lazy load the heavy TestGrid component for better initial load performance
const TestGrid = lazy(() => import('@frontend/components/grid').then(mod => ({ default: mod.TestGrid })))

export const Route = createFileRoute('/dashboard/$dashboard/tab/$tab')({
  component: TabPage,
  errorComponent: RouteErrorComponent,
})

function RouteErrorComponent({ error }: { error: Error }) {
  return (
    <div className="p-6">
      <QueryError
        error={error}
        title="Failed to load tab"
        onRetry={() => window.location.reload()}
      />
    </div>
  )
}

function TabPage() {
  const { dashboard, tab } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: summaryData, isLoading: summaryLoading } = useTabSummary(dashboard, tab)
  const { data: headersData, isLoading: headersLoading } = useHeaders(dashboard, tab)
  const { data: rowsData, isLoading: rowsLoading, isFetching } = useRows(dashboard, tab)

  const summary = summaryData?.tab_summary
  const headers = headersData?.headers ?? []
  const rows = rowsData?.rows ?? []

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tabSummary(dashboard, tab) })
    queryClient.invalidateQueries({ queryKey: queryKeys.headers(dashboard, tab) })
    queryClient.invalidateQueries({ queryKey: queryKeys.rows(dashboard, tab) })
  }

  const lastRun = summary?.last_run_timestamp
    ? formatRelativeTime(new Date(summary.last_run_timestamp))
    : 'Unknown'

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] mb-4">
        <Link to="/dashboard/$dashboard" params={{ dashboard }} className="hover:text-[hsl(var(--foreground))]">
          {dashboard}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[hsl(var(--foreground))]">{tab}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{tab}</h1>
            {summaryLoading ? (
              <div className="h-6 w-20 rounded-full bg-[hsl(var(--muted))] animate-pulse" />
            ) : summary ? (
              <StatusBadge status={summary.overall_status} showLabel size="lg" />
            ) : null}
          </div>
          {summary?.detailed_status_message && (
            <p className="text-[hsl(var(--muted-foreground))]">{summary.detailed_status_message}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Last run: {lastRun}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SubscribeButton
            target={{ type: 'tab', dashboardName: dashboard, tabName: tab }}
            variant="outline"
          />
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Test Grid */}
      <div className="flex-1 min-h-0">
        {headersLoading || rowsLoading ? (
          <div className="rounded-lg border border-[hsl(var(--border))] p-8 text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-[hsl(var(--muted-foreground))]" />
            <p className="text-[hsl(var(--muted-foreground))]">Loading test grid...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-[hsl(var(--border))] p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">No test data available</p>
          </div>
        ) : (
          <Suspense fallback={
            <div className="rounded-lg border border-[hsl(var(--border))] p-8 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-[hsl(var(--muted-foreground))]" />
              <p className="text-[hsl(var(--muted-foreground))]">Loading grid component...</p>
            </div>
          }>
            <TestGrid headers={headers} rows={rows} maxHeight={600} dashboardName={dashboard} tabName={tab} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

