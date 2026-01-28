import { cn } from '@frontend/lib/cn'
import type { OverallStatus } from '@shared/schemas'

interface StatusBadgeProps {
  status: OverallStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const statusConfig: Record<OverallStatus, { color: string; bg: string; label: string }> = {
  PASSING: {
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    label: 'Passing',
  },
  FAILING: {
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'Failing',
  },
  FLAKY: {
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Flaky',
  },
  STALE: {
    color: 'text-gray-700 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    label: 'Stale',
  },
}

const sizeConfig = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

const labelSizeConfig = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
}

export function StatusBadge({ status, size = 'md', showLabel = false, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  if (showLabel) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          config.bg,
          config.color,
          labelSizeConfig[size],
          className
        )}
      >
        <span className={cn('rounded-full', sizeConfig[size], getStatusDotColor(status))} />
        {config.label}
      </span>
    )
  }

  return (
    <span
      className={cn('inline-block rounded-full', sizeConfig[size], getStatusDotColor(status), className)}
      title={config.label}
    />
  )
}

function getStatusDotColor(status: OverallStatus): string {
  switch (status) {
    case 'PASSING':
      return 'bg-green-500'
    case 'FAILING':
      return 'bg-red-500'
    case 'FLAKY':
      return 'bg-orange-500'
    case 'STALE':
      return 'bg-gray-500'
  }
}

// Skeleton for loading state
export function StatusBadgeSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn('inline-block rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse', sizeConfig[size])}
    />
  )
}
