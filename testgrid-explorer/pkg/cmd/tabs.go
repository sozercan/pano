package cmd

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/sozercan/testgrid-explorer/pkg/client"
	"github.com/sozercan/testgrid-explorer/pkg/output"
	"github.com/spf13/cobra"
)

var (
	filterStatus string
	limitRows    int
)

var tabsCmd = &cobra.Command{
	Use:     "tabs",
	Aliases: []string{"tab", "t"},
	Short:   "Manage dashboard tabs",
	Long:    "Commands for listing and inspecting dashboard tabs and their test results.",
}

var tabsListCmd = &cobra.Command{
	Use:   "list <dashboard>",
	Short: "List tabs in a dashboard",
	Long:  "List all tabs belonging to a specific dashboard.",
	Args:  cobra.ExactArgs(1),
	Example: `  # List tabs in a dashboard
  testgrid tabs list sig-release-master-blocking`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		dashboard := args[0]

		resp, err := apiClient.ListDashboardTabs(ctx, dashboard)
		if err != nil {
			return fmt.Errorf("failed to list tabs: %w", err)
		}

		return formatter.Print(resp, func(w io.Writer) error {
			tw := output.TableWriter(w)
			output.PrintRow(tw, "NAME", "LINK")
			for _, t := range resp.DashboardTabs {
				output.PrintRow(tw, t.Name, t.Link)
			}
			return tw.Flush()
		})
	},
}

var tabsSummariesCmd = &cobra.Command{
	Use:   "summaries <dashboard>",
	Short: "List tab summaries for a dashboard",
	Long:  "Get health summaries for all tabs in a dashboard.",
	Args:  cobra.ExactArgs(1),
	Example: `  # List tab summaries
  testgrid tabs summaries sig-release-master-blocking

  # Filter by status
  testgrid tabs summaries sig-release-master-blocking --status=FAILING`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		dashboard := args[0]

		resp, err := apiClient.ListTabSummaries(ctx, dashboard)
		if err != nil {
			return fmt.Errorf("failed to list tab summaries: %w", err)
		}

		// Filter by status if specified
		filtered := resp.TabSummaries
		if filterStatus != "" {
			filtered = []client.TabSummary{}
			for _, s := range resp.TabSummaries {
				if strings.EqualFold(s.OverallStatus, filterStatus) {
					filtered = append(filtered, s)
				}
			}
		}

		return formatter.Print(resp, func(w io.Writer) error {
			tw := output.TableWriter(w)
			output.PrintRow(tw, "TAB", "STATUS", "LAST RUN", "MESSAGE")
			for _, s := range filtered {
				msg := output.TruncateString(s.DetailedStatusMessage, 50)
				output.PrintRow(tw, s.TabName, output.ColorStatus(s.OverallStatus), s.LastRunTimestamp, msg)
			}
			return tw.Flush()
		})
	},
}

var tabsSummaryCmd = &cobra.Command{
	Use:   "summary <dashboard> <tab>",
	Short: "Get summary for a specific tab",
	Long:  "Get detailed summary for a specific tab.",
	Args:  cobra.ExactArgs(2),
	Example: `  # Get tab summary
  testgrid tabs summary sig-release-master-blocking kind-master`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		dashboard := args[0]
		tab := args[1]

		resp, err := apiClient.GetTabSummary(ctx, dashboard, tab)
		if err != nil {
			return fmt.Errorf("failed to get tab summary: %w", err)
		}

		return formatter.Print(resp, func(w io.Writer) error {
			s := resp.TabSummary
			fmt.Fprintf(w, "Dashboard:    %s\n", s.DashboardName)
			fmt.Fprintf(w, "Tab:          %s\n", s.TabName)
			fmt.Fprintf(w, "Status:       %s\n", output.ColorStatus(s.OverallStatus))
			fmt.Fprintf(w, "Last Run:     %s\n", s.LastRunTimestamp)
			fmt.Fprintf(w, "Last Update:  %s\n", s.LastUpdateTimestamp)
			fmt.Fprintf(w, "Latest Pass:  %s\n", s.LatestPassingBuild)
			fmt.Fprintln(w)
			fmt.Fprintf(w, "Details: %s\n", s.DetailedStatusMessage)
			return nil
		})
	},
}

