import { createFileRoute, Link, Outlet, useMatch } from '@tanstack/react-router'
import { useDashboardSummary, useTabSummaries } from '@frontend/hooks/useTestGridApi'
import { StatusBadge } from '@frontend/components/dashboard/StatusBadge'
import { SubscribeButton, SubscribeIconButton } from '@frontend/components/subscriptions'
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { formatRelativeTime } from '@frontend/lib/date'
import { QueryError } from '@frontend/components/ErrorBoundary'

export const Route = createFileRoute('/dashboard/$dashboard')({
  component: DashboardPage,
  errorComponent: RouteErrorComponent,
})

function RouteErrorComponent({ error }: { error: Error }) {
  return (
    <div className="p-6">
      <QueryError
        error={error}
        title="Failed to load dashboard"
        onRetry={() => window.location.reload()}
      />
    </div>
  )
}

function DashboardPage() {
  const { dashboard } = Route.useParams()

  // Check if we're on a child route (tab detail)
  const tabMatch = useMatch({ from: '/dashboard/$dashboard/tab/$tab', shouldThrow: false })

  // If we're on a tab route, render the child (Outlet)
  if (tabMatch) {
    return <Outlet />
  }

  return <DashboardContent dashboard={dashboard} />
}

function DashboardContent({ dashboard }: { dashboard: string }) {
  const { data: summaryData, isLoading: summaryLoading } = useDashboardSummary(dashboard)
  const { data: tabsData, isLoading: tabsLoading } = useTabSummaries(dashboard)

  const summary = summaryData?.dashboard_summary
  const tabs = tabsData?.tab_summaries ?? []

  // Calculate stats
  const passingCount = tabs.filter((t) => t.overall_status === 'PASSING').length
  const failingCount = tabs.filter((t) => t.overall_status === 'FAILING').length
  const flakyCount = tabs.filter((t) => t.overall_status === 'FLAKY').length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{dashboard}</h1>
            {summaryLoading ? (
              <div className="h-6 w-20 rounded-full bg-[hsl(var(--muted))] animate-pulse" />
            ) : summary ? (
              <StatusBadge status={summary.overall_status} showLabel size="lg" />
            ) : null}
          </div>
          <SubscribeButton
            target={{ type: 'dashboard', dashboardName: dashboard }}
            variant="outline"
          />
        </div>
        <p className="text-[hsl(var(--muted-foreground))]">
          {tabs.length} tabs in this dashboard
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Total Tabs"
          value={tabsLoading ? '...' : tabs.length.toString()}
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          label="Passing"
          value={tabsLoading ? '...' : passingCount.toString()}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          label="Failing"
          value={tabsLoading ? '...' : failingCount.toString()}
          color="text-red-600 dark:text-red-400"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
          label="Flaky"
          value={tabsLoading ? '...' : flakyCount.toString()}
          color="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Tab Grid */}
      <h2 className="text-lg font-semibold mb-4">Tabs</h2>
      {tabsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tabs.map((tab) => (
            <TabCard key={tab.tab_name} dashboard={dashboard} tab={tab} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-4">
      <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color ?? ''}`}>{value}</p>
    </div>
  )
}

function TabCard({
  dashboard,
  tab,
}: {
  dashboard: string
  tab: {
    tab_name: string
    overall_status: 'PASSING' | 'FAILING' | 'FLAKY' | 'STALE'
    detailed_status_message?: string
    last_run_timestamp?: string
  }
}) {
  const lastRun = tab.last_run_timestamp
    ? formatRelativeTime(new Date(tab.last_run_timestamp))
    : 'Unknown'

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-4 hover:border-[hsl(var(--foreground))]/20 hover:bg-[hsl(var(--accent))]/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          to="/dashboard/$dashboard/tab/$tab"
          params={{ dashboard, tab: tab.tab_name }}
          className="flex-1 min-w-0"
        >
          <h3 className="font-medium truncate">{tab.tab_name}</h3>
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          <SubscribeIconButton
            target={{ type: 'tab', dashboardName: dashboard, tabName: tab.tab_name }}
            size="sm"
          />
          <StatusBadge status={tab.overall_status} size="md" />
        </div>
      </div>
      <Link
        to="/dashboard/$dashboard/tab/$tab"
        params={{ dashboard, tab: tab.tab_name }}
        className="block"
      >
        {tab.detailed_status_message && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">
            {tab.detailed_status_message}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
          <Clock className="h-3 w-3" />
          <span>Last run: {lastRun}</span>
        </div>
      </Link>
    </div>
  )
}

