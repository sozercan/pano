import { useState, useCallback, useRef, useMemo } from 'react'
import { cn } from '@frontend/lib/cn'
import { useVirtualScroll, useContainerHeight } from '@frontend/hooks/useVirtualScroll'
import { VirtualRow } from './VirtualRow'
import { SimpleGridHeader } from './GridHeader'
import { getResultLabel, getCellColor } from './GridCell'
import { FilterToolbar } from './FilterToolbar'
import { SubscribeButton } from '@frontend/components/subscriptions'
import { useFilterStore, type StatusFilter } from '@frontend/stores/filterStore'
import { KnownResultCodes, isPassingResult, isFailingResult } from '@shared/schemas'
import type { Header, Row, Cell } from '@shared/schemas'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export interface TestGridProps {
  headers: Header[]
  rows: Row[]
  className?: string
  maxHeight?: number
  dashboardName?: string
  tabName?: string
}

// Grid configuration
const CELL_WIDTH = 28
const ROW_HEIGHT = 32
const ROW_NAME_WIDTH = 350
const COLUMN_OVERSCAN = 5

// Helper to check if a row matches the status filter
function rowMatchesStatusFilter(row: Row, filter: StatusFilter): boolean {
  if (filter === 'all') return true

  // Check the most recent results (first few cells)
  for (const cell of row.cells.slice(0, 10)) {
    const result = cell.result ?? 0

    switch (filter) {
      case 'pass':
        if (isPassingResult(result)) return true
        break
      case 'fail':
        // Icon "F" indicates failure regardless of result code (matches display logic)
        if (cell.icon === 'F' || isFailingResult(result)) return true
        break
      case 'skip':
        if (result === KnownResultCodes.SKIPPED) return true
        break
      case 'flaky':
        if (result === KnownResultCodes.FLAKY || result === KnownResultCodes.CATEGORIZED_INTERMITTENT_FAIL)
          return true
        break
      case 'empty':
        if (result === KnownResultCodes.NO_RESULT) return true
        break
    }
  }

  return false
}

// Helper to check if a row has any failures
function rowHasFailures(row: Row): boolean {
  return row.cells.some((cell) => {
    // Icon "F" indicates failure regardless of result code (matches display logic)
    if (cell.icon === 'F') return true
    return isFailingResult(cell.result ?? 0)
  })
}

