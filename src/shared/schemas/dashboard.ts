import { z } from 'zod'

// Dashboard in a list
export const DashboardSchema = z.object({
  name: z.string(),
  link: z.string(),
  dashboard_group_name: z.string().optional(),
})

export type Dashboard = z.infer<typeof DashboardSchema>

// List of all dashboards
export const DashboardListResponseSchema = z.object({
  dashboards: z.array(DashboardSchema),
})

export type DashboardListResponse = z.infer<typeof DashboardListResponseSchema>

// Dashboard group
export const DashboardGroupSchema = z.object({
  name: z.string(),
  link: z.string(),
})

export type DashboardGroup = z.infer<typeof DashboardGroupSchema>

// List of all dashboard groups
export const DashboardGroupListResponseSchema = z.object({
  dashboard_groups: z.array(DashboardGroupSchema),
})

export type DashboardGroupListResponse = z.infer<typeof DashboardGroupListResponseSchema>

// Dashboards within a group
export const DashboardsInGroupResponseSchema = z.object({
  dashboards: z.array(
    z.object({
      name: z.string(),
      link: z.string(),
    })
  ),
})

export type DashboardsInGroupResponse = z.infer<typeof DashboardsInGroupResponseSchema>

// Overall status enum
export const OverallStatusSchema = z.enum(['PASSING', 'FLAKY', 'FAILING', 'STALE'])

export type OverallStatus = z.infer<typeof OverallStatusSchema>

// Tab status count map - API can return empty string as key
export const TabStatusCountSchema = z.record(z.string(), z.number())

export type TabStatusCount = z.infer<typeof TabStatusCountSchema>

// Dashboard summary
export const DashboardSummarySchema = z.object({
  name: z.string(),
  overall_status: OverallStatusSchema,
  tab_status_count: TabStatusCountSchema.optional(),
})

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>

// Dashboard summary response (single dashboard)
export const DashboardSummaryResponseSchema = z.object({
  dashboard_summary: DashboardSummarySchema,
})

export type DashboardSummaryResponse = z.infer<typeof DashboardSummaryResponseSchema>

// Dashboard summaries response (multiple dashboards in a group)
export const DashboardSummariesResponseSchema = z.object({
  dashboard_summaries: z.array(DashboardSummarySchema),
})

export type DashboardSummariesResponse = z.infer<typeof DashboardSummariesResponseSchema>
