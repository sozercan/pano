package cmd

import (
	"os"

	"github.com/sozercan/testgrid-explorer/pkg/client"
	"github.com/sozercan/testgrid-explorer/pkg/output"
	"github.com/spf13/cobra"
)

var (
	baseURL      string
	outputFormat string
	apiClient    *client.Client
	formatter    *output.Formatter
)

// rootCmd represents the base command
var rootCmd = &cobra.Command{
	Use:   "testgrid",
	Short: "TestGrid API Explorer",
	Long: `A CLI tool to explore and validate the TestGrid API.

TestGrid provides Kubernetes CI/CD test results. This tool allows you to
query dashboards, tabs, and test results from the TestGrid API.

Examples:
  # List all dashboard groups
  testgrid groups list

  # List dashboards in a group
  testgrid groups get sig-release

  # Get dashboard summary
  testgrid dashboards summary sig-release-master-blocking

  # List tabs in a dashboard
  testgrid tabs list sig-release-master-blocking

  # Get tab summary
  testgrid tabs summary sig-release-master-blocking kind-master

  # Output as JSON
  testgrid dashboards list -o json`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		// Initialize client and formatter
		opts := []client.Option{}
		if baseURL != "" {
			opts = append(opts, client.WithBaseURL(baseURL))
		}
		apiClient = client.New(opts...)

		format := output.FormatTable
		if outputFormat == "json" {
			format = output.FormatJSON
		}
		formatter = output.New(os.Stdout, format)
	},
}

// Execute runs the root command
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().StringVar(&baseURL, "base-url", "", "Override the TestGrid API base URL")
	rootCmd.PersistentFlags().StringVarP(&outputFormat, "output", "o", "table", "Output format: table, json")
}
