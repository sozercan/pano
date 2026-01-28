package client

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"testing"
)

// mockHTTPClient is a mock implementation of HTTPClient
type mockHTTPClient struct {
	response *http.Response
	err      error
}

func (m *mockHTTPClient) Do(req *http.Request) (*http.Response, error) {
	return m.response, m.err
}

func newMockResponse(statusCode int, body string) *http.Response {
	return &http.Response{
		StatusCode: statusCode,
		Body:       io.NopCloser(bytes.NewBufferString(body)),
		Header:     make(http.Header),
	}
}

func TestListDashboards(t *testing.T) {
	mockResp := `{
		"dashboards": [
			{"name": "sig-release-master-blocking", "link": "/dashboards/sigreleasemasterblocking", "dashboard_group_name": "sig-release"},
			{"name": "sig-node-release", "link": "/dashboards/signoderelease", "dashboard_group_name": "sig-node"}
		]
	}`

	mock := &mockHTTPClient{
		response: newMockResponse(http.StatusOK, mockResp),
	}

	client := New(WithHTTPClient(mock))
	resp, err := client.ListDashboards(context.Background())

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(resp.Dashboards) != 2 {
		t.Errorf("expected 2 dashboards, got %d", len(resp.Dashboards))
	}

	if resp.Dashboards[0].Name != "sig-release-master-blocking" {
		t.Errorf("expected first dashboard name 'sig-release-master-blocking', got '%s'", resp.Dashboards[0].Name)
	}

	if resp.Dashboards[0].DashboardGroupName != "sig-release" {
		t.Errorf("expected first dashboard group 'sig-release', got '%s'", resp.Dashboards[0].DashboardGroupName)
	}
}

func TestListDashboardGroups(t *testing.T) {
	mockResp := `{
		"dashboard_groups": [
			{"name": "sig-release", "link": "/dashboard-groups/sigrelease"},
			{"name": "sig-node", "link": "/dashboard-groups/signode"}
		]
	}`

	mock := &mockHTTPClient{
		response: newMockResponse(http.StatusOK, mockResp),
	}

	client := New(WithHTTPClient(mock))
	resp, err := client.ListDashboardGroups(context.Background())

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(resp.DashboardGroups) != 2 {
		t.Errorf("expected 2 groups, got %d", len(resp.DashboardGroups))
	}

	if resp.DashboardGroups[0].Name != "sig-release" {
		t.Errorf("expected first group name 'sig-release', got '%s'", resp.DashboardGroups[0].Name)
	}
}

func TestGetGroupDashboards(t *testing.T) {
	mockResp := `{
		"dashboards": [
			{"name": "sig-release-1.35-blocking", "link": "/dashboards/sigrelease135blocking"},
			{"name": "sig-release-master-blocking", "link": "/dashboards/sigreleasemasterblocking"}
		]
	}`

	mock := &mockHTTPClient{
		response: newMockResponse(http.StatusOK, mockResp),
	}

	client := New(WithHTTPClient(mock))
	resp, err := client.GetGroupDashboards(context.Background(), "sig-release")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(resp.Dashboards) != 2 {
		t.Errorf("expected 2 dashboards, got %d", len(resp.Dashboards))
	}
}

func TestGetDashboardSummary(t *testing.T) {
	mockResp := `{
		"dashboard_summary": {
			"name": "sig-release-master-blocking",
			"overall_status": "FLAKY",
			"tab_status_count": {
				"FLAKY": 4,
				"PASSING": 18
			}
		}
	}`

	mock := &mockHTTPClient{
		response: newMockResponse(http.StatusOK, mockResp),
	}

	client := New(WithHTTPClient(mock))
	resp, err := client.GetDashboardSummary(context.Background(), "sig-release-master-blocking")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.DashboardSummary.Name != "sig-release-master-blocking" {
		t.Errorf("expected dashboard name 'sig-release-master-blocking', got '%s'", resp.DashboardSummary.Name)
	}

	if resp.DashboardSummary.OverallStatus != "FLAKY" {
		t.Errorf("expected status 'FLAKY', got '%s'", resp.DashboardSummary.OverallStatus)
	}

	if resp.DashboardSummary.TabStatusCount["PASSING"] != 18 {
		t.Errorf("expected 18 passing tabs, got %d", resp.DashboardSummary.TabStatusCount["PASSING"])
	}
}

