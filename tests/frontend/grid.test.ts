import { describe, test, expect } from 'bun:test'
import { getCellColor, getResultLabel } from '@frontend/components/grid/GridCell'
import { KnownResultCodes } from '@shared/schemas'

describe('GridCell', () => {
  describe('getCellColor', () => {
    test('returns green for passing results', () => {
      expect(getCellColor(KnownResultCodes.PASS)).toBe('bg-green-500')
      expect(getCellColor(KnownResultCodes.PASS_WITH_ERRORS)).toBe('bg-green-500')
      expect(getCellColor(KnownResultCodes.PASS_WITH_SKIPS)).toBe('bg-green-500')
    })

    test('returns red for failing results', () => {
      expect(getCellColor(KnownResultCodes.FAIL)).toBe('bg-red-500')
      expect(getCellColor(KnownResultCodes.BUILD_FAIL)).toBe('bg-red-500')
      expect(getCellColor(KnownResultCodes.CATEGORIZED_FAIL)).toBe('bg-red-500')
      expect(getCellColor(KnownResultCodes.FAIL_EXPECTED)).toBe('bg-red-500')
    })

    test('returns orange for flaky results', () => {
      expect(getCellColor(KnownResultCodes.FLAKY)).toBe('bg-orange-500')
      expect(getCellColor(KnownResultCodes.CATEGORIZED_INTERMITTENT_FAIL)).toBe('bg-orange-500')
    })

    test('returns yellow for skipped results', () => {
      expect(getCellColor(KnownResultCodes.SKIPPED)).toBe('bg-yellow-500')
    })

    test('returns blue with animation for running results', () => {
      expect(getCellColor(KnownResultCodes.RUNNING)).toBe('bg-blue-500 animate-pulse')
    })

    test('returns gray for truncated results', () => {
      expect(getCellColor(KnownResultCodes.TRUNCATED)).toBe('bg-gray-400')
    })

    test('returns purple for abort/cancel/timeout results', () => {
      expect(getCellColor(KnownResultCodes.CANCEL)).toBe('bg-purple-500')
      expect(getCellColor(KnownResultCodes.TIMEOUT)).toBe('bg-purple-500')
      expect(getCellColor(KnownResultCodes.CATEGORIZED_ABORT)).toBe('bg-purple-500')
    })

    test('returns gray for no result/unknown', () => {
      expect(getCellColor(KnownResultCodes.NO_RESULT)).toBe('bg-gray-200 dark:bg-gray-700')
      expect(getCellColor(KnownResultCodes.UNKNOWN)).toBe('bg-gray-200 dark:bg-gray-700')
      expect(getCellColor(999)).toBe('bg-gray-200 dark:bg-gray-700')
    })

    test('returns red when icon is "F" regardless of result code', () => {
      // Even if result code says PASS_WITH_ERRORS (12), icon "F" means failure
      expect(getCellColor(KnownResultCodes.PASS_WITH_ERRORS, 'F')).toBe('bg-red-500')
      expect(getCellColor(KnownResultCodes.PASS, 'F')).toBe('bg-red-500')
      expect(getCellColor(KnownResultCodes.NO_RESULT, 'F')).toBe('bg-red-500')
    })

    test('ignores icon when not "F"', () => {
      expect(getCellColor(KnownResultCodes.PASS, 'P')).toBe('bg-green-500')
      expect(getCellColor(KnownResultCodes.PASS, undefined)).toBe('bg-green-500')
    })
  })

  describe('getResultLabel', () => {
    test('returns correct labels for all known result codes', () => {
      expect(getResultLabel(KnownResultCodes.PASS)).toBe('Pass')
      expect(getResultLabel(KnownResultCodes.PASS_WITH_ERRORS)).toBe('Pass (with errors)')
      expect(getResultLabel(KnownResultCodes.PASS_WITH_SKIPS)).toBe('Pass (with skips)')
      expect(getResultLabel(KnownResultCodes.FAIL)).toBe('Fail')
      expect(getResultLabel(KnownResultCodes.BUILD_FAIL)).toBe('Build Fail')
      expect(getResultLabel(KnownResultCodes.CATEGORIZED_FAIL)).toBe('Categorized Fail')
      expect(getResultLabel(KnownResultCodes.FAIL_EXPECTED)).toBe('Fail (expected)')
      expect(getResultLabel(KnownResultCodes.FLAKY)).toBe('Flaky')
      expect(getResultLabel(KnownResultCodes.CATEGORIZED_INTERMITTENT_FAIL)).toBe('Intermittent Fail')
      expect(getResultLabel(KnownResultCodes.SKIPPED)).toBe('Skipped')
      expect(getResultLabel(KnownResultCodes.RUNNING)).toBe('Running')
      expect(getResultLabel(KnownResultCodes.TRUNCATED)).toBe('Truncated')
      expect(getResultLabel(KnownResultCodes.CANCEL)).toBe('Cancelled')
      expect(getResultLabel(KnownResultCodes.TIMEOUT)).toBe('Timeout')
      expect(getResultLabel(KnownResultCodes.CATEGORIZED_ABORT)).toBe('Aborted')
      expect(getResultLabel(KnownResultCodes.NO_RESULT)).toBe('No result')
      expect(getResultLabel(KnownResultCodes.UNKNOWN)).toBe('Unknown')
    })

    test('returns generic label for unknown result codes', () => {
      expect(getResultLabel(999)).toBe('Result: 999')
      expect(getResultLabel(100)).toBe('Result: 100')
    })

    test('returns "Fail" when icon is "F" regardless of result code', () => {
      expect(getResultLabel(KnownResultCodes.PASS_WITH_ERRORS, 'F')).toBe('Fail')
      expect(getResultLabel(KnownResultCodes.PASS, 'F')).toBe('Fail')
    })

    test('ignores icon when not "F"', () => {
      expect(getResultLabel(KnownResultCodes.PASS, 'P')).toBe('Pass')
      expect(getResultLabel(KnownResultCodes.PASS, undefined)).toBe('Pass')
    })
  })
})

