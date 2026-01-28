import { useQuery } from '@tanstack/react-query'
import { api } from '@frontend/lib/api-client'
import type { OverallStatus } from '@shared/schemas'

// Query keys
export const queryKeys = {
  dashboardGroups: ['dashboardGroups'] as const,
  dashboardsInGroup: (group: string) => ['dashboardsInGroup', group] as const,
  dashboardSummariesInGroup: (group: string) => ['dashboardSummariesInGroup', group] as const,
  dashboardSummary: (dashboard: string) => ['dashboardSummary', dashboard] as const,
  tabs: (dashboard: string) => ['tabs', dashboard] as const,
  tabSummaries: (dashboard: string) => ['tabSummaries', dashboard] as const,
  tabSummary: (dashboard: string, tab: string) => ['tabSummary', dashboard, tab] as const,
  headers: (dashboard: string, tab: string) => ['headers', dashboard, tab] as const,
  rows: (dashboard: string, tab: string) => ['rows', dashboard, tab] as const,
}

// Dashboard Groups
export function useDashboardGroups() {
  return useQuery({
    queryKey: queryKeys.dashboardGroups,
    queryFn: () => api.getDashboardGroups(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Dashboards in a group
export function useDashboardsInGroup(group: string) {
  return useQuery({
    queryKey: queryKeys.dashboardsInGroup(group),
    queryFn: () => api.getDashboardsInGroup(group),
    staleTime: 5 * 60 * 1000,
    enabled: !!group,
  })
}

// Dashboard summaries in a group (includes status)
export function useDashboardSummariesInGroup(
  group: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.dashboardSummariesInGroup(group),
    queryFn: () => api.getDashboardSummariesInGroup(group),
    staleTime: 1 * 60 * 1000, // 1 minute for status data
    enabled: !!group && (options?.enabled ?? true),
  })
}

// Single dashboard summary
export function useDashboardSummary(dashboard: string) {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(dashboard),
    queryFn: () => api.getDashboardSummary(dashboard),
    staleTime: 1 * 60 * 1000,
    enabled: !!dashboard,
  })
}

// Tabs in a dashboard
export function useTabs(dashboard: string) {
  return useQuery({
    queryKey: queryKeys.tabs(dashboard),
    queryFn: () => api.getTabs(dashboard),
    staleTime: 5 * 60 * 1000,
    enabled: !!dashboard,
  })
}

// Tab summaries for a dashboard
export function useTabSummaries(dashboard: string) {
  return useQuery({
    queryKey: queryKeys.tabSummaries(dashboard),
    queryFn: () => api.getTabSummaries(dashboard),
    staleTime: 1 * 60 * 1000,
    enabled: !!dashboard,
  })
}

// Single tab summary
export function useTabSummary(dashboard: string, tab: string) {
  return useQuery({
    queryKey: queryKeys.tabSummary(dashboard, tab),
    queryFn: () => api.getTabSummary(dashboard, tab),
    staleTime: 1 * 60 * 1000,
    enabled: !!dashboard && !!tab,
  })
}

// Grid headers
export function useHeaders(dashboard: string, tab: string) {
  return useQuery({
    queryKey: queryKeys.headers(dashboard, tab),
    queryFn: () => api.getHeaders(dashboard, tab),
    staleTime: 1 * 60 * 1000,
    enabled: !!dashboard && !!tab,
  })
}

// Grid rows
export function useRows(dashboard: string, tab: string) {
  return useQuery({
    queryKey: queryKeys.rows(dashboard, tab),
    queryFn: () => api.getRows(dashboard, tab),
    staleTime: 1 * 60 * 1000,
    enabled: !!dashboard && !!tab,
  })
}

// Helper to get worst status from a list
export function getWorstStatus(statuses: OverallStatus[]): OverallStatus {
  const priority: Record<OverallStatus, number> = {
    FAILING: 0,
    FLAKY: 1,
    STALE: 2,
    PASSING: 3,
  }

  return statuses.reduce((worst, current) => {
    return priority[current] < priority[worst] ? current : worst
  }, 'PASSING' as OverallStatus)
}
