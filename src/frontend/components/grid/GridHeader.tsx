import { memo } from 'react'
import { cn } from '@frontend/lib/cn'
import type { Header } from '@shared/schemas'

export interface GridHeaderProps {
  headers: Header[]
  visibleStartIndex: number
  visibleEndIndex: number
  cellWidth: number
  rowNameWidth: number
  highlightedColumn?: number
  onColumnHover?: (index: number | null) => void
}

export const GridHeader = memo(function GridHeader({
  headers,
  visibleStartIndex,
  visibleEndIndex,
  cellWidth,
  rowNameWidth,
  highlightedColumn,
  onColumnHover,
}: GridHeaderProps) {
  const visibleHeaders = headers.slice(visibleStartIndex, visibleEndIndex + 1)
  const totalWidth = headers.length * cellWidth

  return (
    <div
      className="sticky top-0 z-20 flex bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]"
      role="row"
    >
      {/* Row name header (sticky left) */}
      <div
        className="sticky left-0 z-30 flex-shrink-0 flex items-center px-3 py-2 bg-[hsl(var(--muted))] border-r border-[hsl(var(--border))] font-medium text-sm"
        style={{ width: rowNameWidth }}
        role="columnheader"
      >
        Test Name
      </div>

      {/* Column headers container */}
      <div className="relative flex-1 overflow-hidden min-w-0">
        <div
          className="flex"
          style={{
            width: totalWidth,
            transform: `translateX(-${visibleStartIndex * cellWidth}px)`,
          }}
        >
          {/* Spacer for columns before visible range */}
          <div style={{ width: visibleStartIndex * cellWidth, flexShrink: 0 }} />

          {/* Visible column headers */}
          {visibleHeaders.map((header, i) => {
            const actualIndex = visibleStartIndex + i
            const isHighlighted = highlightedColumn === actualIndex

            return (
              <div
                key={actualIndex}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center justify-center py-1 px-0.5 text-center transition-colors',
                  isHighlighted && 'bg-blue-100 dark:bg-blue-900/30'
                )}
                style={{ width: cellWidth }}
                role="columnheader"
                onMouseEnter={() => onColumnHover?.(actualIndex)}
                onMouseLeave={() => onColumnHover?.(null)}
                title={formatHeaderTooltip(header, actualIndex)}
              >
                <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] leading-tight">
                  {actualIndex + 1}
                </span>
                {header.started && (
                  <span className="text-[9px] text-[hsl(var(--muted-foreground))] leading-tight truncate w-full">
                    {formatHeaderTime(header.started)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

function formatHeaderTime(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'now'
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function formatHeaderTooltip(header: Header, index: number): string {
  const parts = [`Build #${index + 1}`]

  if (header.build) {
    parts.push(`ID: ${header.build}`)
  }

  if (header.started) {
    try {
      const date = new Date(header.started)
      parts.push(`Started: ${date.toLocaleString()}`)
    } catch {
      parts.push(`Started: ${header.started}`)
    }
  }

  if (header.extra && header.extra.length > 0) {
    const extras = header.extra.filter((e) => e && e.trim() !== '')
    if (extras.length > 0) {
      parts.push(`Extra: ${extras.join(', ')}`)
    }
  }

  return parts.join('\n')
}

// Simpler header for horizontal scroll
export const SimpleGridHeader = memo(function SimpleGridHeader({
  headers,
  cellWidth,
  rowNameWidth,
  scrollLeft,
}: {
  headers: Header[]
  cellWidth: number
  rowNameWidth: number
  scrollLeft: number
}) {
  const totalWidth = headers.length * cellWidth

  return (
    <div className="sticky top-0 z-20 flex bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
      {/* Row name header */}
      <div
        className="sticky left-0 z-30 flex-shrink-0 flex items-center px-3 py-2 bg-[hsl(var(--muted))] border-r border-[hsl(var(--border))] font-medium text-sm"
        style={{ width: rowNameWidth }}
      >
        Test Name
      </div>

      {/* Scrollable headers container */}
      <div className="overflow-hidden flex-1 min-w-0">
        <div
          className="flex"
          style={{
            width: totalWidth,
            transform: `translateX(-${scrollLeft}px)`,
          }}
        >
          {headers.map((header, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex flex-col items-center justify-center py-1 px-0.5 text-center"
              style={{ width: cellWidth }}
              title={formatHeaderTooltip(header, i)}
            >
              <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] leading-tight">
                {i + 1}
              </span>
              {header.started && (
                <span className="text-[9px] text-[hsl(var(--muted-foreground))] leading-tight">
                  {formatHeaderTime(header.started)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