var tabsHeadersCmd = &cobra.Command{
	Use:   "headers <dashboard> <tab>",
	Short: "Get headers (columns) for a tab",
	Long:  "Get build/column information for a tab's test grid.",
	Args:  cobra.ExactArgs(2),
	Example: `  # Get tab headers
  testgrid tabs headers sig-release-master-blocking gce-cos-master-default`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		dashboard := args[0]
		tab := args[1]

		resp, err := apiClient.GetTabHeaders(ctx, dashboard, tab)
		if err != nil {
			return fmt.Errorf("failed to get tab headers: %w", err)
		}

		return formatter.Print(resp, func(w io.Writer) error {
			tw := output.TableWriter(w)
			output.PrintRow(tw, "BUILD", "STARTED", "EXTRA")
			for _, h := range resp.Headers {
				extra := strings.Join(h.Extra, ", ")
				output.PrintRow(tw, h.Build, h.Started, extra)
			}
			return tw.Flush()
		})
	},
}

var tabsRowsCmd = &cobra.Command{
	Use:   "rows <dashboard> <tab>",
	Short: "Get rows (test results) for a tab",
	Long: `Get test results matrix for a tab.

Note: This can return large amounts of data. Use --limit to restrict output.`,
	Args: cobra.ExactArgs(2),
	Example: `  # Get all rows
  testgrid tabs rows sig-release-master-blocking gce-cos-master-default

  # Limit to first 10 rows
  testgrid tabs rows sig-release-master-blocking gce-cos-master-default --limit=10

  # Filter to failing tests only
  testgrid tabs rows sig-release-master-blocking gce-cos-master-default --status=FAIL`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		dashboard := args[0]
		tab := args[1]

		resp, err := apiClient.GetTabRows(ctx, dashboard, tab)
		if err != nil {
			return fmt.Errorf("failed to get tab rows: %w", err)
		}

		// Filter by status if specified
		filtered := resp.Rows
		if filterStatus != "" {
			targetResult := statusToResult(filterStatus)
			filtered = []client.Row{}
			for _, r := range resp.Rows {
				for _, c := range r.Cells {
					if c.Result == targetResult {
						filtered = append(filtered, r)
						break
					}
				}
			}
		}

		// Apply limit
		if limitRows > 0 && len(filtered) > limitRows {
			filtered = filtered[:limitRows]
		}

		return formatter.Print(resp, func(w io.Writer) error {
			tw := output.TableWriter(w)
			output.PrintRow(tw, "TEST NAME", "RESULTS (recent → old)")
			for _, r := range filtered {
				results := formatCellResults(r.Cells, 20)
				name := output.TruncateString(r.Name, 80)
				output.PrintRow(tw, name, results)
			}
			tw.Flush()
			fmt.Fprintf(w, "\nShowing %d of %d rows\n", len(filtered), len(resp.Rows))
			return nil
		})
	},
}

func statusToResult(status string) int {
	switch strings.ToUpper(status) {
	case "PASS", "PASSING":
		return client.CellResultPass
	case "FAIL", "FAILING":
		return client.CellResultFail
	case "SKIP", "SKIPPED":
		return client.CellResultSkipped
	default:
		return -1
	}
}

func formatCellResults(cells []client.Cell, maxCells int) string {
	var sb strings.Builder
	count := len(cells)
	if count > maxCells {
		count = maxCells
	}

	for i := 0; i < count; i++ {
		c := cells[i]
		switch c.Result {
		case client.CellResultPass:
			sb.WriteString("\033[32m✓\033[0m")
		case client.CellResultFail:
			sb.WriteString("\033[31m✗\033[0m")
		case client.CellResultSkipped:
			sb.WriteString("\033[90m-\033[0m")
		case client.CellResultTruncated:
			sb.WriteString("…")
		default:
			sb.WriteString("·")
		}
	}

	if len(cells) > maxCells {
		sb.WriteString(fmt.Sprintf(" (+%d more)", len(cells)-maxCells))
	}

	return sb.String()
}

func init() {
	rootCmd.AddCommand(tabsCmd)
	tabsCmd.AddCommand(tabsListCmd)
	tabsCmd.AddCommand(tabsSummariesCmd)
	tabsCmd.AddCommand(tabsSummaryCmd)
	tabsCmd.AddCommand(tabsHeadersCmd)
	tabsCmd.AddCommand(tabsRowsCmd)

	// Add filter flags to relevant commands
	tabsSummariesCmd.Flags().StringVar(&filterStatus, "status", "", "Filter by status (PASSING, FAILING, FLAKY, STALE)")
	tabsRowsCmd.Flags().StringVar(&filterStatus, "status", "", "Filter by cell status (PASS, FAIL, SKIP)")
	tabsRowsCmd.Flags().IntVar(&limitRows, "limit", 0, "Limit number of rows returned")
}
