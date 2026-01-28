package output

import (
	"bytes"
	"io"
	"strings"
	"testing"
)

func TestFormatterJSON(t *testing.T) {
	var buf bytes.Buffer
	f := New(&buf, FormatJSON)

	data := map[string]string{"key": "value"}
	err := f.Print(data, func(w io.Writer) error {
		return nil // table func should not be called
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, `"key": "value"`) {
		t.Errorf("expected JSON output to contain key-value pair, got: %s", output)
	}
}

func TestFormatterTable(t *testing.T) {
	var buf bytes.Buffer
	f := New(&buf, FormatTable)

	called := false
	err := f.Print(nil, func(w io.Writer) error {
		called = true
		w.Write([]byte("table output"))
		return nil
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !called {
		t.Error("expected table function to be called")
	}

	if buf.String() != "table output" {
		t.Errorf("expected 'table output', got '%s'", buf.String())
	}
}

func TestStatusColor(t *testing.T) {
	tests := []struct {
		status   string
		hasColor bool
	}{
		{"PASSING", true},
		{"PASS", true},
		{"FAILING", true},
		{"FAIL", true},
		{"FLAKY", true},
		{"STALE", true},
		{"UNKNOWN", false},
		{"", false},
	}

	for _, tt := range tests {
		color := StatusColor(tt.status)
		if tt.hasColor && color == "" {
			t.Errorf("expected color for status '%s', got empty", tt.status)
		}
		if !tt.hasColor && color != "" {
			t.Errorf("expected no color for status '%s', got '%s'", tt.status, color)
		}
	}
}

func TestColorStatus(t *testing.T) {
	// Test that colored status contains reset code
	colored := ColorStatus("PASSING")
	if !strings.Contains(colored, ResetColor()) {
		t.Error("expected colored status to contain reset code")
	}

	// Test unknown status returns unchanged
	unknown := ColorStatus("UNKNOWN")
	if unknown != "UNKNOWN" {
		t.Errorf("expected unknown status to be unchanged, got '%s'", unknown)
	}
}

func TestTruncateString(t *testing.T) {
	tests := []struct {
		input    string
		maxLen   int
		expected string
	}{
		{"short", 10, "short"},
		{"exactly10!", 10, "exactly10!"},
		{"this is a longer string", 10, "this is..."},
		{"abc", 3, "abc"},
		{"abcd", 3, "abc"},
		{"ab", 5, "ab"},
	}

	for _, tt := range tests {
		got := TruncateString(tt.input, tt.maxLen)
		if got != tt.expected {
			t.Errorf("TruncateString(%q, %d) = %q, expected %q", tt.input, tt.maxLen, got, tt.expected)
		}
	}
}

func TestTableWriter(t *testing.T) {
	var buf bytes.Buffer
	tw := TableWriter(&buf)

	PrintRow(tw, "COL1", "COL2", "COL3")
	PrintRow(tw, "a", "b", "c")
	tw.Flush()

	output := buf.String()
	if !strings.Contains(output, "COL1") || !strings.Contains(output, "COL2") {
		t.Errorf("expected table output to contain headers, got: %s", output)
	}
}

func TestPrintRow(t *testing.T) {
	var buf bytes.Buffer
	PrintRow(&buf, "a", "b", "c")

	expected := "a\tb\tc\n"
	if buf.String() != expected {
		t.Errorf("expected '%s', got '%s'", expected, buf.String())
	}
}
