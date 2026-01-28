package cmd

import (
	"context"
	"fmt"
	"io"

	"github.com/sozercan/testgrid-explorer/pkg/output"
	"github.com/spf13/cobra"
)

var dashboardsCmd = &cobra.Command{
	Use:     "dashboards",
	Aliases: []string{"dash", "d"},
	Short:   "Manage dashboards",
	Long:    "Commands for listing and inspecting dashboards.",
}

var dashboardsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all dashboards",
	Long:  "List all dashboards across all groups.",
	Example: `  # List all dashboards
  testgrid dashboards list

  # List dashboards as JSON
  testgrid dashboards list -o json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		resp, err := apiClient.ListDashboards(ctx)
		if err != nil {
			return fmt.Errorf("failed to list dashboards: %w", err)
		}

		return formatter.Print(resp, func(w io.Writer) error {
			tw := output.TableWriter(w)
			output.PrintRow(tw, "NAME", "GROUP")
			for _, d := range resp.Dashboards {
				output.PrintRow(tw, d.Name, d.DashboardGroupName)
			}
			return tw.Flush()
		})
	},
}

var dashboardsGetCmd = &cobra.Command{
	Use:   "get <dashboard>",
	Short: "Get dashboard configuration",
	Long:  "Get the configuration for a specific dashboard.",
	Args:  cobra.ExactArgs(1),
	Example: `  # Get dashboard configuration
  testgrid dashboards get sig-release-master-blocking`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		dashboard := args[0]

		resp, err := apiClient.GetDashboardConfig(ctx, dashboard)
		if err != nil {
			return fmt.Errorf("failed to get dashboard config: %w", err)
		}

		return formatter.Print(resp, func(w io.Writer) error {
			if len(*resp) == 0 {
				fmt.Fprintln(w, "No configuration found (empty response)")
				return nil
			}
			tw := output.TableWriter(w)
			output.PrintRow(tw, "KEY", "VALUE")
			for k, v := range *resp {
				output.PrintRow(tw, k, fmt.Sprintf("%v", v))
			}
			return tw.Flush()
		})
	},
}

var dashboardsSummaryCmd = &cobra.Command{
	Use:   "summary <dashboard>",
	Short: "Get dashboard summary",
	Long:  "Get the summary and health status for a specific dashboard.",
	Args:  cobra.ExactArgs(1),
	Example: `  # Get dashboard summary
  testgrid dashboards summary sig-release-master-blocking`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		dashboard := args[0]

		resp, err := apiClient.GetDashboardSummary(ctx, dashboard)
		if err != nil {
			return fmt.Errorf("failed to get dashboard summary: %w", err)
		}

		return formatter.Print(resp, func(w io.Writer) error {
			s := resp.DashboardSummary
			fmt.Fprintf(w, "Dashboard: %s\n", s.Name)
			fmt.Fprintf(w, "Status:    %s\n", output.ColorStatus(s.OverallStatus))
			fmt.Fprintln(w)

			if len(s.TabStatusCount) > 0 {
				fmt.Fprintln(w, "Tab Status Counts:")
				tw := output.TableWriter(w)
				for status, count := range s.TabStatusCount {
					output.PrintRow(tw, "  "+output.ColorStatus(status), fmt.Sprintf("%d", count))
				}
				tw.Flush()
			}
			return nil
		})
	},
}

func init() {
	rootCmd.AddCommand(dashboardsCmd)
	dashboardsCmd.AddCommand(dashboardsListCmd)
	dashboardsCmd.AddCommand(dashboardsGetCmd)
	dashboardsCmd.AddCommand(dashboardsSummaryCmd)
}
