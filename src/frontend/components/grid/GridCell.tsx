import { memo, useState, useCallback } from 'react'
import { cn } from '@frontend/lib/cn'
import { KnownResultCodes, type Cell } from '@shared/schemas'
import * as Popover from '@radix-ui/react-popover'

export interface GridCellProps {
  cell: Cell
  rowName?: string
  columnIndex?: number
  isHighlighted?: boolean
  onClick?: (cell: Cell) => void
}

export const GridCell = memo(function GridCell({
  cell,
  rowName,
  columnIndex,
  isHighlighted = false,
  onClick,
}: GridCellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const result = cell.result ?? KnownResultCodes.NO_RESULT
  const hasMessage = !!cell.message

  const handleClick = useCallback(() => {
    if (hasMessage) {
      setIsOpen(true)
    }
    onClick?.(cell)
  }, [cell, hasMessage, onClick])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  const colorClass = getCellColor(result, cell.icon)
  const label = getResultLabel(result, cell.icon)

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'h-5 w-5 rounded-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            colorClass,
            isHighlighted && 'ring-2 ring-blue-400',
            hasMessage && 'cursor-pointer hover:scale-110'
          )}
          title={cell.message || label}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label={`${label}${cell.message ? `: ${cell.message}` : ''}`}
        />
      </Popover.Trigger>
      {hasMessage && (
        <Popover.Portal>
          <Popover.Content
            className="z-50 max-w-md rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--popover))] p-3 shadow-lg"
            sideOffset={5}
            align="center"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn('h-3 w-3 rounded-sm', colorClass)} />
                <span className="font-medium text-sm">{label}</span>
              </div>
              {rowName && (
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="font-medium">Test:</span> {rowName}
                </div>
              )}
              {columnIndex !== undefined && (
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="font-medium">Build:</span> #{columnIndex + 1}
                </div>
              )}
              <div className="pt-1 border-t border-[hsl(var(--border))]">
                <pre className="text-xs whitespace-pre-wrap break-words max-h-48 overflow-auto font-mono text-[hsl(var(--foreground))]">
                  {cell.message}
                </pre>
              </div>
            </div>
            <Popover.Arrow className="fill-[hsl(var(--popover))]" />
          </Popover.Content>
        </Popover.Portal>
      )}
    </Popover.Root>
  )
})

// Memoized cell for use in virtualized lists (without popover for performance)
export const VirtualGridCell = memo(function VirtualGridCell({
  cell,
  isHighlighted = false,
  onSelect,
}: {
  cell: Cell
  isHighlighted?: boolean
  onSelect?: () => void
}) {
  const result = cell.result ?? KnownResultCodes.NO_RESULT
  const colorClass = getCellColor(result, cell.icon)
  const label = getResultLabel(result, cell.icon)
  const hasMessage = !!cell.message

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && hasMessage && onSelect) {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      role={hasMessage ? 'button' : 'gridcell'}
      tabIndex={hasMessage ? 0 : -1}
      className={cn(
        'h-5 w-5 rounded-sm mx-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        colorClass,
        isHighlighted && 'ring-2 ring-blue-400',
        hasMessage && 'cursor-pointer hover:scale-110'
      )}
      title={cell.message || label}
      onClick={hasMessage ? onSelect : undefined}
      onKeyDown={handleKeyDown}
      aria-label={`${label}${cell.message ? `: ${cell.message}` : ''}`}
    />
  )
})

function getCellColor(result: number, icon?: string): string {
  // Icon "F" indicates failure regardless of result code
  if (icon === 'F') {
    return 'bg-red-500'
  }

  switch (result) {
    case KnownResultCodes.PASS:
    case KnownResultCodes.PASS_WITH_ERRORS:
    case KnownResultCodes.PASS_WITH_SKIPS:
      return 'bg-green-500'
    case KnownResultCodes.FAIL:
    case KnownResultCodes.BUILD_FAIL:
    case KnownResultCodes.CATEGORIZED_FAIL:
    case KnownResultCodes.FAIL_EXPECTED:
      return 'bg-red-500'
    case KnownResultCodes.FLAKY:
    case KnownResultCodes.CATEGORIZED_INTERMITTENT_FAIL:
      return 'bg-orange-500'
    case KnownResultCodes.SKIPPED:
      return 'bg-yellow-500'
    case KnownResultCodes.RUNNING:
      return 'bg-blue-500 animate-pulse'
    case KnownResultCodes.TRUNCATED:
      return 'bg-gray-400'
    case KnownResultCodes.CANCEL:
    case KnownResultCodes.TIMEOUT:
    case KnownResultCodes.CATEGORIZED_ABORT:
      return 'bg-purple-500'
    case KnownResultCodes.NO_RESULT:
    case KnownResultCodes.UNKNOWN:
    default:
      return 'bg-gray-200 dark:bg-gray-700'
  }
}

function getResultLabel(result: number, icon?: string): string {
  // Icon "F" indicates failure
  if (icon === 'F') {
    return 'Fail'
  }

  switch (result) {
    case KnownResultCodes.PASS:
      return 'Pass'
    case KnownResultCodes.PASS_WITH_ERRORS:
      return 'Pass (with errors)'
    case KnownResultCodes.PASS_WITH_SKIPS:
      return 'Pass (with skips)'
    case KnownResultCodes.FAIL:
      return 'Fail'
    case KnownResultCodes.BUILD_FAIL:
      return 'Build Fail'
    case KnownResultCodes.CATEGORIZED_FAIL:
      return 'Categorized Fail'
    case KnownResultCodes.FAIL_EXPECTED:
      return 'Fail (expected)'
    case KnownResultCodes.FLAKY:
      return 'Flaky'
    case KnownResultCodes.CATEGORIZED_INTERMITTENT_FAIL:
      return 'Intermittent Fail'
    case KnownResultCodes.SKIPPED:
      return 'Skipped'
    case KnownResultCodes.RUNNING:
      return 'Running'
    case KnownResultCodes.TRUNCATED:
      return 'Truncated'
    case KnownResultCodes.CANCEL:
      return 'Cancelled'
    case KnownResultCodes.TIMEOUT:
      return 'Timeout'
    case KnownResultCodes.CATEGORIZED_ABORT:
      return 'Aborted'
    case KnownResultCodes.NO_RESULT:
      return 'No result'
    case KnownResultCodes.UNKNOWN:
      return 'Unknown'
    default:
      return `Result: ${result}`
  }
}

// Export for use elsewhere
export { getCellColor, getResultLabel }
