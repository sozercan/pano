package client

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

const (
	DefaultBaseURL = "https://testgrid-api.prow.k8s.io"
	DefaultTimeout = 30 * time.Second
)

// HTTPClient interface for mocking
type HTTPClient interface {
	Do(req *http.Request) (*http.Response, error)
}

// Client is the TestGrid API client
type Client struct {
	baseURL    string
	httpClient HTTPClient
}

// Option is a functional option for Client
type Option func(*Client)

// WithBaseURL sets a custom base URL
func WithBaseURL(url string) Option {
	return func(c *Client) {
		c.baseURL = url
	}
}

// WithHTTPClient sets a custom HTTP client
func WithHTTPClient(hc HTTPClient) Option {
	return func(c *Client) {
		c.httpClient = hc
	}
}

// New creates a new TestGrid API client
func New(opts ...Option) *Client {
	c := &Client{
		baseURL: DefaultBaseURL,
		httpClient: &http.Client{
			Timeout: DefaultTimeout,
		},
	}
	for _, opt := range opts {
		opt(c)
	}
	return c
}

// doRequest performs an HTTP request and decodes the JSON response
func (c *Client) doRequest(ctx context.Context, path string, result interface{}) error {
	reqURL, err := url.JoinPath(c.baseURL, path)
	if err != nil {
		return fmt.Errorf("invalid URL: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error: status %d: %s", resp.StatusCode, string(body))
	}

	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		return fmt.Errorf("decoding response: %w", err)
	}

	return nil
}

// ListDashboards returns all dashboards
func (c *Client) ListDashboards(ctx context.Context) (*DashboardsResponse, error) {
	var resp DashboardsResponse
	if err := c.doRequest(ctx, "/api/v1/dashboards", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ListDashboardGroups returns all dashboard groups
func (c *Client) ListDashboardGroups(ctx context.Context) (*DashboardGroupsResponse, error) {
	var resp DashboardGroupsResponse
	if err := c.doRequest(ctx, "/api/v1/dashboard-groups", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetGroupDashboards returns dashboards in a specific group
func (c *Client) GetGroupDashboards(ctx context.Context, group string) (*GroupDashboardsResponse, error) {
	var resp GroupDashboardsResponse
	path := fmt.Sprintf("/api/v1/dashboard-groups/%s", url.PathEscape(group))
	if err := c.doRequest(ctx, path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetGroupDashboardSummaries returns dashboard summaries for a group
func (c *Client) GetGroupDashboardSummaries(ctx context.Context, group string) (*DashboardSummariesResponse, error) {
	var resp DashboardSummariesResponse
	path := fmt.Sprintf("/api/v1/dashboard-groups/%s/dashboard-summaries", url.PathEscape(group))
	if err := c.doRequest(ctx, path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetDashboardConfig returns dashboard configuration
func (c *Client) GetDashboardConfig(ctx context.Context, dashboard string) (*DashboardConfigResponse, error) {
	var resp DashboardConfigResponse
	path := fmt.Sprintf("/api/v1/dashboards/%s", url.PathEscape(dashboard))
	if err := c.doRequest(ctx, path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetDashboardSummary returns dashboard summary
func (c *Client) GetDashboardSummary(ctx context.Context, dashboard string) (*DashboardSummaryResponse, error) {
	var resp DashboardSummaryResponse
	path := fmt.Sprintf("/api/v1/dashboards/%s/summary", url.PathEscape(dashboard))
	if err := c.doRequest(ctx, path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ListDashboardTabs returns tabs for a dashboard
func (c *Client) ListDashboardTabs(ctx context.Context, dashboard string) (*TabsResponse, error) {
	var resp TabsResponse
	path := fmt.Sprintf("/api/v1/dashboards/%s/tabs", url.PathEscape(dashboard))
	if err := c.doRequest(ctx, path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ListTabSummaries returns tab summaries for a dashboard
func (c *Client) ListTabSummaries(ctx context.Context, dashboard string) (*TabSummariesResponse, error) {
	var resp TabSummariesResponse
	path := fmt.Sprintf("/api/v1/dashboards/%s/tab-summaries", url.PathEscape(dashboard))
	if err := c.doRequest(ctx, path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetTabSummary returns summary for a specific tab
func (c *Client) GetTabSummary(ctx context.Context, dashboard, tab string) (*TabSummaryResponse, error) {
	var resp TabSummaryResponse
	path := fmt.Sprintf("/api/v1/dashboards/%s/tab-summaries/%s", url.PathEscape(dashboard), url.PathEscape(tab))
	if err := c.doRequest(ctx, path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetTabHeaders returns headers (columns) for a tab
func (c *Client) GetTabHeaders(ctx context.Context, dashboard, tab string) (*HeadersResponse, error) {
	var resp HeadersResponse
	path := fmt.Sprintf("/api/v1/dashboards/%s/tabs/%s/headers", url.PathEscape(dashboard), url.PathEscape(tab))
	if err := c.doRequest(ctx, path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetTabRows returns rows (test results) for a tab
func (c *Client) GetTabRows(ctx context.Context, dashboard, tab string) (*RowsResponse, error) {
	var resp RowsResponse
	path := fmt.Sprintf("/api/v1/dashboards/%s/tabs/%s/rows", url.PathEscape(dashboard), url.PathEscape(tab))
	if err := c.doRequest(ctx, path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}
