package output

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"text/tabwriter"
)

// Format represents the output format
type Format string

const (
	FormatTable Format = "table"
	FormatJSON  Format = "json"
)

// Formatter handles output formatting
type Formatter struct {
	format Format
	writer io.Writer
}

// New creates a new Formatter
func New(w io.Writer, format Format) *Formatter {
	return &Formatter{
		format: format,
		writer: w,
	}
}

// Print outputs data in the configured format
func (f *Formatter) Print(data interface{}, tableFunc func(w io.Writer) error) error {
	switch f.format {
	case FormatJSON:
		return f.printJSON(data)
	default:
		return tableFunc(f.writer)
	}
}

func (f *Formatter) printJSON(data interface{}) error {
	enc := json.NewEncoder(f.writer)
	enc.SetIndent("", "  ")
	return enc.Encode(data)
}

// Table helpers

// TableWriter creates a new tabwriter for aligned output
func TableWriter(w io.Writer) *tabwriter.Writer {
	return tabwriter.NewWriter(w, 0, 0, 2, ' ', 0)
}

// PrintRow prints a row with tab-separated values
func PrintRow(w io.Writer, values ...string) {
	fmt.Fprintln(w, strings.Join(values, "\t"))
}

// StatusColor returns ANSI color code for a status
func StatusColor(status string) string {
	switch strings.ToUpper(status) {
	case "PASSING", "PASS":
		return "\033[32m" // Green
	case "FAILING", "FAIL":
		return "\033[31m" // Red
	case "FLAKY":
		return "\033[33m" // Yellow
	case "STALE":
		return "\033[90m" // Gray
	default:
		return ""
	}
}

// ResetColor returns ANSI reset code
func ResetColor() string {
	return "\033[0m"
}

// ColorStatus returns a colored status string
func ColorStatus(status string) string {
	color := StatusColor(status)
	if color == "" {
		return status
	}
	return color + status + ResetColor()
}

// TruncateString truncates a string to maxLen with ellipsis
func TruncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	if maxLen <= 3 {
		return s[:maxLen]
	}
	return s[:maxLen-3] + "..."
}
