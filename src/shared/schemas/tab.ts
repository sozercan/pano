import { z } from 'zod'
import { OverallStatusSchema } from './dashboard'

// Tab in a list
export const TabSchema = z.object({
  name: z.string(),
  link: z.string(),
})

export type Tab = z.infer<typeof TabSchema>

// List of tabs in a dashboard
export const TabListResponseSchema = z.object({
  dashboard_tabs: z.array(TabSchema),
})

export type TabListResponse = z.infer<typeof TabListResponseSchema>

// Tab summary
export const TabSummarySchema = z.object({
  dashboard_name: z.string(),
  tab_name: z.string(),
  overall_status: OverallStatusSchema,
  detailed_status_message: z.string().optional(),
  last_run_timestamp: z.string().optional(),
  last_update_timestamp: z.string().optional(),
  latest_passing_build: z.string().optional(),
})

export type TabSummary = z.infer<typeof TabSummarySchema>

// Tab summaries response (multiple tabs)
export const TabSummariesResponseSchema = z.object({
  tab_summaries: z.array(TabSummarySchema),
})

export type TabSummariesResponse = z.infer<typeof TabSummariesResponseSchema>

// Single tab summary response
export const TabSummaryResponseSchema = z.object({
  tab_summary: TabSummarySchema,
})

export type TabSummaryResponse = z.infer<typeof TabSummaryResponseSchema>
