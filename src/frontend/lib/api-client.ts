import {
  DashboardGroupListResponseSchema,
  DashboardsInGroupResponseSchema,
  DashboardSummaryResponseSchema,
  DashboardSummariesResponseSchema,
  TabListResponseSchema,
  TabSummariesResponseSchema,
  TabSummaryResponseSchema,
  HeadersResponseSchema,
  RowsResponseSchema,
  type DashboardGroupListResponse,
  type DashboardsInGroupResponse,
  type DashboardSummaryResponse,
  type DashboardSummariesResponse,
  type TabListResponse,
  type TabSummariesResponse,
  type TabSummaryResponse,
  type HeadersResponse,
  type RowsResponse,
} from '@shared/schemas'

const API_BASE = 'https://testgrid-api.prow.k8s.io/api/v1'

// Custom URL encoding that handles TestGrid API quirks
// The TestGrid API doesn't properly decode percent-encoded commas (%2C)
// So we encode everything except commas which are left as-is
function encodePathParam(param: string): string {
  return encodeURIComponent(param).replace(/%2C/gi, ',')
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const DEFAULT_TIMEOUT_MS = 30000

async function fetchJson<T>(url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new ApiError(response.status, `API request failed: ${response.statusText}`)
    }
    return response.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, `Request timeout after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export const api = {
  // Dashboard Groups
  async getDashboardGroups(): Promise<DashboardGroupListResponse> {
    const data = await fetchJson<unknown>(`${API_BASE}/dashboard-groups`)
    return DashboardGroupListResponseSchema.parse(data)
  },

  async getDashboardsInGroup(group: string): Promise<DashboardsInGroupResponse> {
    const data = await fetchJson<unknown>(`${API_BASE}/dashboard-groups/${encodePathParam(group)}`)
    return DashboardsInGroupResponseSchema.parse(data)
  },

  async getDashboardSummariesInGroup(group: string): Promise<DashboardSummariesResponse> {
    const data = await fetchJson<unknown>(
      `${API_BASE}/dashboard-groups/${encodePathParam(group)}/dashboard-summaries`
    )
    return DashboardSummariesResponseSchema.parse(data)
  },

  // Dashboards
  async getDashboardSummary(dashboard: string): Promise<DashboardSummaryResponse> {
    const data = await fetchJson<unknown>(`${API_BASE}/dashboards/${encodePathParam(dashboard)}/summary`)
    return DashboardSummaryResponseSchema.parse(data)
  },

  // Tabs
  async getTabs(dashboard: string): Promise<TabListResponse> {
    const data = await fetchJson<unknown>(`${API_BASE}/dashboards/${encodePathParam(dashboard)}/tabs`)
    return TabListResponseSchema.parse(data)
  },

  async getTabSummaries(dashboard: string): Promise<TabSummariesResponse> {
    const data = await fetchJson<unknown>(`${API_BASE}/dashboards/${encodePathParam(dashboard)}/tab-summaries`)
    return TabSummariesResponseSchema.parse(data)
  },

  async getTabSummary(dashboard: string, tab: string): Promise<TabSummaryResponse> {
    const data = await fetchJson<unknown>(
      `${API_BASE}/dashboards/${encodePathParam(dashboard)}/tab-summaries/${encodePathParam(tab)}`
    )
    return TabSummaryResponseSchema.parse(data)
  },

  // Grid data
  async getHeaders(dashboard: string, tab: string): Promise<HeadersResponse> {
    const data = await fetchJson<unknown>(
      `${API_BASE}/dashboards/${encodePathParam(dashboard)}/tabs/${encodePathParam(tab)}/headers`
    )
    return HeadersResponseSchema.parse(data)
  },

  async getRows(dashboard: string, tab: string): Promise<RowsResponse> {
    const data = await fetchJson<unknown>(
      `${API_BASE}/dashboards/${encodePathParam(dashboard)}/tabs/${encodePathParam(tab)}/rows`
    )
    return RowsResponseSchema.parse(data)
  },
}

export { ApiError }
