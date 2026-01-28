package client

import "time"

// Dashboard represents a single dashboard
type Dashboard struct {
	Name               string `json:"name"`
	Link               string `json:"link"`
	DashboardGroupName string `json:"dashboard_group_name,omitempty"`
}

// DashboardsResponse is the response from GET /api/v1/dashboards
type DashboardsResponse struct {
	Dashboards []Dashboard `json:"dashboards"`
}

// DashboardGroup represents a dashboard group
type DashboardGroup struct {
	Name string `json:"name"`
	Link string `json:"link"`
}

// DashboardGroupsResponse is the response from GET /api/v1/dashboard-groups
type DashboardGroupsResponse struct {
	DashboardGroups []DashboardGroup `json:"dashboard_groups"`
}

// GroupDashboardsResponse is the response from GET /api/v1/dashboard-groups/{group}
type GroupDashboardsResponse struct {
	Dashboards []Dashboard `json:"dashboards"`
}

// DashboardTab represents a tab within a dashboard
type DashboardTab struct {
	Name string `json:"name"`
	Link string `json:"link"`
}

// TabsResponse is the response from GET /api/v1/dashboards/{dashboard}/tabs
type TabsResponse struct {
	DashboardTabs []DashboardTab `json:"dashboard_tabs"`
}

// TabSummary represents the summary of a tab
type TabSummary struct {
	DashboardName         string `json:"dashboard_name"`
	TabName               string `json:"tab_name"`
	OverallStatus         string `json:"overall_status"`
	DetailedStatusMessage string `json:"detailed_status_message,omitempty"`
	LastRunTimestamp      string `json:"last_run_timestamp,omitempty"`
	LastUpdateTimestamp   string `json:"last_update_timestamp,omitempty"`
	LatestPassingBuild    string `json:"latest_passing_build,omitempty"`
}

// TabSummariesResponse is the response from GET /api/v1/dashboards/{dashboard}/tab-summaries
type TabSummariesResponse struct {
	TabSummaries []TabSummary `json:"tab_summaries"`
}

// TabSummaryResponse is the response from GET /api/v1/dashboards/{dashboard}/tab-summaries/{tab}
type TabSummaryResponse struct {
	TabSummary TabSummary `json:"tab_summary"`
}

// DashboardSummary represents the summary of a dashboard
type DashboardSummary struct {
	Name           string         `json:"name"`
	OverallStatus  string         `json:"overall_status"`
	TabStatusCount map[string]int `json:"tab_status_count,omitempty"`
}

// DashboardSummariesResponse is the response from GET /api/v1/dashboard-groups/{group}/dashboard-summaries
type DashboardSummariesResponse struct {
	DashboardSummaries []DashboardSummary `json:"dashboard_summaries"`
}

// DashboardSummaryResponse is the response from GET /api/v1/dashboards/{dashboard}/summary
type DashboardSummaryResponse struct {
	DashboardSummary DashboardSummary `json:"dashboard_summary"`
}

// DashboardConfigResponse is the response from GET /api/v1/dashboards/{dashboard}
// Often returns empty object
type DashboardConfigResponse map[string]interface{}

// Header represents a column header (build info)
type Header struct {
	Build   string   `json:"build"`
	Started string   `json:"started,omitempty"`
	Extra   []string `json:"extra,omitempty"`
}

// HeadersResponse is the response from GET /api/v1/dashboards/{dashboard}/tabs/{tab}/headers
type HeadersResponse struct {
	Headers []Header `json:"headers"`
}

// Cell represents a single test result cell
type Cell struct {
	Result  int    `json:"result,omitempty"`
	Message string `json:"message,omitempty"`
	Icon    string `json:"icon,omitempty"`
}

// CellResult constants
const (
	CellResultEmpty     = 0
	CellResultPass      = 1
	CellResultFail      = 2
	CellResultSkipped   = 3
	CellResultTruncated = 6
)

// CellResultString returns a human-readable string for a cell result
func CellResultString(result int) string {
	switch result {
	case CellResultEmpty:
		return "EMPTY"
	case CellResultPass:
		return "PASS"
	case CellResultFail:
		return "FAIL"
	case CellResultSkipped:
		return "SKIPPED"
	case CellResultTruncated:
		return "TRUNCATED"
	default:
		return "UNKNOWN"
	}
}

// Row represents a test row with its results
type Row struct {
	Name  string `json:"name"`
	Cells []Cell `json:"cells"`
}

// RowsResponse is the response from GET /api/v1/dashboards/{dashboard}/tabs/{tab}/rows
type RowsResponse struct {
	Rows []Row `json:"rows"`
}

// ParseTimestamp parses an ISO 8601 timestamp from the API
func ParseTimestamp(ts string) (time.Time, error) {
	return time.Parse(time.RFC3339, ts)
}
