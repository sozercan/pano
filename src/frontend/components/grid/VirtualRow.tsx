import { memo, useCallback } from 'react'
import { cn } from '@frontend/lib/cn'
import { VirtualGridCell } from './GridCell'
import type { Row, Cell } from '@shared/schemas'

export interface VirtualRowProps {
  row: Row
  rowIndex: number
  cellWidth: number
  rowNameWidth: number
  rowHeight: number
  style: React.CSSProperties
  visibleCellStart: number
  visibleCellEnd: number
  headerCount: number
  scrollLeft: number
  highlightedRow?: number
  highlightedColumn?: number
  onRowHover?: (index: number | null) => void
  onCellSelect?: (rowIndex: number, cellIndex: number, cell: Cell) => void
}

export const VirtualRow = memo(function VirtualRow({
  row,
  rowIndex,
  cellWidth,
  rowNameWidth,
  rowHeight,
  style,
  visibleCellStart,
  visibleCellEnd,
  headerCount,
  scrollLeft,
  highlightedRow,
  highlightedColumn,
  onRowHover,
  onCellSelect,
}: VirtualRowProps) {
  const isHighlightedRow = highlightedRow === rowIndex
  // Use headerCount for width to ensure alignment with header row
  const totalCellsWidth = headerCount * cellWidth
  // Get visible cells, clamping to actual data available
  const clampedVisibleEnd = Math.min(visibleCellEnd, row.cells.length - 1)
  const visibleCells = visibleCellStart <= clampedVisibleEnd
    ? row.cells.slice(visibleCellStart, clampedVisibleEnd + 1)
    : []

  const handleMouseEnter = useCallback(() => {
    onRowHover?.(rowIndex)
  }, [onRowHover, rowIndex])

  const handleMouseLeave = useCallback(() => {
    onRowHover?.(null)
  }, [onRowHover])

  return (
    <div
      className={cn(
        'flex border-b border-[hsl(var(--border))] transition-colors',
        isHighlightedRow && 'bg-blue-50 dark:bg-blue-900/20'
      )}
      style={{ ...style, height: rowHeight }}
      role="row"
      aria-rowindex={rowIndex + 1}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Row name (sticky left) */}
      <div
        className={cn(
          'sticky left-0 z-10 flex-shrink-0 flex items-center px-3 border-r border-[hsl(var(--border))] bg-[hsl(var(--background))]',
          isHighlightedRow && 'bg-blue-50 dark:bg-blue-900/20'
        )}
        style={{ width: rowNameWidth }}
        role="rowheader"
      >
        <span className="truncate text-sm" title={row.name}>
          {row.name}
        </span>
      </div>

      {/* Cells container */}
      <div className="relative flex-1 overflow-hidden min-w-0">
        <div
          style={{
            position: 'relative',
            width: totalCellsWidth,
            height: rowHeight,
            transform: `translateX(-${scrollLeft}px)`,
          }}
        >
          {/* Visible cells with absolute positioning */}
          {visibleCells.map((cell, i) => {
            const actualIndex = visibleCellStart + i
            const isHighlightedCell = highlightedColumn === actualIndex || isHighlightedRow

            return (
              <div
                key={actualIndex}
                className={cn(
                  'flex items-center justify-center',
                  highlightedColumn === actualIndex && 'bg-blue-100/50 dark:bg-blue-900/20'
                )}
                style={{
                  position: 'absolute',
                  left: actualIndex * cellWidth,
                  width: cellWidth,
                  height: rowHeight,
                }}
                role="gridcell"
              >
                <VirtualGridCell
                  cell={cell}
                  isHighlighted={isHighlightedCell}
                  onSelect={
                    cell.message
                      ? () => onCellSelect?.(rowIndex, actualIndex, cell)
                      : undefined
                  }
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

// Simple row without virtualization for smaller grids
export const SimpleRow = memo(function SimpleRow({
  row,
  rowIndex,
  cellWidth,
  rowNameWidth,
  rowHeight,
  highlightedRow,
  highlightedColumn,
  onRowHover,
  onCellSelect,
}: Omit<VirtualRowProps, 'style' | 'visibleCellStart' | 'visibleCellEnd'>) {
  const isHighlightedRow = highlightedRow === rowIndex

  const handleMouseEnter = useCallback(() => {
    onRowHover?.(rowIndex)
  }, [onRowHover, rowIndex])

  const handleMouseLeave = useCallback(() => {
    onRowHover?.(null)
  }, [onRowHover])

  return (
    <div
      className={cn(
        'flex border-b border-[hsl(var(--border))] transition-colors',
        isHighlightedRow && 'bg-blue-50 dark:bg-blue-900/20'
      )}
      style={{ height: rowHeight }}
      role="row"
      aria-rowindex={rowIndex + 1}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Row name (sticky left) */}
      <div
        className={cn(
          'sticky left-0 z-10 flex-shrink-0 flex items-center px-3 border-r border-[hsl(var(--border))] bg-[hsl(var(--background))]',
          isHighlightedRow && 'bg-blue-50 dark:bg-blue-900/20'
        )}
        style={{ width: rowNameWidth }}
        role="rowheader"
      >
        <span className="truncate text-sm" title={row.name}>
          {row.name}
        </span>
      </div>

      {/* All cells */}
      <div className="flex items-center">
        {row.cells.map((cell, cellIndex) => {
          const isHighlightedCell = highlightedColumn === cellIndex || isHighlightedRow

          return (
            <div
              key={cellIndex}
              className={cn(
                'flex-shrink-0 flex items-center justify-center',
                highlightedColumn === cellIndex && 'bg-blue-100/50 dark:bg-blue-900/20'
              )}
              style={{ width: cellWidth, height: rowHeight }}
              role="gridcell"
            >
              <VirtualGridCell
                cell={cell}
                isHighlighted={isHighlightedCell}
                onSelect={
                  cell.message ? () => onCellSelect?.(rowIndex, cellIndex, cell) : undefined
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
})
