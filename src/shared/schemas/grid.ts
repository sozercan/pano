import { z } from 'zod'

// Result codes for grid cells (from TestGrid proto definitions)
// See: https://github.com/GoogleCloudPlatform/testgrid/blob/master/pb/api/v1/data.proto
export const ResultCodeSchema = z.number().int().min(0)

export type ResultCode = z.infer<typeof ResultCodeSchema>

// Known result codes for display
export const KnownResultCodes = {
  NO_RESULT: 0,
  PASS: 1,
  FAIL: 2,
  SKIPPED: 3,
  UNKNOWN: 4,
  FLAKY: 5,
  TRUNCATED: 6,
  RUNNING: 7,
  PASS_WITH_ERRORS: 12,
  PASS_WITH_SKIPS: 13,
  FAIL_EXPECTED: 14,
  BUILD_FAIL: 15,
  CATEGORIZED_ABORT: 16,
  CATEGORIZED_FAIL: 17,
  CATEGORIZED_INTERMITTENT_FAIL: 18,
  CANCEL: 19,
  TIMEOUT: 20,
} as const

// Human-readable result status
export const ResultStatus: Record<number, string> = {
  0: 'empty',
  1: 'pass',
  2: 'fail',
  3: 'skip',
  4: 'unknown',
  5: 'flaky',
  6: 'truncated',
  7: 'running',
  12: 'pass_with_errors',
  13: 'pass_with_skips',
  14: 'fail_expected',
  15: 'build_fail',
  16: 'categorized_abort',
  17: 'categorized_fail',
  18: 'categorized_intermittent_fail',
  19: 'cancel',
  20: 'timeout',
}

export type ResultStatusName = string

// Grid header (column information)
export const HeaderSchema = z.object({
  build: z.string(),
  started: z.string().optional(),
  extra: z.array(z.string()).optional(),
})

export type Header = z.infer<typeof HeaderSchema>

// Headers response
export const HeadersResponseSchema = z.object({
  headers: z.array(HeaderSchema),
})

export type HeadersResponse = z.infer<typeof HeadersResponseSchema>

// Grid cell (test result for a specific build)
export const CellSchema = z.object({
  result: ResultCodeSchema.optional(),
  message: z.string().optional(),
  icon: z.string().optional(),
})

export type Cell = z.infer<typeof CellSchema>

// Grid row (test with all its results)
export const RowSchema = z.object({
  name: z.string(),
  cells: z.array(CellSchema),
})

export type Row = z.infer<typeof RowSchema>

// Rows response
export const RowsResponseSchema = z.object({
  rows: z.array(RowSchema),
})

export type RowsResponse = z.infer<typeof RowsResponseSchema>

// Helper function to get result code with default
export function getResultCode(cell: Cell): ResultCode {
  return cell.result ?? 0
}

// Helper function to get human-readable status
export function getResultStatus(cell: Cell): ResultStatusName {
  const code = getResultCode(cell)
  return ResultStatus[code] ?? 'unknown'
}

// Helper to check if result is a passing status
export function isPassingResult(code: ResultCode): boolean {
  return code === KnownResultCodes.PASS ||
         code === KnownResultCodes.PASS_WITH_ERRORS ||
         code === KnownResultCodes.PASS_WITH_SKIPS
}

// Helper to check if result is a failing status
export function isFailingResult(code: ResultCode): boolean {
  return code === KnownResultCodes.FAIL ||
         code === KnownResultCodes.BUILD_FAIL ||
         code === KnownResultCodes.CATEGORIZED_FAIL ||
         code === KnownResultCodes.FAIL_EXPECTED
}
