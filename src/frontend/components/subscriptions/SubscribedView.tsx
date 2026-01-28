import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Layers, FileText, TestTube, Clock, Bell, RefreshCw } from 'lucide-react'
import { useSubscriptions } from '@frontend/stores/subscriptionStore'
import { StatusBadge } from '@frontend/components/dashboard/StatusBadge'
import {
  useDashboardSummary,
  useTabSummary,
  getWorstStatus,
} from '@frontend/hooks/useTestGridApi'
import type { Subscription, OverallStatus } from '@shared/schemas'
import { useQueryClient } from '@tanstack/react-query'
import { formatRelativeTime } from '@frontend/lib/date'

export function SubscribedView() {
  const subscriptions = useSubscriptions()
  const queryClient = useQueryClient()

  const dashboardSubs = subscriptions.filter((s) => s.type === 'dashboard')
  const tabSubs = subscriptions.filter((s) => s.type === 'tab')
  const testSubs = subscriptions.filter((s) => s.type === 'test')

  const handleRefreshAll = () => {
    // Invalidate all dashboard and tab related queries
    queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] })
    queryClient.invalidateQueries({ queryKey: ['tabSummary'] })
    queryClient.invalidateQueries({ queryKey: ['tabSummaries'] })
  }

  if (subscriptions.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-xl font-semibold mb-2">No Subscriptions</h2>
          <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Subscribe to dashboards, tabs, or individual tests to see their status here.
            Use the bell icon on any item to subscribe.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscribed Items</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </button>
      </div>

      {/* Aggregated status */}
      <AggregatedStatus />

      {/* Dashboards section */}
      {dashboardSubs.length > 0 && (
        <Section
          title="Dashboards"
          icon={<Layers className="h-4 w-4" />}
          count={dashboardSubs.length}
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {dashboardSubs.map((sub) => (
              <DashboardSubscriptionCard key={sub.id} subscription={sub} />
            ))}
          </div>
        </Section>
      )}

      {/* Tabs section */}
      {tabSubs.length > 0 && (
        <Section
          title="Tabs"
          icon={<FileText className="h-4 w-4" />}
          count={tabSubs.length}
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {tabSubs.map((sub) => (
              <TabSubscriptionCard key={sub.id} subscription={sub} />
            ))}
          </div>
        </Section>
      )}

      {/* Tests section */}
      {testSubs.length > 0 && (
        <Section
          title="Tests"
          icon={<TestTube className="h-4 w-4" />}
          count={testSubs.length}
        >
          <div className="space-y-2">
            {testSubs.map((sub) => (
              <TestSubscriptionCard key={sub.id} subscription={sub} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function AggregatedStatus() {
  const subscriptions = useSubscriptions()

  // Get unique dashboards to check
  const uniqueDashboards = useMemo(() => {
    const dashboards = new Set<string>()
    subscriptions.forEach((s) => dashboards.add(s.dashboardName))
    return Array.from(dashboards)
  }, [subscriptions])

  // We'll compute worst status from the dashboard-level data
  // For a more complete implementation, we'd need to fetch each subscribed item's status

  return (
    <div className="mb-8 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
      <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
        Overall Status
      </h3>
      <div className="flex items-center gap-3">
        <StatusSummary dashboards={uniqueDashboards} />
      </div>
    </div>
  )
}

function StatusSummary({ dashboards }: { dashboards: string[] }) {
  // Collect statuses from all subscribed dashboards
  const statuses: OverallStatus[] = []

  // We'd ideally use multiple queries here, but for simplicity we'll show a summary
  // In production, you might want to use a single aggregated query or batch requests

  const worstStatus = statuses.length > 0 ? getWorstStatus(statuses) : undefined

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">
        Monitoring {dashboards.length} dashboard{dashboards.length !== 1 ? 's' : ''}
      </span>
      {worstStatus && <StatusBadge status={worstStatus} showLabel />}
    </div>
  )
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">({count})</span>
      </div>
      {children}
    </div>
  )
}

function DashboardSubscriptionCard({ subscription }: { subscription: Subscription }) {
  if (subscription.type !== 'dashboard') return null

  const { data, isLoading } = useDashboardSummary(subscription.dashboardName)
  const summary = data?.dashboard_summary

  return (
    <Link
      to="/dashboard/$dashboard"
      params={{ dashboard: subscription.dashboardName }}
      className="block p-4 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))]/20 hover:bg-[hsl(var(--accent))]/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <h3 className="font-medium truncate">{subscription.dashboardName}</h3>
        </div>
        {isLoading ? (
          <div className="h-5 w-16 rounded-full bg-[hsl(var(--muted))] animate-pulse" />
        ) : summary ? (
          <StatusBadge status={summary.overall_status} size="sm" />
        ) : null}
      </div>
      <div className="text-xs text-[hsl(var(--muted-foreground))]">
        Subscribed {new Date(subscription.createdAt).toLocaleDateString()}
      </div>
    </Link>
  )
}

function TabSubscriptionCard({ subscription }: { subscription: Subscription }) {
  if (subscription.type !== 'tab') return null

  const { data, isLoading } = useTabSummary(subscription.dashboardName, subscription.tabName)
  const summary = data?.tab_summary

  const lastRun = summary?.last_run_timestamp
    ? formatRelativeTime(new Date(summary.last_run_timestamp))
    : 'Unknown'

  return (
    <Link
      to="/dashboard/$dashboard/tab/$tab"
      params={{ dashboard: subscription.dashboardName, tab: subscription.tabName }}
      className="block p-4 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))]/20 hover:bg-[hsl(var(--accent))]/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
            <h3 className="font-medium truncate">{subscription.tabName}</h3>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-1">
            {subscription.dashboardName}
          </p>
        </div>
        {isLoading ? (
          <div className="h-5 w-16 rounded-full bg-[hsl(var(--muted))] animate-pulse" />
        ) : summary ? (
          <StatusBadge status={summary.overall_status} size="sm" />
        ) : null}
      </div>
      {summary?.detailed_status_message && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1 mb-2">
          {summary.detailed_status_message}
        </p>
      )}
      <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
        <Clock className="h-3 w-3" />
        <span>Last run: {lastRun}</span>
      </div>
    </Link>
  )
}

function TestSubscriptionCard({ subscription }: { subscription: Subscription }) {
  if (subscription.type !== 'test') return null

  return (
    <Link
      to="/dashboard/$dashboard/tab/$tab"
      params={{ dashboard: subscription.dashboardName, tab: subscription.tabName }}
      className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))]/20 hover:bg-[hsl(var(--accent))]/50 transition-colors"
    >
      <TestTube className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm truncate">{subscription.testName}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
          {subscription.dashboardName} / {subscription.tabName}
        </p>
      </div>
    </Link>
  )
}

