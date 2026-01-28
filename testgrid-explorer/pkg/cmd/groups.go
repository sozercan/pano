package cmd

import (
	"context"
	"fmt"
	"io"

	"github.com/sozercan/testgrid-explorer/pkg/output"
	"github.com/spf13/cobra"
)

var groupsCmd = &cobra.Command{
	Use:     "groups",
	Aliases: []string{"group", "g"},
	Short:   "Manage dashboard groups",
	Long:    "Commands for listing and inspecting dashboard groups.",
}

var groupsListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all dashboard groups",
	Long:  "List all top-level dashboard groups.",
	Example: `  # List all groups
  testgrid groups list

  # List groups as JSON
  testgrid groups list -o json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		resp, err := apiClient.ListDashboardGroups(ctx)
		if err != nil {
			return fmt.Errorf("failed to list dashboard groups: %w", err)
		}

		return formatter.Print(resp, func(w io.Writer) error {
			tw := output.TableWriter(w)
			output.PrintRow(tw, "NAME", "LINK")
			for _, g := range resp.DashboardGroups {
				output.PrintRow(tw, g.Name, g.Link)
			}
			return tw.Flush()
		})
	},
}

var groupsGetCmd = &cobra.Command{
	Use:   "get <group>",
	Short: "Get dashboards in a group",
	Long:  "List all dashboards belonging to a specific group.",
	Args:  cobra.ExactArgs(1),
	Example: `  # List dashboards in sig-release group
  testgrid groups get sig-release`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		group := args[0]

		resp, err := apiClient.GetGroupDashboards(ctx, group)
		if err != nil {
			return fmt.Errorf("failed to get group dashboards: %w", err)
		}

		return formatter.Print(resp, func(w io.Writer) error {
			tw := output.TableWriter(w)
			output.PrintRow(tw, "NAME", "LINK")
			for _, d := range resp.Dashboards {
				output.PrintRow(tw, d.Name, d.Link)
			}
			return tw.Flush()
		})
	},
}

var groupsSummariesCmd = &cobra.Command{
	Use:   "summaries <group>",
	Short: "Get dashboard summaries for a group",
	Long:  "Get health summaries for all dashboards in a group.",
	Args:  cobra.ExactArgs(1),
	Example: `  # Get summaries for sig-release group
  testgrid groups summaries sig-release`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		group := args[0]

		resp, err := apiClient.GetGroupDashboardSummaries(ctx, group)
		if err != nil {
			return fmt.Errorf("failed to get group dashboard summaries: %w", err)
		}

		return formatter.Print(resp, func(w io.Writer) error {
			tw := output.TableWriter(w)
			output.PrintRow(tw, "NAME", "STATUS", "TAB STATUS")
			for _, s := range resp.DashboardSummaries {
				tabStatus := ""
				for status, count := range s.TabStatusCount {
					if tabStatus != "" {
						tabStatus += ", "
					}
					tabStatus += fmt.Sprintf("%s:%d", status, count)
				}
				output.PrintRow(tw, s.Name, output.ColorStatus(s.OverallStatus), tabStatus)
			}
			return tw.Flush()
		})
	},
}

func init() {
	rootCmd.AddCommand(groupsCmd)
	groupsCmd.AddCommand(groupsListCmd)
	groupsCmd.AddCommand(groupsGetCmd)
	groupsCmd.AddCommand(groupsSummariesCmd)
}
