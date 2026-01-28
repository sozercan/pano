import { useEffect, useRef } from 'react'
import { ChevronRight, Folder, FileText, Layers } from 'lucide-react'
import { Link, useParams } from '@tanstack/react-router'
import * as Accordion from '@radix-ui/react-accordion'
import { cn } from '@frontend/lib/cn'
import { useUIStore } from '@frontend/stores/uiStore'
import {
  useDashboardGroups,
  useDashboardSummariesInGroup,
  useTabSummaries,
  getWorstStatus,
} from '@frontend/hooks/useTestGridApi'
import { StatusBadge, StatusBadgeSkeleton } from '@frontend/components/dashboard/StatusBadge'
import type { OverallStatus } from '@shared/schemas'

export function AccordionNav() {
  const { data: groupsData, isLoading, error } = useDashboardGroups()
  const { expandedGroups, focusTarget, clearFocusTarget } = useUIStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to focus target after search selection
  useEffect(() => {
    if (!focusTarget || !containerRef.current) return

    // Small delay to allow expansion animations to complete
    const timeout = setTimeout(() => {
      let selector = ''
      if (focusTarget.type === 'group' && focusTarget.group) {
        selector = `[data-nav-group="${focusTarget.group}"]`
      } else if (focusTarget.type === 'dashboard' && focusTarget.dashboard) {
        selector = `[data-nav-dashboard="${focusTarget.dashboard}"]`
      } else if (focusTarget.type === 'tab' && focusTarget.tab) {
        selector = `[data-nav-tab="${focusTarget.tab}"]`
      }

      if (selector) {
        const element = containerRef.current?.querySelector(selector)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      clearFocusTarget()
    }, 150)

    return () => clearTimeout(timeout)
  }, [focusTarget, clearFocusTarget])

  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 rounded-md bg-[hsl(var(--muted))] animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500">
        Failed to load dashboard groups
      </div>
    )
  }

  const groups = groupsData?.dashboard_groups ?? []

  return (
    <div ref={containerRef}>
      <Accordion.Root
        type="multiple"
        value={expandedGroups}
        onValueChange={() => {
          // Handle toggle manually in GroupItem to avoid re-setting all values
        }}
        className="p-2"
      >
        {groups.map((group) => (
          <GroupItem key={group.name} groupName={group.name} />
        ))}
      </Accordion.Root>
    </div>
  )
}

function GroupItem({ groupName }: { groupName: string }) {
  const { expandedGroups, toggleGroup, expandedDashboards, toggleDashboard } = useUIStore()
  const isExpanded = expandedGroups.includes(groupName)

  // Only fetch dashboard summaries when expanded (lazy loading for performance)
  const { data: summariesData, isLoading } = useDashboardSummariesInGroup(groupName, {
    enabled: isExpanded,
  })

  // Calculate worst status for the group (only available after expanding)
  const groupStatus: OverallStatus | undefined = summariesData?.dashboard_summaries
    ? getWorstStatus(summariesData.dashboard_summaries.map((d) => d.overall_status))
    : undefined

  return (
    <Accordion.Item value={groupName} className="border-b border-[hsl(var(--border))] last:border-0">
      <Accordion.Header>
        <Accordion.Trigger
          onClick={() => toggleGroup(groupName)}
          data-nav-group={groupName}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[hsl(var(--accent))]',
            isExpanded && 'bg-[hsl(var(--accent))]'
          )}
        >
          <ChevronRight
            className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')}
          />
          <Folder className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
          <span className="flex-1 truncate text-left">{groupName}</span>
          {isExpanded && isLoading ? <StatusBadgeSkeleton size="sm" /> : groupStatus && <StatusBadge status={groupStatus} size="sm" />}
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        {isExpanded && (
          <GroupDashboards
            summaries={summariesData?.dashboard_summaries}
            expandedDashboards={expandedDashboards}
            toggleDashboard={toggleDashboard}
          />
        )}
      </Accordion.Content>
    </Accordion.Item>
  )
}

function GroupDashboards({
  summaries,
  expandedDashboards,
  toggleDashboard,
}: {
  summaries?: { name: string; overall_status: OverallStatus }[]
  expandedDashboards: string[]
  toggleDashboard: (name: string) => void
}) {
  if (!summaries) {
    return (
      <div className="ml-6 py-2 space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 rounded-md bg-[hsl(var(--muted))] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="ml-4 border-l border-[hsl(var(--border))] py-1">
      {summaries.map((dashboard) => (
        <DashboardItem
          key={dashboard.name}
          dashboardName={dashboard.name}
          status={dashboard.overall_status}
          isExpanded={expandedDashboards.includes(dashboard.name)}
          onToggle={() => toggleDashboard(dashboard.name)}
        />
      ))}
    </div>
  )
}

function DashboardItem({
  dashboardName,
  status,
  isExpanded,
  onToggle,
}: {
  dashboardName: string
  status: OverallStatus
  isExpanded: boolean
  onToggle: () => void
}) {
  const params = useParams({ strict: false })
  const isActive = params.dashboard === dashboardName

  return (
    <div>
      <div
        data-nav-dashboard={dashboardName}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer',
          'hover:bg-[hsl(var(--accent))]',
          isActive && 'bg-[hsl(var(--accent))]'
        )}
      >
        <button onClick={onToggle} className="p-0.5 -ml-0.5">
          <ChevronRight
            className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')}
          />
        </button>
        <Layers className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
        <Link
          to="/dashboard/$dashboard"
          params={{ dashboard: dashboardName }}
          className="flex-1 truncate"
        >
          {dashboardName}
        </Link>
        <StatusBadge status={status} size="sm" />
      </div>

      {isExpanded && <DashboardTabs dashboardName={dashboardName} />}
    </div>
  )
}

function DashboardTabs({ dashboardName }: { dashboardName: string }) {
  const { data, isLoading } = useTabSummaries(dashboardName)
  const params = useParams({ strict: false })

  if (isLoading) {
    return (
      <div className="ml-6 py-1 space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 rounded-md bg-[hsl(var(--muted))] animate-pulse" />
        ))}
      </div>
    )
  }

  const tabs = data?.tab_summaries ?? []

  return (
    <div className="ml-5 border-l border-[hsl(var(--border))] py-1">
      {tabs.map((tab) => {
        const isActive = params.dashboard === dashboardName && params.tab === tab.tab_name
        return (
          <Link
            key={tab.tab_name}
            to="/dashboard/$dashboard/tab/$tab"
            params={{ dashboard: dashboardName, tab: tab.tab_name }}
            data-nav-tab={tab.tab_name}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1 text-sm',
              'hover:bg-[hsl(var(--accent))]',
              isActive && 'bg-[hsl(var(--accent))]'
            )}
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
            <span className="flex-1 truncate">{tab.tab_name}</span>
            <StatusBadge status={tab.overall_status} size="sm" />
          </Link>
        )
      })}
    </div>
  )
}