describe('Virtual Scroll Calculations', () => {
  // Test the core virtualization logic
  test('calculates visible range correctly', () => {
    const itemCount = 1000
    const itemHeight = 32
    const containerHeight = 600
    const overscan = 5
    const scrollTop = 320 // 10 items scrolled

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    // scrollTop 320 / 32 = 10, minus overscan 5 = 5
    expect(startIndex).toBe(5)

    // (320 + 600) / 32 = 28.75, ceil = 29, plus overscan 5 = 34
    expect(endIndex).toBe(34)

    // Visible items should be from 5 to 34 = 30 items
    const visibleCount = endIndex - startIndex + 1
    expect(visibleCount).toBe(30)
  })

  test('handles edge case at start', () => {
    const itemCount = 1000
    const itemHeight = 32
    const containerHeight = 600
    const overscan = 5
    const scrollTop = 0

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    expect(startIndex).toBe(0) // Can't go below 0
    expect(endIndex).toBe(24) // (0 + 600) / 32 = 18.75, ceil = 19, + 5 = 24
  })

  test('handles edge case at end', () => {
    const itemCount = 100
    const itemHeight = 32
    const containerHeight = 600
    const overscan = 5
    const scrollTop = 2800 // Near the end

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    expect(startIndex).toBe(82) // 2800 / 32 = 87.5, floor = 87, - 5 = 82
    expect(endIndex).toBe(99) // Can't exceed itemCount - 1
  })

  test('handles empty list', () => {
    const itemCount = 0
    const itemHeight = 32

    const totalHeight = itemCount * itemHeight

    expect(totalHeight).toBe(0)
  })

  test('calculates total height correctly', () => {
    const itemCount = 5000
    const itemHeight = 32

    const totalHeight = itemCount * itemHeight

    expect(totalHeight).toBe(160000) // 5000 * 32 = 160,000 pixels
  })
})

describe('Column Virtualization', () => {
  test('calculates visible columns correctly', () => {
    const columnCount = 100
    const cellWidth = 28
    const containerWidth = 800 - 350 // 450px for cells after row name
    const columnOverscan = 5
    const scrollLeft = 280 // 10 columns scrolled

    const startIndex = Math.max(0, Math.floor(scrollLeft / cellWidth) - columnOverscan)
    const endIndex = Math.min(
      columnCount - 1,
      Math.ceil((scrollLeft + containerWidth) / cellWidth) + columnOverscan
    )

    // 280 / 28 = 10, minus 5 = 5
    expect(startIndex).toBe(5)

    // (280 + 450) / 28 = 26.07, ceil = 27, plus 5 = 32
    expect(endIndex).toBe(32)
  })
})