export function TestGrid({
  headers,
  rows,
  className,
  maxHeight = 600,
  dashboardName,
  tabName,
}: TestGridProps) {
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null)
  const [highlightedColumn] = useState<number | null>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [selectedCell, setSelectedCell] = useState<{
    row: Row
    rowIndex: number
    cellIndex: number
    cell: Cell
  } | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { height: containerHeight, containerRef: measureRef } = useContainerHeight(maxHeight)

  // Get filters for this dashboard/tab
  const filters = useFilterStore((state) =>
    dashboardName && tabName ? state.getFilters(dashboardName, tabName) : null
  )

  // Filter rows based on current filters
  const filteredRows = useMemo(() => {
    if (!filters) return rows

    return rows.filter((row) => {
      // Text filter - case insensitive
      if (filters.textFilter) {
        const searchTerm = filters.textFilter.toLowerCase()
        if (!row.name.toLowerCase().includes(searchTerm)) {
          return false
        }
      }

      // Status filter
      if (filters.statusFilter !== 'all') {
        if (!rowMatchesStatusFilter(row, filters.statusFilter)) {
          return false
        }
      }

      // Show only failures (rows with any failing cells)
      if (filters.showOnlyFailures) {
        if (!rowHasFailures(row)) {
          return false
        }
      }

      return true
    })
  }, [rows, filters])

  // Virtual scroll for rows
  const {
    virtualItems: virtualRows,
    totalHeight: totalRowsHeight,
    onScroll: onVerticalScroll,
    scrollRef: verticalScrollRef,
  } = useVirtualScroll({
    itemCount: filteredRows.length,
    itemHeight: ROW_HEIGHT,
    containerHeight: Math.min(containerHeight, maxHeight) - 80, // Account for header + filter bar
    overscan: 10,
  })

  // Calculate visible columns based on horizontal scroll
  const { visibleCellStart, visibleCellEnd } = useMemo(() => {
    const containerWidth = (scrollContainerRef.current?.clientWidth ?? 800) - ROW_NAME_WIDTH
    const startIndex = Math.max(0, Math.floor(scrollLeft / CELL_WIDTH) - COLUMN_OVERSCAN)
    const endIndex = Math.min(
      headers.length - 1,
      Math.ceil((scrollLeft + containerWidth) / CELL_WIDTH) + COLUMN_OVERSCAN
    )
    return { visibleCellStart: startIndex, visibleCellEnd: endIndex }
  }, [scrollLeft, headers.length])

  // Handle horizontal scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      setScrollLeft(target.scrollLeft)
      onVerticalScroll(e)
    },
    [onVerticalScroll]
  )

  const handleCellSelect = useCallback(
    (rowIndex: number, cellIndex: number, cell: Cell) => {
      const row = filteredRows[rowIndex]
      if (row) {
        setSelectedCell({ row, rowIndex, cellIndex, cell })
      }
    },
    [filteredRows]
  )

  const totalWidth = headers.length * CELL_WIDTH + ROW_NAME_WIDTH

  return (
    <>
      <div
        ref={measureRef}
        className={cn(
          'rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] overflow-hidden',
          className
        )}
      >
        {/* Filter toolbar */}
        {dashboardName && tabName && (
          <FilterToolbar
            dashboard={dashboardName}
            tab={tabName}
            totalRows={rows.length}
            filteredRows={filteredRows.length}
          />
        )}

        {/* Grid info bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--muted)/0.5)] border-b border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
          <span>
            {filteredRows.length.toLocaleString()} tests × {headers.length.toLocaleString()} builds
          </span>
          <span>
            Showing rows {virtualRows[0]?.index + 1 || 0} -{' '}
            {virtualRows[virtualRows.length - 1]?.index + 1 || 0} of {filteredRows.length}
          </span>
        </div>

        {/* Grid container with scroll */}
        <div
          ref={(el) => {
            scrollContainerRef.current = el
            if (verticalScrollRef && 'current' in verticalScrollRef) {
              ;(verticalScrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el
            }
          }}
          className="overflow-auto"
          style={{ maxHeight: maxHeight - 80 }}
          onScroll={handleScroll}
          role="grid"
          aria-rowcount={filteredRows.length}
          aria-colcount={headers.length + 1}
        >
          {/* Header */}
          <SimpleGridHeader
            headers={headers}
            cellWidth={CELL_WIDTH}
            rowNameWidth={ROW_NAME_WIDTH}
            scrollLeft={scrollLeft}
          />

          {/* Virtual rows container */}
          {filteredRows.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-[hsl(var(--muted-foreground))]">
              No tests match the current filters
            </div>
          ) : (
            <div className="relative z-0" style={{ height: totalRowsHeight, width: totalWidth }}>
              {virtualRows.map((virtualRow) => {
                const row = filteredRows[virtualRow.index]
                if (!row) return null

                return (
                  <VirtualRow
                    key={virtualRow.index}
                    row={row}
                    rowIndex={virtualRow.index}
                    cellWidth={CELL_WIDTH}
                    rowNameWidth={ROW_NAME_WIDTH}
                    rowHeight={ROW_HEIGHT}
                    style={{
                      position: 'absolute',
                      top: virtualRow.offsetTop,
                      left: 0,
                      width: totalWidth,
                    }}
                    visibleCellStart={visibleCellStart}
                    visibleCellEnd={visibleCellEnd}
                    headerCount={headers.length}
                    scrollLeft={scrollLeft}
                    highlightedRow={highlightedRow ?? undefined}
                    highlightedColumn={highlightedColumn ?? undefined}
                    onRowHover={setHighlightedRow}
                    onCellSelect={handleCellSelect}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cell detail dialog */}
      <Dialog.Root open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-2xl w-full max-h-[85vh] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-lg overflow-hidden">
            {selectedCell && (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn('h-4 w-4 rounded', getCellColor(selectedCell.cell.result ?? 0, selectedCell.cell.icon))}
                    />
                    <Dialog.Title className="font-semibold">
                      {getResultLabel(selectedCell.cell.result ?? 0, selectedCell.cell.icon)}
                    </Dialog.Title>
                  </div>
                  <Dialog.Close className="rounded-md p-1 hover:bg-[hsl(var(--muted))]">
                    <X className="h-5 w-5" />
                  </Dialog.Close>
                </div>
                <div className="p-4 space-y-4 overflow-auto max-h-[calc(85vh-60px)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                        Test Name
                      </label>
                      <p className="mt-1 text-sm font-mono break-all">{selectedCell.row.name}</p>
                    </div>
                    {dashboardName && tabName && (
                      <SubscribeButton
                        target={{
                          type: 'test',
                          dashboardName,
                          tabName,
                          testName: selectedCell.row.name,
                        }}
                        variant="outline"
                        size="sm"
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                        Build
                      </label>
                      <p className="mt-1 text-sm">#{selectedCell.cellIndex + 1}</p>
                    </div>
                    {headers[selectedCell.cellIndex]?.started && (
                      <div>
                        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                          Started
                        </label>
                        <p className="mt-1 text-sm">
                          {new Date(headers[selectedCell.cellIndex].started!).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedCell.cell.message && (
                    <div>
                      <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                        Message
                      </label>
                      <pre className="mt-2 p-3 rounded-md bg-[hsl(var(--muted))] text-sm font-mono whitespace-pre-wrap break-words overflow-auto max-h-64">
                        {selectedCell.cell.message}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

// Export grid configuration for use elsewhere
export { CELL_WIDTH, ROW_HEIGHT, ROW_NAME_WIDTH }