func TestListTabSummaries(t *testing.T) {
	mockResp := `{
		"tab_summaries": [
			{
				"dashboard_name": "sig-release-master-blocking",
				"tab_name": "kind-master",
				"overall_status": "PASSING",
				"detailed_status_message": "Tab stats: 10 of 10 (100.0%) recent columns passed",
				"last_run_timestamp": "2026-01-28T18:16:55Z",
				"last_update_timestamp": "2026-01-28T18:47:50Z",
				"latest_passing_build": "a57b4befd"
			}
		]
	}`

	mock := &mockHTTPClient{
		response: newMockResponse(http.StatusOK, mockResp),
	}

	client := New(WithHTTPClient(mock))
	resp, err := client.ListTabSummaries(context.Background(), "sig-release-master-blocking")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(resp.TabSummaries) != 1 {
		t.Errorf("expected 1 tab summary, got %d", len(resp.TabSummaries))
	}

	ts := resp.TabSummaries[0]
	if ts.TabName != "kind-master" {
		t.Errorf("expected tab name 'kind-master', got '%s'", ts.TabName)
	}

	if ts.OverallStatus != "PASSING" {
		t.Errorf("expected status 'PASSING', got '%s'", ts.OverallStatus)
	}
}

func TestGetTabHeaders(t *testing.T) {
	mockResp := `{
		"headers": [
			{
				"build": "2016584716093755392",
				"started": "2026-01-28T18:50:37Z",
				"extra": [""]
			},
			{
				"build": "2016569868328898560",
				"started": "2026-01-28T17:51:37Z",
				"extra": ["a57b4befd"]
			}
		]
	}`

	mock := &mockHTTPClient{
		response: newMockResponse(http.StatusOK, mockResp),
	}

	client := New(WithHTTPClient(mock))
	resp, err := client.GetTabHeaders(context.Background(), "sig-release-master-blocking", "gce-cos-master-default")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(resp.Headers) != 2 {
		t.Errorf("expected 2 headers, got %d", len(resp.Headers))
	}

	if resp.Headers[0].Build != "2016584716093755392" {
		t.Errorf("expected first build ID '2016584716093755392', got '%s'", resp.Headers[0].Build)
	}
}

func TestGetTabRows(t *testing.T) {
	mockResp := `{
		"rows": [
			{
				"name": "Kubernetes e2e suite.[It] [sig-api-machinery] test",
				"cells": [
					{},
					{"result": 1},
					{"result": 2, "message": "failed", "icon": "F"}
				]
			}
		]
	}`

	mock := &mockHTTPClient{
		response: newMockResponse(http.StatusOK, mockResp),
	}

	client := New(WithHTTPClient(mock))
	resp, err := client.GetTabRows(context.Background(), "sig-release-master-blocking", "gce-cos-master-default")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(resp.Rows) != 1 {
		t.Errorf("expected 1 row, got %d", len(resp.Rows))
	}

	row := resp.Rows[0]
	if len(row.Cells) != 3 {
		t.Errorf("expected 3 cells, got %d", len(row.Cells))
	}

	if row.Cells[1].Result != CellResultPass {
		t.Errorf("expected cell 1 result PASS (1), got %d", row.Cells[1].Result)
	}

	if row.Cells[2].Result != CellResultFail {
		t.Errorf("expected cell 2 result FAIL (2), got %d", row.Cells[2].Result)
	}
}

func TestAPIError(t *testing.T) {
	mock := &mockHTTPClient{
		response: newMockResponse(http.StatusNotFound, "dashboard not found"),
	}

	client := New(WithHTTPClient(mock))
	_, err := client.ListDashboards(context.Background())

	if err == nil {
		t.Fatal("expected error for 404 response")
	}

	expectedMsg := "API error: status 404"
	if !bytes.Contains([]byte(err.Error()), []byte(expectedMsg)) {
		t.Errorf("expected error to contain '%s', got '%s'", expectedMsg, err.Error())
	}
}

func TestWithBaseURL(t *testing.T) {
	customURL := "https://custom-testgrid.example.com"
	client := New(WithBaseURL(customURL))

	if client.baseURL != customURL {
		t.Errorf("expected base URL '%s', got '%s'", customURL, client.baseURL)
	}
}

func TestCellResultString(t *testing.T) {
	tests := []struct {
		result   int
		expected string
	}{
		{CellResultEmpty, "EMPTY"},
		{CellResultPass, "PASS"},
		{CellResultFail, "FAIL"},
		{CellResultSkipped, "SKIPPED"},
		{CellResultTruncated, "TRUNCATED"},
		{99, "UNKNOWN"},
	}

	for _, tt := range tests {
		got := CellResultString(tt.result)
		if got != tt.expected {
			t.Errorf("CellResultString(%d) = '%s', expected '%s'", tt.result, got, tt.expected)
		}
	}
}
