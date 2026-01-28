import { Search, X, Filter, AlertCircle } from 'lucide-react'
import { useFilterStore, type StatusFilter } from '@frontend/stores/filterStore'
import { cn } from '@frontend/lib/cn'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

interface FilterToolbarProps {
  dashboard: string
  tab: string
  totalRows: number
  filteredRows: number
}

const STATUS_OPTIONS: { value: StatusFilter; label: string; color?: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pass', label: 'Passing', color: 'bg-green-500' },
  { value: 'fail', label: 'Failing', color: 'bg-red-500' },
  { value: 'skip', label: 'Skipped', color: 'bg-yellow-500' },
  { value: 'flaky', label: 'Flaky', color: 'bg-orange-500' },
  { value: 'empty', label: 'No result', color: 'bg-gray-400' },
]

export function FilterToolbar({ dashboard, tab, totalRows, filteredRows }: FilterToolbarProps) {
  const { getFilters, setStatusFilter, setTextFilter, setShowOnlyFailures, clearFilters } =
    useFilterStore()
  const filters = getFilters(dashboard, tab)

  const hasActiveFilters =
    filters.statusFilter !== 'all' || filters.textFilter !== '' || filters.showOnlyFailures

  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === filters.statusFilter)

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
      {/* Text filter */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          placeholder="Filter tests by name..."
          value={filters.textFilter}
          onChange={(e) => setTextFilter(dashboard, tab, e.target.value)}
          className="w-full pl-8 pr-8 py-1.5 text-sm rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] placeholder:text-[hsl(var(--muted-foreground))]"
        />
        {filters.textFilter && (
          <button
            onClick={() => setTextFilter(dashboard, tab, '')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[hsl(var(--muted))]"
          >
            <X className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          </button>
        )}
      </div>

      {/* Status filter dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:bg-[hsl(var(--accent))]',
              filters.statusFilter !== 'all' && 'border-[hsl(var(--primary))]'
            )}
          >
            <Filter className="h-4 w-4" />
            {selectedStatus?.color && (
              <span className={cn('h-2.5 w-2.5 rounded-full', selectedStatus.color)} />
            )}
            <span>{selectedStatus?.label ?? 'All statuses'}</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[160px] rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1 shadow-md z-50"
            sideOffset={5}
          >
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenu.Item
                key={option.value}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer outline-none',
                  'hover:bg-[hsl(var(--accent))] focus:bg-[hsl(var(--accent))]',
                  filters.statusFilter === option.value && 'bg-[hsl(var(--accent))]'
                )}
                onClick={() => setStatusFilter(dashboard, tab, option.value)}
              >
                {option.color ? (
                  <span className={cn('h-2.5 w-2.5 rounded-full', option.color)} />
                ) : (
                  <span className="h-2.5 w-2.5" />
                )}
                {option.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Show only failures toggle */}
      <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.showOnlyFailures}
          onChange={(e) => setShowOnlyFailures(dashboard, tab, e.target.checked)}
          className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]"
        />
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-[hsl(var(--muted-foreground))]">Failures only</span>
      </label>

      {/* Divider */}
      <div className="h-6 w-px bg-[hsl(var(--border))]" />

      {/* Results count */}
      <span
        className="text-xs text-[hsl(var(--muted-foreground))]"
        aria-live="polite"
        aria-atomic="true"
      >
        {filteredRows === totalRows
          ? `${totalRows.toLocaleString()} tests`
          : `${filteredRows.toLocaleString()} of ${totalRows.toLocaleString()} tests`}
      </span>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => clearFilters(dashboard, tab)}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded hover:bg-[hsl(var(--background))]"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </button>
      )}
    </div>
  )
}
